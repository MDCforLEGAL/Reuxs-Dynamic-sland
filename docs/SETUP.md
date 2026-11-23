# ReuXs — Kurulum ve Geliştirme Rehberi

## 1. Gereksinimler

### Windows kapsülü
- Windows 10/11 (WebView2 çalışma zamanı)
- Node.js 20+
- Rust stable (`rustup default stable`) + MSVC Build Tools
- Tauri CLI (proje `windows/package.json` içinde `@tauri-apps/cli` olarak gelir)

### Android kapsülü
- JDK 17
- Android SDK: `platforms;android-35`, `build-tools;35.0.0`
- Gradle 8.10+ (Android Studio ile gelen Gradle ya da `gradle` CLI)

## 2. Windows

```bash
cd windows
npm install
npm run tauri:dev      # şeffaf, çerçevesiz, her zaman üstte pencere
npm run tauri:build    # .msi + NSIS .exe  -> src-tauri/target/release/bundle
```

Yalnızca arayüzü tarayıcıda denemek için:

```bash
cd windows
npm run dev            # http://localhost:1420
```

Tarayıcıda çalışırken arka plana masaüstü benzeri koyu bir zemin çizilir; Tauri
penceresinde arka plan tamamen şeffaftır.

### Pencere davranışı
`windows/src-tauri/tauri.conf.json` içinde tanımlıdır: `transparent`, `decorations: false`,
`alwaysOnTop: true`, `skipTaskbar: true`, `resizable: false`. Konumlandırma
`src-tauri/src/lib.rs` içindeki `position_top_center` fonksiyonuyla yapılır (birincil
monitörün üst-ortası, 16 px boşluk). Rust tarafı bilinçli olarak minimal tutuldu:
Win32 çağrısı yok, tüm animasyon/zamanlayıcı mantığı React tarafında.

## 3. Android

```bash
cd android
gradle assembleDebug
# çıktı: app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Gradle wrapper jar'ı depoda tutulmaz (ikili dosya). İsterseniz bir kez üretin:

```bash
cd android && gradle wrapper --gradle-version 8.10.2
```

### İzinler
1. **Ekran üstü (SYSTEM_ALERT_WINDOW)** — kapsül overlay'i için zorunlu.
   Uygulama içindeki "Ekran üstü kapsül → İzin ver" düğmesi ilgili ayar sayfasını açar.
2. **Bildirim erişimi** — isteğe bağlı; bekleyen bildirim sayısını gösterir.
   `Ayarlar → Bildirim erişimi → ReuXs`.
3. **Bildirim izni (Android 13+)** — ön plan servisinin bildirimi için.

"Kapsülü başlat" düğmesi `CapsuleOverlayService`'i ön plan servisi olarak başlatır ve
kapsülü ön kamera deliğinin etrafına, ekranın üst-ortasına çizer. Kapsüle dokunmak
genişletir, tekrar dokunmak daraltır.

## 4. Ortak çekirdek (`/core`)

Platform bağımsız durum makinesi, zamanlayıcı, tema belirteçleri ve güncelleme denetleyicisi
burada yaşar:

- `core/src/capsule.ts` — `idle | compact | expanded | split-bubble` geçişleri
- `core/src/timer.ts` — zaman damgası tabanlı (kaymayan) zamanlayıcı
- `core/src/update.ts` — GitHub `releases/latest` denetimi + semver karşılaştırması
- `core/src/theme.ts` — Crimson & Obsidian belirteçleri (Android `CapsuleTheme.kt` aynası)
- `core/capsule.schema.json` — JSON şeması

Android tarafında aynı kurallar `CapsuleState.kt` / `CapsuleRuntime.kt` içinde birebir uygulanır.

## 5. Güncelleme denetleyicisi

Her iki uygulama açılışta `https://api.github.com/repos/MDCforLEGAL/Reuxs-Dynamic-sland/releases/latest`
adresine **anahtarsız** istek atar. Yeni sürüm varsa kapsülde kırmızı-siyah
**"Güncelleme Mevcut"** rozeti görünür; tıklanınca varsayılan tarayıcıda indirme sayfası açılır.

Yeni sürüm yayınlama (etiket push'u ile tamamen otomatik) için
[RELEASE.md](RELEASE.md) bölümüne bakın.

## 6. Simgeler

```bash
node tools/generate-icons.mjs
```

Bağımlılık kullanmadan `windows/src-tauri/icons` altına PNG + ICO üretir
(Android tarafı vektör adaptive icon kullanır).
