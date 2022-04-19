#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{sync::Mutex, collections::HashMap};

use aerospike::{Client, ClientPolicy, Bins, ScanPolicy};

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

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct SparrowQuery {
    ns: String,
    set: String,
    bins: Vec<String>,
    filter: HashMap<String, String>
}

#[tauri::command]
fn connect(state: tauri::State<AppState>, payload: ConnectPayload) -> Result<String, String> {
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
    let client = Client::new(&cpolicy, &payload.hosts).map_err(|e| e.to_string())?;
    let mut as_client = state.as_client.lock().unwrap();
    *as_client = Some(client);

    Ok("Done".into())
}

#[tauri::command]
fn disconnect(state: tauri::State<AppState>) -> Result<String, String> {
    let mut as_client = state.as_client.lock().unwrap();
    as_client.as_ref().unwrap().close();
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
        
        result.push(ASNode{ 
            name: n.name().to_owned(),
            namespaces: namespaces.get("namespaces").unwrap().split(";").map(|ns|  ns.to_owned()).collect()
        });
    }
    Ok(result)
}

#[tauri::command]
fn get_sets(state: tauri::State<AppState>, payload: ListSetsPayload) -> Result<Vec<String>, String> {
    let as_client = state.as_client.lock().unwrap();
    let c = as_client.as_ref().unwrap();
    let node = c.get_node(&payload.node).unwrap();
    let mut result = vec![];
    let set_key = format!("sets/{}", payload.ns);
    let sets = c.info(&[&set_key], &node.host()).unwrap();
    let value = sets.get(&set_key).unwrap();
    let set_split: Vec<&str> = value.split(";").collect();
    for ss in set_split {
        let prop_split: Vec<&str> = ss.split(":").collect();
        for ps in prop_split {
            if ps.starts_with("set=") {
                let pair: Vec<&str> = ps.split("=").collect();
                result.push(pair.get(1).unwrap().to_string());
            }
        }
    }

    Ok(result)
}

#[tauri::command]
fn query_set(state: tauri::State<AppState>, query: SparrowQuery) -> Result<Vec<String>, String> {
    let as_client = state.as_client.lock().unwrap();
    let c = as_client.as_ref().unwrap();
    let mut scan_policy = ScanPolicy::default();
    scan_policy.scan_percent = 1;
    scan_policy.record_queue_size = 10;
    scan_policy.max_concurrent_nodes = 0;
    match c.scan(&scan_policy, &query.ns, &query.set, Bins::All) {
        Ok(records) => {
            let mut count = 0;
            for record in &*records {
                match record {
                    Ok(record) => {
                        count += 1;
                        println!("Record: {}", record);
                    },
                    Err(err) => panic!("Error executing scan: {}", err),
                }
            }
            println!("Records: {}", count);
        },
        Err(err) => println!("Failed to execute scan: {}", err),
    }
    Ok(vec![])
}


fn main() {
    tauri::Builder::default()
        .manage(AppState {
            as_client: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![connect, get_node_info, disconnect, get_sets, query_set])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
