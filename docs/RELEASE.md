# ReuXs — Sürüm Yayınlama (sıfır secret)

## Akış

1. GitHub → **Releases → Draft a new release**
2. Etiketi gir (örn. `v1.0.0`) ve **Publish release**'e bas.
3. `.github/workflows/release.yml` (`on: release: types: [published]`) tetiklenir:
   - `windows-latest`: `npm ci` → `npm run tauri build` → `.msi` + NSIS `.exe` yüklenir.
   - `ubuntu-latest`: JDK 17 + Android SDK + Gradle 8.10.2 → `gradle assembleDebug` →
     `ReuXs-<tag>.apk` yüklenir.
4. Her iki iş de yalnızca yerleşik **`GITHUB_TOKEN`** ile (`permissions: contents: write`)
   `gh release upload` kullanır.

**Kullanılmayanlar:** `TAURI_SIGNING_PRIVATE_KEY`, keystore, imzalama sertifikası,
PAT, ek GitHub Secret. Tauri paketi imzasız, APK ise Gradle'ın ürettiği debug anahtarıyla
imzalanır (depoya yazılmaz).

## Yer tutucular (`<OWNER>/<REPO>`)

Kendi GitHub kullanıcı adınız ve depo adınızla değiştirmeniz gereken dosyalar:

| Dosya | Alan |
| --- | --- |
| `core/src/config.ts` | `GITHUB_OWNER`, `GITHUB_REPO` (Windows güncelleme denetimi) |
| `android/app/src/main/res/values/strings.xml` | `reuxs_repo_owner`, `reuxs_repo_name` |
| `windows/src-tauri/Cargo.toml` | `repository` alanı |
| `core/capsule.schema.json` | `$id` (yalnızca belge amaçlı) |

> `GITHUB_OWNER`/`GITHUB_REPO` değerleri değişene kadar güncelleme denetimi sessizce
> başarısız olur; kapsül normal çalışmaya devam eder.

## Sürüm numarası nerede?

Aynı sürümü üç yerde tutun (yeni sürümde hepsini güncelleyin):

- `windows/package.json` → `version`
- `windows/src-tauri/tauri.conf.json` → `version`
- `android/app/build.gradle.kts` → `versionName` (+ `versionCode`)
- `core/src/config.ts` → `APP_VERSION` (güncelleme karşılaştırmasının referansı)

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
