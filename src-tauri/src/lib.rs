mod fs;
mod pty;
mod commands;

use commands::{FsWatcher, PtyState};
use pty::PtyManager;
use std::sync::Mutex;

pub struct OpenedFile(pub Mutex<Option<String>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Check for file path from command-line arguments (macOS open with...)
    let args: Vec<String> = std::env::args().collect();
    let opened_file = if args.len() > 1 {
        let path = &args[1];
        if path.ends_with(".md") || path.ends_with(".markdown") {
            Some(path.clone())
        } else {
            None
        }
    } else {
        None
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(FsWatcher(Mutex::new(None)))
        .manage(PtyState(Mutex::new(PtyManager::new())))
        .manage(OpenedFile(Mutex::new(opened_file)))
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
