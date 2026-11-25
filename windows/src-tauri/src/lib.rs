//! ReuXs Windows shell.
//!
//! Two windows, one process:
//! * `main`   — the frameless, transparent, always-on-top capsule (display only).
//! * `settings` — the independent ReuXs control panel (all customisation).
//!
//! Rust owns the window placement (top-centre by default, pixel offsets and
//! scale from the control panel) and the SMTC media bridge. Every piece of UI,
//! animation and business logic lives in React.

mod media;

use std::sync::Mutex;

use media::NowPlaying;
use tauri::{LogicalPosition, LogicalSize, Manager, WebviewWindow};

/// Capsule base frame at scale 1. Mirrors `CAPSULE_FRAME` in the frontend.
const CAPSULE_BASE_WIDTH: f64 = 520.0;
const CAPSULE_BASE_HEIGHT: f64 = 420.0;
const CAPSULE_TOP_INSET: f64 = 16.0;

static NOW_PLAYING: Mutex<NowPlaying> = Mutex::new(NowPlaying::empty());

fn clamp_scale(scale: f64) -> f64 {
    if scale.is_finite() {
        scale.clamp(0.75, 1.35)
    } else {
        1.0
    }
}

/// Places the capsule over the primary monitor: horizontally centred plus the
/// user offset, `topInset + userOffset` from the top, sized to the scale.
fn apply_layout(
    window: &WebviewWindow,
    offset_x: f64,
    offset_y: f64,
    scale: f64,
) -> tauri::Result<()> {
    let scale = clamp_scale(scale);
    let width = CAPSULE_BASE_WIDTH * scale;
    let height = CAPSULE_BASE_HEIGHT * scale;
    window.set_size(LogicalSize::new(width, height))?;

    if let Some(monitor) = window.primary_monitor()? {
        let monitor_scale = monitor.scale_factor();
        let monitor_size = monitor.size().to_logical::<f64>(monitor_scale);
        let x = (monitor_size.width - width) / 2.0 + offset_x;
        let y = CAPSULE_TOP_INSET + offset_y;
        window.set_position(LogicalPosition::new(x.max(0.0), y.max(0.0)))?;
    }
    Ok(())
}

/// Current track from the operating system's media sessions.
#[tauri::command]
fn now_playing() -> NowPlaying {
    NOW_PLAYING
        .lock()
        .map(|state| state.clone())
        .unwrap_or_else(|_| NowPlaying::empty())
}

/// Play / pause / next / previous on the active media session.
#[tauri::command]
fn media_control(action: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        media::control(&action)
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = action;
        Ok(())
    }
}

/// The capsule window, whichever window issued the command.
fn capsule_window(app: &tauri::AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "capsule window is missing".to_string())
}

/// Applies position + scale from the control panel (debounced by the caller).
#[tauri::command]
fn apply_capsule_layout(
    app: tauri::AppHandle,
    offset_x: f64,
    offset_y: f64,
    scale: f64,
) -> Result<(), String> {
    let window = capsule_window(&app)?;
    apply_layout(&window, offset_x, offset_y, scale).map_err(|error| error.to_string())
}

/// Back to the out-of-the-box position: centred, top of the primary monitor.
#[tauri::command]
fn reset_capsule_layout(app: tauri::AppHandle) -> Result<(), String> {
    let window = capsule_window(&app)?;
    apply_layout(&window, 0.0, 0.0, 1.0).map_err(|error| error.to_string())
}

/// Opens (or focuses) the independent control panel window.
#[tauri::command]
fn open_settings(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("settings")
        .ok_or_else(|| "settings window is missing".to_string())?;
    window.show().map_err(|error| error.to_string())?;
    let _ = window.unminimize();
    let _ = window.set_focus();
    Ok(())
}

/// Temporarily hides / shows the capsule without stopping the app.
#[tauri::command]
fn set_capsule_visible(app: tauri::AppHandle, visible: bool) -> Result<(), String> {
    let window = capsule_window(&app)?;
    let result = if visible { window.show() } else { window.hide() };
    result.map_err(|error| error.to_string())
}

/// Starts (or stops) ReuXs with Windows through the HKCU Run registry key.
#[tauri::command]
fn set_autostart(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;

        let exe = std::env::current_exe().map_err(|error| error.to_string())?;
        let value = format!("\"{}\"", exe.display());
        let script = if enabled {
            format!(
                "New-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' \
                 -Name 'ReuXs' -Value '{}' -PropertyType String -Force | Out-Null",
                value.replace('\'', "''")
            )
        } else {
            "Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' \
             -Name 'ReuXs' -ErrorAction SilentlyContinue"
                .to_string()
        };

        let status = std::process::Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &script])
            .creation_flags(0x0800_0000) // CREATE_NO_WINDOW
            .status()
            .map_err(|error| error.to_string())?;

        return if status.success() {
            Ok(())
        } else {
            Err("autostart registry update failed".into())
        };
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = enabled;
        Ok(())
    }
}

/// Creates a desktop + Start menu shortcut that launches ReuXs.
#[tauri::command]
fn create_shortcut() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;

        let exe = std::env::current_exe().map_err(|error| error.to_string())?;
        let target = exe.display().to_string().replace('\'', "''");
        let script = format!(
            "$ws = New-Object -ComObject WScript.Shell; \
             $target = '{target}'; \
             $desktop = [Environment]::GetFolderPath('Desktop'); \
             $link = $ws.CreateShortcut((Join-Path $desktop 'ReuXs.lnk')); \
             $link.TargetPath = $target; \
             $link.WorkingDirectory = Split-Path $target; \
             $link.Description = 'ReuXs Material Capsule'; \
             $link.Save(); \
             $programs = Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs'; \
             $start = $ws.CreateShortcut((Join-Path $programs 'ReuXs.lnk')); \
             $start.TargetPath = $target; \
             $start.WorkingDirectory = Split-Path $target; \
             $start.Save(); \
             Write-Output $desktop"
        );

        let output = std::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-WindowStyle",
                "Hidden",
                "-Command",
                &script,
            ])
            .creation_flags(0x0800_0000) // CREATE_NO_WINDOW
            .output()
            .map_err(|error| error.to_string())?;

        if !output.status.success() {
            return Err("shortcut creation failed".into());
        }
        return Ok(String::from_utf8_lossy(&output.stdout).trim().to_string());
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("shortcuts are only created on Windows".into())
    }
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

/// Polls SMTC in the background so the webview only asks for a cached value.
fn spawn_media_worker() {
    std::thread::spawn(|| {
        let mut previous = NowPlaying::empty();
        loop {
            let next = media::poll(&previous);
            previous = next.clone();
            if let Ok(mut slot) = NOW_PLAYING.lock() {
                *slot = next;
            }
            std::thread::sleep(std::time::Duration::from_millis(1000));
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_external_url,
            now_playing,
            media_control,
            apply_capsule_layout,
            reset_capsule_layout,
            open_settings,
            set_capsule_visible,
            set_autostart,
            create_shortcut
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = apply_layout(&window, 0.0, 0.0, 1.0);
            }
            if let Some(settings) = app.get_webview_window("settings") {
                let _ = settings.center();
            }
            spawn_media_worker();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ReuXs");
}
