# ReuXs — Mimari

## Katmanlar

```
                     ┌───────────────────────────────┐
                     │  core/  (platform bağımsız)   │
                     │  durum makinesi · zamanlayıcı │
                     │  tema · güncelleme denetimi   │
                     └───────────┬───────────────────┘
                 TypeScript import│Kotlin aynası (elle senkron)
        ┌────────────────────────┴────────────────────────┐
        │                                                 │
┌───────▼────────┐                               ┌────────▼────────┐
│ windows/       │                               │ android/        │
│ React + Framer │                               │ Compose +       │
│ Tauri penceresi│                               │ Overlay Service │
└───────┬────────┘                               └────────┬────────┘
        │ Rust shell (minimal)                            │ Android SDK
```

## Kapsül durum makinesi

`idle → compact → expanded → split-bubble`

| Durum | Görünüm | Tetikleyici |
| --- | --- | --- |
| `idle` | Hiçbir şey çizilmez | Kapsül kapatıldı |
| `compact` | 268 px pill: logo, zamanlayıcı, pil, güncelleme noktası | `activate` / `collapse` |
| `expanded` | 420 px kart: saat, durum rozeti, zamanlayıcı, hızlı eylemler, güncelleme rozeti | `expand` / `open-module` |
| `split-bubble` | İki ayrı baloncuk (durum + zamanlayıcı) | `split` |

Geçişler `core/src/capsule.ts` içindeki `CAPSULE_TRANSITIONS` tablosundadır; izin
verilmeyen olaylar durumu değiştirmez. Android'de birebir aynısı `CapsuleState.reduce()`
içinde uygulanır. Şema: `core/capsule.schema.json`.

## Zamanlayıcı

Durum yalnızca `startedAt` (epoch / `elapsedRealtime`) ve `remainingMs` tutar. UI 250 ms'de
bir yeniden hesaplar, böylece düşük frekanslı tick kaymaya yol açmaz. Duraklatıldığında
kalan süre sabitlenir, sıfırlandığında süre başa döner.

Windows'ta `useTimer` yalnızca zamanlayıcı çalışırken interval açar. Saat `useClock` ile
dakikada 4 kez okunur. Android'de overlay servisi 250 ms'lik tek bir coroutine ticker
çalıştırır; pil, `ACTION_BATTERY_CHANGED` sticky broadcast'inden okunur (polling yok).

## Windows kabuğu (Tauri v2)

- `tauri.conf.json`: şeffaf + çerçevesiz + always-on-top + görev çubuğunda gizli pencere,
  `520×420`, `resizable: false`.
- CSP yalnızca `https://api.github.com` bağlantısına izin verir; başka ağ erişimi yok.
- `lib.rs` iki iş yapar: pencereyi üst-ortaya konumlandırmak ve `open_external_url`
  komutuyla http(s) bağlantısını varsayılan tarayıcıda açmak. Win32 interop yok.
- Yetenekler `capabilities/default.json` ile minimumda: `core:default` +
  `core:window:allow-start-dragging`.

## Android katmanı

- `CapsuleOverlayService` — `TYPE_APPLICATION_OVERLAY` penceresini `MATCH_PARENT` genişlik,
  `TOP | CENTER_HORIZONTAL` yerçekimi ve `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES` ile
  oluşturur. `specialUse` ön plan servisi olarak çalışır (bildirim zorunlu, düşük öncelikli).
- `ComposeView` bir overlay penceresinde yaşadığı için `OverlayLifecycleOwner` ile
  Lifecycle / ViewModelStore / SavedState sahipleri sağlanır.
- `ReuxsNotificationListener` yalnızca `activeNotifications.size` okur, içerik okumaz.
- Kapsül tıklamaları `CapsuleRuntime` (StateFlow) üzerinden yayılır; ana ekran ve overlay
  aynı durumu paylaşır.

## Tema

`core/src/theme.ts` ve `android/.../CapsuleTheme.kt` aynı belirteçleri taşır:

- zemin: `#000000` → `#09090B` → `#450A0A` / `#7F1D1D` gradyanı
- kenarlık: `rgba(220, 38, 38, 0.35)`, genişlemiş durumda `rgba(248, 113, 113, 0.55)`
- parlama: `rgba(239, 68, 68, 0.35)` ambient gölge
- metin: `#FAFAFA` / `#A1A1AA`; vurgu `#EF4444`

Hareket: `spring(stiffness: 420, damping: 34, mass: 0.9)` — tok, aşırı salınımsız.

## Güncelleme akışı

1. Açılıştan ~1.2 s sonra `GET https://api.github.com/repos/MDCforLEGAL/Reuxs-Dynamic-sland/releases/latest`
2. `tag_name` ile yerel sürüm semver olarak karşılaştırılır.
3. Yeni sürüm varsa kırmızı-siyah rozet; tıklanınca `html_url` (yoksa releases sayfası)
   varsayılan tarayıcıda açılır. İstek başarısız olursa rozet gösterilmez, hata sessizce
   yutulur (çevrimdışı kullanım bozulmaz).
