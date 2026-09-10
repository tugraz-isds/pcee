use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{Manager, PhysicalPosition, PhysicalSize, Position, Size, WebviewWindow, WindowEvent};

const WINDOW_STATE_FILE: &str = "window-state.json";

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct WindowState {
    width: u32,
    height: u32,
    x: i32,
    y: i32,
}

fn window_state_path(window: &WebviewWindow) -> Option<std::path::PathBuf> {
    window
        .app_handle()
        .path()
        .app_local_data_dir()
        .ok()
        .map(|directory| directory.join(WINDOW_STATE_FILE))
}

fn restore_window_state(window: &WebviewWindow) {
    let Some(path) = window_state_path(window) else {
        return;
    };

    let Ok(contents) = fs::read_to_string(path) else {
        return;
    };
    let Ok(state) = serde_json::from_str::<WindowState>(&contents) else {
        return;
    };

    // Ignore corrupt or implausibly small dimensions instead of opening an
    // unusable window. Position may be negative on multi-monitor setups.
    if state.width >= 320 && state.height >= 240 {
        let _ = window.set_size(Size::Physical(PhysicalSize::new(state.width, state.height)));
        let _ = window.set_position(Position::Physical(PhysicalPosition::new(state.x, state.y)));
    }
}

fn persist_window_state(window: &WebviewWindow) {
    let (Ok(size), Ok(position), Some(path)) = (
        window.outer_size(),
        window.outer_position(),
        window_state_path(window),
    ) else {
        return;
    };

    let Some(directory) = path.parent() else {
        return;
    };
    if fs::create_dir_all(directory).is_err() {
        return;
    }

    let state = WindowState {
        width: size.width,
        height: size.height,
        x: position.x,
        y: position.y,
    };
    let Ok(contents) = serde_json::to_string(&state) else {
        return;
    };
    let _ = fs::write(path, contents);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                restore_window_state(&window);
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if matches!(event, WindowEvent::Moved(_) | WindowEvent::Resized(_)) {
                if let Some(webview_window) = window.app_handle().get_webview_window(window.label())
                {
                    persist_window_state(&webview_window);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
