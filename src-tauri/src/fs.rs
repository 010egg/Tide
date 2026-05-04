use notify::{Event, EventKind, RecursiveMode, Watcher};
use std::fs;
use std::path::Path;
use tauri::Emitter;

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    #[serde(rename = "isDir")]
    pub is_dir: bool,
}

pub fn read_file(path: &str) -> Result<String, String> {
    fs::read_to_string(Path::new(path)).map_err(|e| e.to_string())
}

pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    if let Some(parent) = Path::new(path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(Path::new(path), content).map_err(|e| e.to_string())
}

pub fn read_dir(path: &str) -> Result<Vec<DirEntry>, String> {
    let mut entries = Vec::new();
    let dir = Path::new(path);

    if let Ok(read_dir) = fs::read_dir(dir) {
        for entry in read_dir.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.') {
                continue;
            }
            let path = entry.path().to_string_lossy().to_string();
            let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
            entries.push(DirEntry { name, path, is_dir });
        }
    }

    entries.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.cmp(&b.name)
        }
    });

    Ok(entries)
}

pub fn read_dir_recursive(path: &str) -> Result<Vec<DirEntry>, String> {
    let mut entries = Vec::new();
    for entry in walkdir::WalkDir::new(path).max_depth(5).into_iter().filter_map(|e| e.ok()) {
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') && entry.depth() > 0 {
            continue;
        }
        entries.push(DirEntry {
            name,
            path: entry.path().to_string_lossy().to_string(),
            is_dir: entry.file_type().is_dir(),
        });
    }
    Ok(entries)
}

pub fn start_watcher(
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<notify::RecommendedWatcher, String> {
    let (tx, rx) = std::sync::mpsc::channel();

    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(event) = res {
            let relevant = matches!(
                event.kind,
                EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_)
            );
            if relevant {
                let _ = tx.send(());
            }
        }
    })
    .map_err(|e| e.to_string())?;

    watcher
        .watch(Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    let handle = app_handle.clone();
    std::thread::spawn(move || {
        let mut last = std::time::Instant::now();
        for () in rx {
            let now = std::time::Instant::now();
            if now.duration_since(last) < std::time::Duration::from_millis(300) {
                continue;
            }
            last = now;
            let _ = handle.emit("fs-change", ());
        }
    });

    Ok(watcher)
}
