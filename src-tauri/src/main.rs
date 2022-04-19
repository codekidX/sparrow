#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::Mutex;

use aerospike::{Client, ClientPolicy};

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

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            as_client: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![connect])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
