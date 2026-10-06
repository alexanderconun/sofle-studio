// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;

use futures::lock::Mutex;
use tauri::{Emitter, WindowEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Shortcut, ShortcutState};

mod transport;
use transport::commands::{transport_close, transport_send_data, ActiveConnection};

use transport::gatt::{gatt_connect, gatt_list_devices};
use transport::serial::{serial_connect, serial_list_devices};

// Writes an exported layout to ~/Downloads and returns the full path.
#[tauri::command]
fn save_layout(name: String, contents: String) -> Result<String, String> {
    if name.contains('/') || name.contains("..") {
        return Err("invalid file name".into());
    }
    let home = env::var("HOME").map_err(|e| e.to_string())?;
    let path = std::path::Path::new(&home).join("Downloads").join(name);
    std::fs::write(&path, contents).map_err(|e| e.to_string())?;
    Ok(path.display().to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_cli::init())
        // The keyboard's Lower/Raise keys also hold F18/F19 (see zmk-sofle
        // keymap); forward those to the floating layer map.
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    let key = if shortcut.key == Code::F18 { "lower" } else { "raise" };
                    let _ = app.emit("layer-key", (key, event.state == ShortcutState::Pressed));
                })
                .build(),
        )
        .setup(|app| {
            for code in [Code::F18, Code::F19] {
                app.global_shortcut().register(Shortcut::new(None, code))?;
            }
            Ok(())
        })
        // Closing the floating map just hides it so it can be reopened.
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "overlay" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .manage(ActiveConnection {
            conn: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            transport_send_data,
            transport_close,
            gatt_list_devices,
            gatt_connect,
            serial_list_devices,
            serial_connect,
            save_layout,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
