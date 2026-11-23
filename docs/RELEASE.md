# ReuXs — Sürüm Yayınlama (otomatik, sıfır secret)

## Otomatik akış (önerilen)

Tek komut; gerisini GitHub Actions yapar:

```bash
git tag v1.0.0
git push origin v1.0.0
```

1. `.github/workflows/release.yml` → `on: push: tags: ["v*"]` tetiklenir.
2. `windows-latest`: `npm ci` → `npm run tauri build` → `.msi` + NSIS `.exe`.
3. `ubuntu-latest`: JDK 17 + Android SDK + Gradle 8.10.2 → `assembleDebug` →
   `ReuXs-v1.0.0.apk`.
4. `publish`: her iki derlemenin çıktısını indirir, `gh release create` ile sürümü
   (yoksa) oluşturur, `gh release upload --clobber` ile dosyaları ekler.

Aynı iş akışı iki şekilde de elle çalıştırılabilir (ikisi de otomatik akışın aynısını
yapar, mevcut sürümün dosyalarının üzerine yazar):

- GitHub → **Actions → Release → Run workflow** ve tag gir (örn. `v1.0.0`).
- GitHub → **Releases → Draft a new release** → **Publish release**
  (`on: release: types: [published]`).

**Kullanılmayanlar:** `TAURI_SIGNING_PRIVATE_KEY`, keystore, imzalama sertifikası,
PAT, ek GitHub Secret. Yalnızca yerleşik **`GITHUB_TOKEN`** (`permissions: contents: write`)
kullanılır. Tauri paketi imzasız, APK Gradle'ın ürettiği debug anahtarıyla imzalanır
(depoya yazılmaz).

## Depo bilgileri (gömülü)

Güncelleme denetimi bu depoyu okur — **başka yerde değiştirilecek yer tutucu yok**:

| Değer | Nerede |
| --- | --- |
| `MDCforLEGAL` / `Reuxs-Dynamic-sland` | `core/src/config.ts` → `GITHUB_OWNER`, `GITHUB_REPO` |
| aynı | `android/app/src/main/res/values/strings.xml` → `reuxs_repo_owner`, `reuxs_repo_name` |
| aynı | `windows/src-tauri/Cargo.toml` → `repository` |
| aynı | `core/capsule.schema.json` → `$id` |

Depo adı/hesabı değişirse yukarıdaki dört dosyayı güncellemek yeterlidir.

## Sürüm numarası nerede?

Aynı sürümü dört yerde tutun (yeni sürümde hepsini güncelleyin, sonra tag'i push edin):

- `windows/package.json` → `version`
- `windows/src-tauri/tauri.conf.json` → `version`
- `android/app/build.gradle.kts` → `versionName` (+ `versionCode`)
- `core/src/config.ts` → `APP_VERSION` (güncelleme karşılaştırmasının referansı)

> Tag ile `APP_VERSION` uyuşmazsa uygulama kendini eski sanıp "Güncelleme Mevcut"
> rozetini gösterebilir; ikisini birlikte güncelleyin.

## Yerel doğrulama

```bash
node tools/generate-icons.mjs
npm --prefix windows run build        # tsc --noEmit + vite build
cd windows/src-tauri && cargo check    # Rust kabuğu
cd android && gradle assembleDebug     # APK
```

## Sürüm dosyaları

| Platform | Çıktı |
| --- | --- |
| Windows | `ReuXs_1.0.0_x64_en-US.msi`, `ReuXs_1.0.0_x64-setup.exe` |
| Android | `ReuXs-v1.0.0.apk` (debug-signed, doğrudan kurulabilir) |
