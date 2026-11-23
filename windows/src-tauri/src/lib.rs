//! ReuXs Windows shell.
//!
//! Deliberately tiny: window placement plus one command that opens the release
//! page in the default browser. All capsule UI, animation and timer logic lives
//! in the React frontend, so there is no raw Win32 interop to maintain here.

use tauri::{LogicalPosition, Manager, WebviewWindow};

fn position_top_center(window: &WebviewWindow) -> tauri::Result<()> {
    if let Some(monitor) = window.primary_monitor()? {
        let scale = monitor.scale_factor();
        let monitor_size = monitor.size().to_logical::<f64>(scale);
        let window_size = window.outer_size()?.to_logical::<f64>(scale);
        let x = ((monitor_size.width - window_size.width) / 2.0).max(0.0);
        window.set_position(LogicalPosition::new(x, 16.0))?;
    }
    Ok(())
}

/// Opens an http(s) URL in the user's default browser.
#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("only http(s) URLs are allowed".into());
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|error| error.to_string())?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|error| error.to_string())?;
        return Ok(());
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|error| error.to_string())?;
        return Ok(());
    }

    #[allow(unreachable_code)]
    Err("unsupported platform".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_external_url])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = position_top_center(&window);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ReuXs");
}
