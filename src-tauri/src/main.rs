#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{collections::HashMap, sync::Mutex};

use aerospike::{
    as_eq, as_key, as_val,
    expressions::{self, bool_val, int_bin},
    BatchPolicy, BatchRead, Bins, Client, ClientPolicy, QueryPolicy, ScanPolicy, Statement,
};
use tauri::{AboutMetadata, Menu, MenuEntry, MenuItem, Submenu};

struct AppState {
    as_client: Mutex<Option<Client>>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct ConnectPayload {
    hosts: String,
    port: i64,
    username: Option<String>,
    password: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct ASNode {
    name: String,
    namespaces: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct ListSetsPayload {
    ns: String,
    node: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, Default)]
struct SetData {
    set: String,
    objects: String,
    size_bytes: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct SparrowQuery {
    ns: String,
    set: String,
    #[serde(alias = "$select")]
    bins: Option<Vec<String>>,
    #[serde(alias = "$pk")]
    pk: Option<Vec<String>>,
    #[serde(alias = "$eq")]
    eq: Option<HashMap<String, serde_json::Value>>,
    #[serde(alias = "$ttl")]
    ttl: Option<bool>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct ConnectResponse {
    ok: bool,
    message: String,
}

#[tauri::command]
fn connect(
    state: tauri::State<AppState>,
    payload: ConnectPayload,
) -> Result<ConnectResponse, String> {
    let cpolicy = if payload.username.is_some() && payload.password.is_some() {
        let mut p = ClientPolicy::default();
        p.set_user_password(
            payload.username.unwrap().clone(),
            payload.password.unwrap().clone(),
        )
        .unwrap();
        p
    } else {
        ClientPolicy::default()
    };
    let client = Client::new(&cpolicy, &payload.hosts);
    if client.is_err() {
        return Ok(ConnectResponse {
            ok: false,
            message: client.err().unwrap().to_string(),
        });
    }
    let client = client.unwrap();
    let mut as_client = state.as_client.lock().unwrap();
    *as_client = Some(client);

    Ok(ConnectResponse {
        ok: true,
        message: "Connected".into(),
    })
}

#[tauri::command]
fn disconnect(state: tauri::State<AppState>) -> Result<String, String> {
    let mut as_client = state.as_client.lock().unwrap();
    as_client
        .as_ref()
        .unwrap()
        .close()
        .map_err(|e| e.to_string())?;
    *as_client = None;

    Ok("Done".into())
}

#[tauri::command]
fn get_node_info(state: tauri::State<AppState>) -> Result<Vec<ASNode>, String> {
    let as_client = state.as_client.lock().unwrap();
    let c = as_client.as_ref().unwrap();
    let nodes = c.nodes();
    let mut result = vec![];
    for n in nodes {
        let namespaces = c.info(&["namespaces"], &n.host()).unwrap();
        result.push(ASNode {
            name: n.name().to_owned(),
            namespaces: namespaces
                .get("namespaces")
                .unwrap()
                .split(";")
                .map(|ns| ns.to_owned())
                .collect(),
        });
    }
    Ok(result)
}

#[tauri::command]
fn get_sets(
    state: tauri::State<AppState>,
    payload: ListSetsPayload,
) -> Result<Vec<SetData>, String> {
    let as_client = state.as_client.lock().unwrap();
    let c = as_client.as_ref().unwrap();
    let node = c.get_node(&payload.node).unwrap();
    let mut result = vec![];
    let set_key = format!("sets/{}", payload.ns);
    let sets = c.info(&[&set_key], &node.host()).unwrap();
    let value = sets.get(&set_key).unwrap();
    // println!("set value: {}", value);
    let set_split: Vec<&str> = value.split(";").collect();
    for ss in set_split {
        let prop_split: Vec<&str> = ss.split(":").collect();
        let mut set_data = SetData::default();
        for ps in prop_split {
            if ps.starts_with("set=") {
                let pair: Vec<&str> = ps.split("=").collect();
                set_data.set = pair.get(1).unwrap().to_string();
            }
            if ps.starts_with("objects=") {
                let pair: Vec<&str> = ps.split("=").collect();
                set_data.objects = pair.get(1).unwrap().to_string();
            }
            if ps.starts_with("memory_data_bytes=") {
                let pair: Vec<&str> = ps.split("=").collect();
                set_data.size_bytes = pair.get(1).unwrap().to_string();
                // FIXME: looks ugly, find a way to push at the end of the loop
                result.push(set_data);
                set_data = SetData::default();
            }
        }
    }

    Ok(result)
}

#[tauri::command]
fn scan_set(
    state: tauri::State<AppState>,
    ns: String,
    set: String,
) -> Result<Vec<HashMap<String, String>>, String> {
    let as_client = state.as_client.lock().unwrap();
    let c = as_client.as_ref().unwrap();

    let mut sp = ScanPolicy::default();
    sp.socket_timeout = 1;
    let rs = c.scan(&sp, &ns, &set, Bins::All).unwrap();
    let mut result = vec![];
    for r in &*rs {
        let rec = r.unwrap();
        let mut map_r = HashMap::new();
        for k in rec.bins.keys() {
            map_r.insert(k.clone(), rec.bins[k].to_string());
        }

        result.push(map_r);
    }

    return Ok(result);
}

#[tauri::command]
fn query_set(
    state: tauri::State<AppState>,
    query: SparrowQuery,
) -> Result<Vec<HashMap<String, String>>, String> {
    let as_client = state.as_client.lock().unwrap();
    let c = as_client.as_ref().unwrap();
    let mut batch_reads = vec![];
    if query.pk.is_none() && query.bins.is_none() && query.eq.is_none() {
        return Err("Nothing to execute!".into());
    }
    let bins = if query.bins.is_some() {
        Bins::Some(query.bins.unwrap())
    } else {
        Bins::All
    };

    if let Some(pk) = query.pk {
        if pk.len() == 0 {
            return Err(String::from("Cannot query without primary key"));
        }
        for k in pk {
            batch_reads.push(BatchRead::new(as_key!(&query.ns, &query.set, k), &bins));
        }
    }

    let mut result = vec![];

    if let Some(eq_exp) = query.eq {
        let mut stmt = Statement::new(&query.ns, &query.set, bins);
        for (k, dyn_val) in eq_exp {
            match dyn_val {
                serde_json::Value::Null => continue,
                serde_json::Value::Bool(v) => stmt.add_filter(as_eq!(&k, v)),
                serde_json::Value::Number(v) => {
                    if let Some(unsigned_v) = v.as_i64() {
                        stmt.add_filter(as_eq!(&k, unsigned_v))
                    }
                }
                serde_json::Value::String(v) => stmt.add_filter(as_eq!(&k, v)),
                serde_json::Value::Array(_) => continue,
                serde_json::Value::Object(_) => continue,
            }
        }

        println!("stmt constructed: {:?}", stmt.filters);

        let qp = QueryPolicy::default();
        match c.query(&qp, stmt) {
            Ok(rs) => {
                for r in &*rs {
                    match r {
                        Ok(rec) => {
                            let mut map_r = HashMap::new();
                            for k in rec.bins.keys() {
                                map_r.insert(k.clone(), rec.bins[k].to_string());
                            }

                            result.push(map_r);
                        }
                        Err(e) => return Err(e.to_string()),
                    }
                }

                return Ok(result);
            }
            Err(e) => return Err(e.to_string()),
        }
    }

    let mut query_policy = BatchPolicy::default();

    // if let Some(ttl) = query.ttl {
    //     if ttl == true {
    //         println!("setting ttl expression");
    //         query_policy.filter_expression = Some(expressions::ttl());
    //     }
    // }

    match c.batch_get(&query_policy, batch_reads) {
        Ok(records) => {
            for record in records {
                if record.record.is_some() {
                    let r = record.record.unwrap();
                    println!("Records: {:?}", r);
                    let mut map_r = HashMap::new();
                    for k in r.bins.keys() {
                        map_r.insert(k.clone(), r.bins[k].to_string());
                    }

                    result.push(map_r);
                }
            }
        }
        Err(err) => println!("Failed to execute get: {}", err),
    }
    Ok(result)
}

fn main() {
    let ctx = tauri::generate_context!();
    tauri::Builder::default()
        .manage(AppState {
            as_client: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            connect,
            get_node_info,
            disconnect,
            get_sets,
            query_set,
            scan_set,
        ])
        .menu(Menu::with_items([
            #[cfg(target_os = "macos")]
            MenuEntry::Submenu(Submenu::new(
                &ctx.package_info().name,
                Menu::with_items([
                    MenuItem::About(ctx.package_info().name.clone(), AboutMetadata::default())
                        .into(),
                    MenuItem::Separator.into(),
                    MenuItem::Services.into(),
                    MenuItem::Separator.into(),
                    MenuItem::Hide.into(),
                    MenuItem::HideOthers.into(),
                    MenuItem::ShowAll.into(),
                    MenuItem::Separator.into(),
                    MenuItem::Quit.into(),
                ]),
            )),
            MenuEntry::Submenu(Submenu::new(
                "Edit",
                Menu::with_items([
                    MenuItem::Undo.into(),
                    MenuItem::Redo.into(),
                    MenuItem::Separator.into(),
                    MenuItem::Cut.into(),
                    MenuItem::Copy.into(),
                    MenuItem::Paste.into(),
                    #[cfg(not(target_os = "macos"))]
                    MenuItem::Separator.into(),
                    MenuItem::SelectAll.into(),
                ]),
            )),
        ]))
        .run(ctx)
        .expect("error while running tauri application");
}
