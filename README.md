# ReuXs

**Material Capsule (Dynamic Island) for Windows and Android — low footprint, open source, MIT.**

ReuXs brings the capsule idea to both platforms: a compact pill that lives at the top-center of your screen, expands with springy motion into a status + quick-timer surface, and can split into two floating bubbles. Everything is painted in the **Crimson & Obsidian** theme: deep matte black bleeding into dark blood red, hairline translucent crimson borders and a soft red ambient glow when active.

| Platform | Stack | Shell |
| --- | --- | --- |
| Windows | Tauri v2 + Rust + React 18 + TypeScript + TailwindCSS + Framer Motion | Frameless, transparent, always-on-top window at the top-center of the screen |
| Android | Kotlin + Jetpack Compose | Foreground overlay (`SYSTEM_ALERT_WINDOW`) drawn around the camera cutout, optional `NotificationListenerService` |

## Monorepo layout

```
core/        Platform independent capsule state machine (idle/compact/expanded/split-bubble),
             timer model, theme tokens, settings model, album palette, update checker
windows/     Tauri v2 shell (capsule window + control panel window) + React/TS UI
android/     Kotlin + Compose app: control panel (MainActivity) + overlay capsule service
site/        Static ReuXs site, published to the `gh-pages` branch by pages.yml
docs/        Setup, architecture and release guides
tools/       Dependency-free icon generator
```

## Features

- **Dynamic status**: live clock, battery percentage, "ReuXs aktif" status badge.
- **Live music module** (zero secrets): the capsule reads the operating system's media session — Windows **SMTC** (`Windows.Media.Control`) and Android **MediaSessionManager**. Title, artist, album cover, play state and position arrive in real time; play/pause is forwarded to the real player.
- **Adaptive palette**: the cover is sampled locally (dominant + accent colour) and the capsule gradient/glow glides to those colours. Toggle it off and ReuXs falls back to the default Crimson & Obsidian theme.
- **Music visualizer**: optional bars or wave animation inside the capsule, on by default, switchable from the panel.
- **Independent control panel**: a full settings window (Windows) / screen (Android) — position, scale, opacity, blur, radius, glow, theme mode (crimson / OLED / custom / album), music switches, autostart, hide capsule and update check. Changes apply live and persist locally (`localStorage` on Windows, SharedPreferences on Android).
- **Quick timer**: start / pause / reset, 1dk–5dk–15dk presets, drift-free timestamp math.
- **Quick actions**: split into two bubbles, 25-minute focus preset, update check.
- **In-app updater**: on launch ReuXs reads `releases/latest` from the GitHub API, asks when a newer version exists and links straight to the `.apk` / installer asset.
- **No command-line secrets, no signing**: builds are unsigned by design. Only the built-in `GITHUB_TOKEN` is required; releases can be fully automated with an optional GitHub-UI-generated `RELEASE_TOKEN`.

Website: https://mdcforlegal.github.io/Reuxs-Dynamic-sland/ (served from the `gh-pages` branch, source in [`site/`](site)).

## Quick start

```bash
# Windows capsule + control panel (dev)
npm --prefix windows install
npm run tauri:dev          # needs Rust + WebView2

# Windows capsule (browser preview of the UI only)
npm run dev

# Android (needs JDK 17 + Android SDK)
cd android && gradle assembleDebug
```

Full instructions: [docs/SETUP.md](docs/SETUP.md) · Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Releases: [docs/RELEASE.md](docs/RELEASE.md)

## Releases

Releases are automatic. Once the optional `RELEASE_TOKEN` secret is set (a fine-grained token generated in the GitHub UI, `Contents: Read and write`), just bump the version in `windows/package.json` and push to `main`: [auto-release.yml](.github/workflows/auto-release.yml) creates the `v<version>` tag, [release.yml](.github/workflows/release.yml) builds both platforms and publishes the GitHub Release with the installers attached.

Without the secret you can still release by pushing a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

- Windows: `.msi` and NSIS `.exe` (Tauri, unsigned)
- Android: `ReuXs-<tag>.apk` (debug-signed Gradle build, installable)

The build workflow uses only the built-in `GITHUB_TOKEN` and can also be started from **Actions → Release → Run workflow** or by publishing a release manually.

## License

[MIT](LICENSE) © ReuXs Contributors
