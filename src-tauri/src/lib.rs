mod fs;
mod pty;
mod commands;

use commands::{FsWatcher, PtyState};
use pty::PtyManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(FsWatcher(std::sync::Mutex::new(None)))
        .manage(PtyState(std::sync::Mutex::new(PtyManager::new())))
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
