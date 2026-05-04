use crate::fs;
use crate::pty::PtyManager;
use tauri::State;
use std::sync::Mutex;

pub struct FsWatcher(pub Mutex<Option<notify::RecommendedWatcher>>);
pub struct PtyState(pub Mutex<PtyManager>);

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_file(&path)
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write_file(&path, &content)
}

#[tauri::command]
pub fn read_dir(path: String) -> Result<Vec<fs::DirEntry>, String> {
    fs::read_dir(&path)
}

#[tauri::command]
pub fn read_dir_recursive(path: String) -> Result<Vec<fs::DirEntry>, String> {
    fs::read_dir_recursive(&path)
}

#[tauri::command]
pub async fn open_folder_dialog(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app_handle.dialog().file().blocking_pick_folder();
    Ok(path.map(|p| p.to_string()))
}

#[tauri::command]
pub fn watch_folder(
    path: String,
    state: State<'_, FsWatcher>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let watcher = fs::start_watcher(path, app_handle)?;
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = Some(watcher);
    Ok(())
}

#[tauri::command]
pub fn unwatch_folder(state: State<'_, FsWatcher>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}

#[tauri::command]
pub fn pty_spawn(state: State<'_, PtyState>, app_handle: tauri::AppHandle) -> Result<(), String> {
    let mut manager = state.0.lock().map_err(|e| e.to_string())?;
    manager.spawn(app_handle)
}

#[tauri::command]
pub fn pty_write(state: State<'_, PtyState>, data: String) -> Result<(), String> {
    let mut manager = state.0.lock().map_err(|e| e.to_string())?;
    manager.write_input(&data)
}

#[tauri::command]
pub fn pty_resize(state: State<'_, PtyState>, rows: u16, cols: u16) -> Result<(), String> {
    let manager = state.0.lock().map_err(|e| e.to_string())?;
    manager.resize(rows, cols)
}
