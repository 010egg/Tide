mod fs;
mod pty;
mod commands;

use commands::{FsWatcher, PtyState};
use pty::PtyManager;
use std::sync::Mutex;
use tauri::Emitter;
use tauri::Manager;

pub struct OpenedFile(pub Mutex<Option<String>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(FsWatcher(Mutex::new(None)))
        .manage(PtyState(Mutex::new(PtyManager::new())))
        .manage(OpenedFile(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::write_file,
            commands::read_dir,
            commands::read_dir_recursive,
            commands::open_folder_dialog,
            commands::watch_folder,
            commands::unwatch_folder,
            commands::pty_spawn,
            commands::pty_write,
            commands::pty_resize,
            commands::get_opened_file,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Opened { urls } = event {
                // macOS sends file URLs when opening files via Finder/"Open With"
                if let Some(url) = urls.first() {
                    let path = url.to_file_path()
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_else(|_| url.to_string());
                    if let Some(state) = app_handle.try_state::<OpenedFile>() {
                        if let Ok(mut guard) = state.0.lock() {
                            *guard = Some(path.clone());
                        }
                    }
                    // Also emit event so frontend can react immediately
                    let _ = app_handle.emit("file-opened", path);
                }
            }
        });
}
