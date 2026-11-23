# ReuXs — Sürüm Yayınlama (otomatik, sıfır secret)

## Tam otomatik akış (komut yok)

Bir kez şu secret'ı ekle (yalnızca GitHub arayüzü, komut satırı gerekmez):

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens
   → Generate new token**, süre ve depo olarak `Reuxs-Dynamic-sland` seç,
   izin: **Contents → Read and write**.
2. Üretilen token'ı kopyala → depo → **Settings → Secrets and variables → Actions →
   New repository secret** → ad: **`RELEASE_TOKEN`**.

Sonrasında sürüm çıkarmak için sadece sürüm numaralarını güncelle ve `main`'e push et:

```
windows/package.json · windows/src-tauri/tauri.conf.json ·
android/app/build.gradle.kts · core/src/config.ts
```

`.github/workflows/auto-release.yml` `windows/package.json` sürümünü okur, `v<sürüm>`
etiketi yoksa oluşturur ve push eder. Etiket push'u `release.yml`'i tetikler; Windows ve
Android derlenir, `publish` işi sürümü `gh release create` ile açar ve dosyaları ekler.
Sürüm zaten etiketliyse hiçbir şey yapılmaz — aynı sürümü iki kez yayınlamaz.

> `RELEASE_TOKEN` tanımlı değilse bu iş yalnızca bir uyarı bırakıp atlanır; aşağıdaki
> manuel akışlar çalışmaya devam eder.
>
> Neden varsayılan `GITHUB_TOKEN` değil? Onunla push edilen bir etiket başka bir
> workflow'u tetiklemez; PAT bu yüzden gerekli. Token yalnızca tag push'u için kullanılır.

## Manuel / yedek akış

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

**Kullanılan secret'lar:** yalnızca yerleşik **`GITHUB_TOKEN`** ve (tam otomatik akış için,
opsiyonel) GitHub arayüzünden üretilen **`RELEASE_TOKEN`**. Komut satırıyla üretilen
anahtar yok: Tauri paketi imzasız, APK Gradle'ın debug anahtarıyla imzalanır (depoya
yazılmaz). `TAURI_SIGNING_PRIVATE_KEY`, keystore, imzalama sertifikası kullanılmıyor —
bunlar `keytool`/cmd gerektirdiği için kapsam dışı.

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

## CI ve site

- `.github/workflows/ci.yml` — her `main` push'unda Windows (`npm run build` + `cargo check`)
  ve Android (`assembleDebug`) derleme kontrolü. Hata varsa annotation olarak görünür.
- `.github/workflows/pages.yml` — `site/` klasörünü **`gh-pages`** dalına yayınlar. GitHub
  Pages ayarı: Settings → Pages → Source: *Deploy from a branch* → `gh-pages` / root.
  Yayın adresi: https://mdcforlegal.github.io/Reuxs-Dynamic-sland/

## Yerel doğrulama

```bash
node tools/generate-icons.mjs
npm --prefix windows run build        # tsc --noEmit + vite build
cd windows/src-tauri && cargo check    # Rust kabuğu + SMTC köprüsü
cd android && gradle assembleDebug     # APK
```

## Sürüm dosyaları

| Platform | Çıktı |
| --- | --- |
| Windows | `ReuXs_1.0.0_x64_en-US.msi`, `ReuXs_1.0.0_x64-setup.exe` |
| Android | `ReuXs-v1.0.0.apk` (debug-signed, doğrudan kurulabilir) |
