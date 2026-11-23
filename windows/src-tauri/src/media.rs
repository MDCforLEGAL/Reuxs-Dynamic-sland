//! Live "now playing" bridge.
//!
//! Windows exposes the system media sessions through SMTC
//! (`Windows.Media.Control`). We read the current session's metadata and
//! play/pause state, and hand the album cover to the webview as a data URL so
//! the capsule can sample its colours without touching the network.

use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NowPlaying {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub playing: bool,
    pub position_ms: i64,
    pub duration_ms: i64,
    pub art: Option<String>,
}

impl NowPlaying {
    pub const fn empty() -> Self {
        Self {
            title: String::new(),
            artist: String::new(),
            album: String::new(),
            playing: false,
            position_ms: 0,
            duration_ms: 0,
            art: None,
        }
    }
}

/// Polls SMTC once, reusing `previous.art` when the track did not change so the
/// cover is only base64 encoded one time per track.
#[cfg(target_os = "windows")]
pub fn refresh(previous: &NowPlaying) -> NowPlaying {
    use windows::Media::Control::{
        GlobalSystemMediaTransportControlsSessionManager,
        GlobalSystemMediaTransportControlsSessionPlaybackStatus,
    };

    let manager = match GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
        .and_then(|operation| operation.get())
    {
        Ok(manager) => manager,
        Err(_) => return NowPlaying::empty(),
    };

    let session = match manager.GetCurrentSession() {
        Ok(session) => session,
        Err(_) => return NowPlaying::empty(),
    };

    let playing = session
        .GetPlaybackInfo()
        .and_then(|info| info.PlaybackStatus())
        .map(|status| status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing)
        .unwrap_or(false);

    let (position_ms, duration_ms) = match session.GetTimelineProperties() {
        Ok(timeline) => {
            let position = timeline.Position().map(|time| time.Duration / 10_000).unwrap_or(0);
            let end = timeline.EndTime().map(|time| time.Duration / 10_000).unwrap_or(0);
            (position.max(0), end.max(0))
        }
        Err(_) => (0, 0),
    };

    let props = match session.TryGetMediaPropertiesAsync().and_then(|operation| operation.get()) {
        Ok(props) => props,
        Err(_) => return NowPlaying::empty(),
    };

    let title = props.Title().map(|value| value.to_string()).unwrap_or_default();
    let artist = props.Artist().map(|value| value.to_string()).unwrap_or_default();
    let album = props.AlbumTitle().map(|value| value.to_string()).unwrap_or_default();

    if title.trim().is_empty() {
        return NowPlaying::empty();
    }

    let art = if previous.title == title && previous.artist == artist && previous.art.is_some() {
        previous.art.clone()
    } else {
        read_thumbnail(&props)
    };

    NowPlaying {
        title,
        artist,
        album,
        playing,
        position_ms,
        duration_ms,
        art,
    }
}

#[cfg(target_os = "windows")]
fn read_thumbnail(
    props: &windows::Media::Control::GlobalSystemMediaTransportControlsSessionMediaProperties,
) -> Option<String> {
    use windows::core::Interface;
    use windows::Storage::Streams::{
        DataReader, IRandomAccessStream, IRandomAccessStreamWithContentType,
    };

    const MAX_COVER_BYTES: u32 = 8 * 1024 * 1024;

    let reference = props.Thumbnail().ok()?;
    let stream: IRandomAccessStreamWithContentType = reference.OpenReadAsync().ok()?.get().ok()?;
    let mime = stream
        .ContentType()
        .map(|value| value.to_string())
        .unwrap_or_else(|_| "image/png".to_string());

    // `Size` lives on the parent interface, so switch to it explicitly.
    let input: IRandomAccessStream = stream.cast().ok()?;
    let size = input.Size().ok()?;
    if size == 0 || size > u64::from(MAX_COVER_BYTES) {
        return None;
    }
    let reader = DataReader::CreateDataReader(&input).ok()?;
    reader.LoadAsync(size as u32).ok()?.get().ok()?;

    let mut buffer = vec![0u8; size as usize];
    #[allow(unused_unsafe)]
    unsafe {
        reader.ReadBytes(&mut buffer).ok()?;
    }

    let mime = if mime.starts_with("image/") { mime } else { "image/png".to_string() };
    Some(format!("data:{mime};base64,{}", base64_encode(&buffer)))
}

/// Minimal base64 encoder: only used for album covers, no dependency needed.
#[cfg(target_os = "windows")]
fn base64_encode(bytes: &[u8]) -> String {
    const ALPHABET: &[u8; 64] =
        b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = *chunk.get(1).unwrap_or(&0) as u32;
        let b2 = *chunk.get(2).unwrap_or(&0) as u32;
        let triple = (b0 << 16) | (b1 << 8) | b2;
        out.push(ALPHABET[(triple >> 18) as usize & 63] as char);
        out.push(ALPHABET[(triple >> 12) as usize & 63] as char);
        out.push(if chunk.len() > 1 {
            ALPHABET[(triple >> 6) as usize & 63] as char
        } else {
            '='
        });
        out.push(if chunk.len() > 2 {
            ALPHABET[triple as usize & 63] as char
        } else {
            '='
        });
    }
    out
}

/// Platform-neutral entry point used by the background worker.
pub fn poll(previous: &NowPlaying) -> NowPlaying {
    #[cfg(target_os = "windows")]
    {
        return refresh(previous);
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = previous;
        NowPlaying::empty()
    }
}

/// Toggles playback on the current SMTC session.
#[cfg(target_os = "windows")]
pub fn control(action: &str) -> Result<(), String> {
    use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;

    let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
        .and_then(|operation| operation.get())
        .map_err(|error| error.to_string())?;
    let session = manager.GetCurrentSession().map_err(|error| error.to_string())?;

    match action {
        "play" => session.TryPlayAsync(),
        "pause" => session.TryPauseAsync(),
        "next" => session.TrySkipNextAsync(),
        "previous" => session.TrySkipPreviousAsync(),
        _ => session.TryTogglePlayPauseAsync(),
    }
    .map_err(|error| error.to_string())?
    .get()
    .map_err(|error| error.to_string())?;

    Ok(())
}
