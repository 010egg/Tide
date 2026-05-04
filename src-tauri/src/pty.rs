use portable_pty::{CommandBuilder, PtySize, native_pty_system};
use std::io::Read;
use std::thread;

pub struct PtyManager {
    writer: Option<Box<dyn std::io::Write + Send>>,
}

impl PtyManager {
    pub fn new() -> Self {
        PtyManager { writer: None }
    }

    pub fn spawn(&mut self, app_handle: tauri::AppHandle) -> Result<(), String> {
        use tauri::Emitter;

        let pty_system = native_pty_system();
        let pty_pair = pty_system
            .openpty(PtySize {
                rows: 24,
                cols: 80,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;

        let shell = if cfg!(target_os = "windows") {
            "pwsh.exe".to_string()
        } else {
            std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into())
        };

        let mut cmd = CommandBuilder::new(&shell);
        cmd.cwd(
            std::env::current_dir()
                .map_err(|e| e.to_string())?
        );

        let _child = pty_pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Failed to spawn shell: {}", e))?;

        drop(pty_pair.slave);

        let mut reader = pty_pair
            .master
            .try_clone_reader()
            .map_err(|e| e.to_string())?;
        let writer = pty_pair
            .master
            .take_writer()
            .map_err(|e| e.to_string())?;

        self.writer = Some(writer);

        // Spawn reader thread
        let handle = app_handle.clone();
        thread::spawn(move || {
            let mut buf = [0u8; 4096];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        let data = String::from_utf8_lossy(&buf[..n]).to_string();
                        let _ = handle.emit("pty-output", data);
                    }
                    Err(_) => break,
                }
            }
        });

        Ok(())
    }

    pub fn write_input(&mut self, data: &str) -> Result<(), String> {
        if let Some(ref mut writer) = self.writer {
            writer
                .write_all(data.as_bytes())
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn resize(&self, _rows: u16, _cols: u16) -> Result<(), String> {
        Ok(())
    }
}
