import { useEffect, useState, type ReactNode } from "react";
import {
  APP_VERSION,
  DEFAULT_SETTINGS,
  capsuleAppearance,
  hasTrack,
  normalizeSettings,
  type ReuxsSettings,
  type ThemeMode
} from "@core";
import { Visualizer } from "./components/Visualizer";
import {
  ArrowUpRightIcon,
  BatteryIcon,
  CapsuleGlyph,
  CheckIcon,
  DownloadIcon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
  ResetIcon
} from "./components/icons";
import { useAlbumPalette } from "./hooks/useAlbumPalette";
import { useCapsule } from "./hooks/useCapsule";
import { useNowPlaying } from "./hooks/useNowPlaying";
import { useSettings } from "./hooks/useSettings";
import { useUpdate } from "./hooks/useUpdate";
import { createShortcut, invokeSafe, openExternal, setAutostart } from "./lib/os";

const SECTIONS = [
  { id: "layout", label: "Konum & Boyut", hint: "Kapsülü piksel piksel yerleştir" },
  { id: "appearance", label: "Görünüm & Renk", hint: "Opaklık, tema, parlama" },
  { id: "music", label: "Müzik & Visualizer", hint: "Canlı oynatıcı ve palet" },
  { id: "general", label: "Genel & Güncelleme", hint: "Başlangıç, görünürlük, sürüm" }
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const THEME_OPTIONS: { value: ThemeMode; label: string; hint: string }[] = [
  { value: "crimson", label: "Koyu Kırmızı", hint: "Varsayılan ReuXs" },
  { value: "oled", label: "Saf OLED", hint: "Tam siyah" },
  { value: "custom", label: "Özel Renk", hint: "Kendi vurgun" },
  { value: "album", label: "Albüm Kapağı", hint: "Otomatik palet" }
];

export function SettingsApp() {
  const { settings, update, reset } = useSettings();
  const [section, setSection] = useState<SectionId>("layout");
  const [shortcut, setShortcut] = useState<"idle" | "done" | "failed">("idle");
  const updateApi = useUpdate();
  const nowPlaying = useNowPlaying(settings.musicEnabled);
  const track = hasTrack(nowPlaying.track) ? nowPlaying.track : null;
  const palette = useAlbumPalette(track?.art ?? null, settings.musicEnabled);
  const appearance = capsuleAppearance(settings, settings.adaptivePalette ? palette : null);

  // Mirror the autostart choice into the registry both ways, so turning the
  // switch off actually removes the Run entry.
  useEffect(() => {
    void setAutostart(settings.autostart);
  }, [settings.autostart]);

  const resetPosition = () => {
    update({ offsetX: 0, offsetY: 0, scale: 1 });
    void invokeSafe("reset_capsule_layout");
  };

  const resetAll = () => {
    reset();
    void invokeSafe("reset_capsule_layout");
  };

  return (
    <div className="settings-shell flex h-full w-full flex-col bg-[#050505] text-ink-50">
      <header className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-crimson-950/90 ring-1 ring-crimson-500/40">
          <CapsuleGlyph className="h-5 w-5 text-crimson-400" />
        </span>
        <div className="flex flex-col leading-none">
          <h1 className="text-[17px] font-semibold tracking-tight">ReuXs Kontrol Paneli</h1>
          <span className="mt-1 text-[9.5px] uppercase tracking-[0.26em] text-ink-500">
            Material Capsule · v{APP_VERSION}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full border border-white/5 bg-black/40 px-2.5 py-1 text-[10px] text-ink-400">
            {settings.capsuleHidden ? "Kapsül gizli" : "Kapsül görünür"}
          </span>
          <button
            type="button"
            onClick={() => update({ capsuleHidden: !settings.capsuleHidden })}
            className="rounded-full border border-crimson-500/35 bg-crimson-950/40 px-3 py-1.5 text-[11px] font-medium text-crimson-200 transition-colors hover:border-crimson-400/60"
          >
            {settings.capsuleHidden ? "Kapsülü göster" : "Kapsülü gizle"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="flex w-[212px] shrink-0 flex-col gap-1 border-r border-white/5 p-3">
          {SECTIONS.map((item) => {
            const active = item.id === section;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`rounded-[12px] px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-crimson-950/50 text-ink-50 ring-1 ring-crimson-500/35"
                    : "text-ink-400 hover:bg-white/[0.03] hover:text-ink-50"
                }`}
              >
                <span className="block text-[12.5px] font-medium">{item.label}</span>
                <span className="mt-0.5 block text-[9.5px] text-ink-500">{item.hint}</span>
              </button>
            );
          })}

          <div className="mt-auto flex flex-col gap-2 pt-4">
            <CapsulePreview settings={settings} appearance={appearance} />
            <button
              type="button"
              onClick={resetAll}
              className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[11px] text-ink-300 transition-colors hover:border-crimson-500/40 hover:text-white"
            >
              <ResetIcon className="h-3 w-3" />
              Tüm ayarları sıfırla
            </button>
          </div>
        </nav>

        <main className="reuxs-scroll min-w-0 flex-1 overflow-y-auto px-6 py-5">
          {section === "layout" ? (
            <Panel
              title="Konum ve Boyut"
              description="Kapsülü ekranda piksel hassasiyetinde konumlandır. Değişiklikler kapsüle anında yansır."
            >
              <SliderRow
                label="Yatay konum (X)"
                value={settings.offsetX}
                min={-400}
                max={400}
                step={1}
                suffix="px"
                onChange={(offsetX) => update({ offsetX })}
              />
              <SliderRow
                label="Dikey konum (Y)"
                value={settings.offsetY}
                min={0}
                max={640}
                step={1}
                suffix="px"
                onChange={(offsetY) => update({ offsetY })}
              />
              <SliderRow
                label="Ölçek"
                value={settings.scale}
                min={0.75}
                max={1.35}
                step={0.01}
                format={(value) => `${Math.round(value * 100)}%`}
                onChange={(scale) => update({ scale })}
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetPosition}
                  className="flex items-center gap-1.5 rounded-full bg-crimson-500 px-3.5 py-2 text-[11.5px] font-semibold text-black transition-transform hover:scale-[1.02]"
                >
                  <ResetIcon className="h-3 w-3" />
                  Varsayılan Konuma Sıfırla
                </button>
                <button
                  type="button"
                  onClick={() => update({ offsetX: 0, offsetY: 0 })}
                  className="rounded-full border border-white/10 px-3.5 py-2 text-[11.5px] text-ink-300 transition-colors hover:border-crimson-500/40 hover:text-white"
                >
                  Üst-orta (kamera hizası)
                </button>
              </div>
              <p className="pt-1 text-[10.5px] text-ink-500">
                Windows'ta kapsül birincil monitörün üst-ortasına hizalanır; X/Y değerleri bu
                konumun üzerine eklenir.
              </p>
            </Panel>
          ) : null}

          {section === "appearance" ? (
            <>
              <Panel
                title="Opaklık ve Doku"
                description="Zeminin saydamlığını ve arkasındaki bulanıklığı ayarla."
              >
                <SliderRow
                  label="Arka plan opaklığı"
                  value={settings.opacity}
                  min={0.35}
                  max={1}
                  step={0.01}
                  format={(value) => `${Math.round(value * 100)}%`}
                  onChange={(opacity) => update({ opacity })}
                />
                <SliderRow
                  label="Bulanıklık (blur)"
                  value={settings.blur}
                  min={0}
                  max={28}
                  step={1}
                  suffix="px"
                  onChange={(blur) => update({ blur })}
                />
                <SliderRow
                  label="Köşe yuvarlaklığı"
                  value={settings.radius}
                  min={8}
                  max={34}
                  step={1}
                  suffix="px"
                  onChange={(radius) => update({ radius })}
                />
                <SliderRow
                  label="Kenarlık parlaması"
                  value={settings.glow}
                  min={0}
                  max={100}
                  step={1}
                  suffix="%"
                  onChange={(glow) => update({ glow })}
                />
              </Panel>

              <Panel title="Tema" description="Kapsülün renk kimliğini seç.">
                <div className="grid grid-cols-2 gap-2">
                  {THEME_OPTIONS.map((option) => (
                    <ThemeOption
                      key={option.value}
                      active={settings.themeMode === option.value}
                      label={option.label}
                      hint={option.hint}
                      onClick={() => update({ themeMode: option.value })}
                      swatch={themeSwatch(option.value)}
                    />
                  ))}
                </div>

                {settings.themeMode === "custom" ? (
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="color"
                      value={normalizeSettings(settings).customAccent}
                      onChange={(event) => update({ customAccent: event.target.value.toUpperCase() })}
                      className="h-9 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                      aria-label="Özel vurgu rengi"
                    />
                    <input
                      type="text"
                      value={settings.customAccent}
                      onChange={(event) => update({ customAccent: event.target.value })}
                      spellCheck={false}
                      className="w-28 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 font-mono text-[12px] text-ink-50 outline-none focus:border-crimson-500/60"
                      aria-label="Vurgu rengi (hex)"
                    />
                    <span className="text-[10.5px] text-ink-500">
                      Kapsül gradyanı bu renkten türetilir.
                    </span>
                  </div>
                ) : null}
              </Panel>
            </>
          ) : null}

          {section === "music" ? (
            <>
              <Panel
                title="Müzik Modülü"
                description="Kapsül, işletim sisteminin medya oturumunu (Windows SMTC) dinler — hiçbir hesap veya API anahtarı gerekmez."
              >
                <ToggleRow
                  label="Müzik modülü"
                  description="Şarkı adı, sanatçı, kapak ve oynatma durumu kapsülde görünür."
                  checked={settings.musicEnabled}
                  onChange={(musicEnabled) => update({ musicEnabled })}
                />
                <ToggleRow
                  label="Albüm kapağı rengine bürün"
                  description="Kapsül gradyanı ve parlaması albüm kapağının baskın rengine geçer."
                  checked={settings.adaptivePalette}
                  disabled={!settings.musicEnabled}
                  onChange={(adaptivePalette) => update({ adaptivePalette })}
                />
                <ToggleRow
                  label="Müzik visualizer'ı göster"
                  description="Çalarken ritmik çubuklar / dalga animasyonu."
                  checked={settings.visualizer}
                  disabled={!settings.musicEnabled}
                  onChange={(visualizer) => update({ visualizer })}
                />
                <Segmented
                  label="Visualizer stili"
                  value={settings.visualizerStyle}
                  disabled={!settings.musicEnabled || !settings.visualizer}
                  options={[
                    { value: "bars", label: "Çubuklar" },
                    { value: "wave", label: "Dalga" }
                  ]}
                  onChange={(visualizerStyle) => update({ visualizerStyle })}
                />
              </Panel>

              <Panel title="Şu an çalan" description="Sistem genelindeki aktif medya oturumu.">
                {track ? (
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-white/5 ring-1 ring-white/10">
                      {track.art ? (
                        <img src={track.art} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <MusicIcon className="h-4 w-4 text-ink-400" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold">{track.title}</div>
                      <div className="truncate text-[11px] text-ink-400">
                        {track.artist || "Bilinmeyen sanatçı"}
                        {track.album ? ` · ${track.album}` : ""}
                      </div>
                    </div>
                    <Visualizer
                      active={track.playing}
                      style={settings.visualizerStyle}
                      color={appearance.accent}
                      bars={6}
                    />
                    <button
                      type="button"
                      onClick={() => nowPlaying.control("toggle")}
                      className="grid h-9 w-9 place-items-center rounded-full bg-crimson-500 text-black"
                      aria-label={track.playing ? "Duraklat" : "Oynat"}
                    >
                      {track.playing ? (
                        <PauseIcon className="h-3.5 w-3.5" />
                      ) : (
                        <PlayIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-[11.5px] text-ink-500">
                    Şu an bir medya oturumu yok. Spotify, YouTube Music, VLC veya Windows Medya
                    Oynatıcı'da bir şarkı başlat; burada ve kapsülde anında görünecek.
                  </p>
                )}
                {palette ? (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      Kapak paleti
                    </span>
                    <Swatch color={palette.dominant} label={palette.dominant} />
                    <Swatch color={palette.accent} label={palette.accent} />
                  </div>
                ) : null}
              </Panel>
            </>
          ) : null}

          {section === "general" ? (
            <>
              <Panel
                title="Kapsülde görünenler"
                description="Kapsül sade kalır: dokununca yalnızca burada açtığın kartlar gelir."
              >
                <ToggleRow
                  label="Müzik kartı"
                  description="Kapak, şarkı adı, ilerleme ve oynat/duraklat."
                  checked={settings.capsulePanels.music}
                  onChange={(music) =>
                    update({ capsulePanels: { ...settings.capsulePanels, music } })
                  }
                />
                <ToggleRow
                  label="Zamanlayıcı kartı"
                  description="Geri sayım, hazır süreler ve sıfırlama."
                  checked={settings.capsulePanels.timer}
                  onChange={(timer) =>
                    update({ capsulePanels: { ...settings.capsulePanels, timer } })
                  }
                />
                <ToggleRow
                  label="Hızlı eylemler"
                  description="Böl, Odak 25 ve Panel düğmeleri."
                  checked={settings.capsulePanels.actions}
                  onChange={(actions) =>
                    update({ capsulePanels: { ...settings.capsulePanels, actions } })
                  }
                />
              </Panel>

              <Panel title="Genel" description="Başlangıç davranışı ve kapsül görünürlüğü.">
                <ToggleRow
                  label="Başlangıçta otomatik çalıştır"
                  description="Windows oturumu açıldığında ReuXs kendiliğinden başlar."
                  checked={settings.autostart}
                  onChange={(autostart) => update({ autostart })}
                />
                <ToggleRow
                  label="Kapsülü geçici olarak gizle"
                  description="Uygulama açık kalır, kapsül ekrandan kalkar. Bu panelden geri getirebilirsin."
                  checked={settings.capsuleHidden}
                  onChange={(capsuleHidden) => update({ capsuleHidden })}
                />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      void createShortcut().then((path) => setShortcut(path ? "done" : "failed"));
                    }}
                    className="rounded-full border border-white/10 px-3.5 py-2 text-[11.5px] text-ink-300 transition-colors hover:border-crimson-500/40 hover:text-white"
                  >
                    Masaüstü kısayolu oluştur
                  </button>
                  {shortcut === "done" ? (
                    <span className="text-[10.5px] text-ink-500">
                      Kısayol masaüstüne ve Başlat menüsüne eklendi.
                    </span>
                  ) : null}
                  {shortcut === "failed" ? (
                    <span className="text-[10.5px] text-ink-500">Kısayol oluşturulamadı.</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <BatteryIcon className="h-3.5 w-3.5 text-ink-500" />
                  <span className="text-[11px] text-ink-500">
                    Kapsül boyutu {Math.round(520 * settings.scale)}×{Math.round(420 * settings.scale)} px
                  </span>
                </div>
              </Panel>

              <Panel
                title="Güncelleme"
                description="Sürüm bilgisi GitHub Releases üzerinden okunur, herhangi bir anahtar gerekmez."
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium">
                      ReuXs v{APP_VERSION}
                      <span className="ml-2 text-[10px] text-ink-500">
                        {updateApi.status.checked
                          ? updateApi.status.available
                            ? `yeni sürüm: v${updateApi.status.latestVersion}`
                            : "en güncel sürüm"
                          : "henüz denetlenmedi"}
                      </span>
                    </div>
                    <div className="mt-1 text-[10.5px] text-ink-500">
                      {updateApi.status.error
                        ? `Denetim hatası: ${updateApi.status.error}`
                        : "Güncellemeler açılışta otomatik denetlenir."}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void updateApi.refresh()}
                    disabled={updateApi.checking}
                    className="flex items-center gap-1.5 rounded-full border border-crimson-500/40 bg-crimson-950/40 px-3.5 py-2 text-[11.5px] font-medium text-crimson-200 transition-colors hover:border-crimson-400/70 disabled:opacity-50"
                  >
                    <ResetIcon className="h-3 w-3" />
                    {updateApi.checking ? "Denetleniyor…" : "Güncellemeleri Kontrol Et"}
                  </button>
                </div>

                {updateApi.status.available ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-crimson-500/35 bg-gradient-to-r from-crimson-950/80 to-black/40 p-3">
                    <DownloadIcon className="h-4 w-4 text-crimson-400" />
                    <span className="text-[11.5px] text-ink-100">
                      v{updateApi.status.latestVersion} hazır
                    </span>
                    <div className="ml-auto flex gap-2">
                      {updateApi.status.windowsUrl ? (
                        <button
                          type="button"
                          onClick={() => void openExternal(updateApi.status.windowsUrl!)}
                          className="rounded-full bg-crimson-500 px-3 py-1.5 text-[11px] font-semibold text-black"
                        >
                          Windows kurulumu
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void openExternal(updateApi.status.downloadUrl)}
                        className="flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-ink-200"
                      >
                        Sürüm notları
                        <ArrowUpRightIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </Panel>
            </>
          ) : null}

          <footer className="mt-6 flex items-center gap-2 text-[10px] text-ink-500">
            <CheckIcon className="h-3 w-3 text-crimson-400" />
            Tüm değişiklikler anında kaydedilir ve kapsüle yansır · MIT lisanslı · veri toplamaz
          </footer>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- primitives */

function Panel({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-4 rounded-[16px] border border-white/[0.07] bg-white/[0.02] p-4">
      <h2 className="text-[13px] font-semibold text-ink-50">{title}</h2>
      {description ? (
        <p className="mt-1 text-[10.5px] leading-relaxed text-ink-500">{description}</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  format,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11.5px] text-ink-300">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-crimson-300">
          {format ? format(value) : `${Math.round(value)}${suffix}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="reuxs-slider w-full"
      />
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled = false,
  onChange
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 rounded-[12px] px-1 py-1 text-left transition-opacity ${
        disabled ? "opacity-45" : ""
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[11.5px] font-medium text-ink-100">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[10px] leading-relaxed text-ink-500">{description}</span>
        ) : null}
      </span>
      <span
        className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${
          checked ? "bg-crimson-500" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-[3px] h-4 w-4 rounded-full bg-black transition-all ${
            checked ? "left-[19px] bg-black" : "left-[3px] bg-ink-400"
          }`}
        />
      </span>
    </button>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  disabled = false,
  onChange
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div className={`flex items-center gap-3 ${disabled ? "opacity-45" : ""}`}>
      <span className="text-[11.5px] text-ink-300">{label}</span>
      <div className="ml-auto flex rounded-full border border-white/10 bg-black/40 p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1 text-[10.5px] transition-colors ${
              value === option.value
                ? "bg-crimson-500 font-semibold text-black"
                : "text-ink-400 hover:text-ink-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThemeOption({
  active,
  label,
  hint,
  swatch,
  onClick
}: {
  active: boolean;
  label: string;
  hint: string;
  swatch: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-[12px] border px-2.5 py-2 text-left transition-colors ${
        active
          ? "border-crimson-500/50 bg-crimson-950/30"
          : "border-white/[0.07] bg-black/20 hover:border-white/20"
      }`}
    >
      <span
        className="h-7 w-7 shrink-0 rounded-full ring-1 ring-white/15"
        style={{ background: swatch }}
      />
      <span className="min-w-0">
        <span className="block truncate text-[11.5px] font-medium text-ink-100">{label}</span>
        <span className="block truncate text-[9.5px] text-ink-500">{hint}</span>
      </span>
      {active ? <CheckIcon className="ml-auto h-3 w-3 shrink-0 text-crimson-400" /> : null}
    </button>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="font-mono text-[9px] text-ink-400">{label}</span>
    </span>
  );
}

/** Live mini capsule that reacts to every slider. */
function CapsulePreview({
  settings,
  appearance
}: {
  settings: ReuxsSettings;
  appearance: ReturnType<typeof capsuleAppearance>;
}) {
  const { state, dispatch } = useCapsule("compact");
  const expanded = state === "expanded";

  return (
    <div className="rounded-[14px] border border-white/[0.07] bg-black/40 p-3">
      <div className="mb-2 text-[9px] uppercase tracking-[0.2em] text-ink-500">Canlı önizleme</div>
      <button
        type="button"
        onClick={() => dispatch({ type: expanded ? "collapse" : "expand" })}
        className="relative block w-full overflow-hidden border text-left"
        style={{
          borderRadius: `${settings.radius}px`,
          borderColor: appearance.border,
          background: appearance.gradient,
          opacity: settings.opacity,
          boxShadow: `0 0 0 1px ${appearance.border}, 0 12px 28px -18px ${appearance.glow}`,
          backdropFilter: `blur(${settings.blur}px)`
        }}
      >
        <span className="flex items-center gap-1.5 px-2.5 py-2">
          <CapsuleGlyph className="h-3 w-3" style={{ color: appearance.accent }} />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-[10px] font-semibold text-ink-50">ReuXs</span>
            <span className="mt-0.5 text-[7px] uppercase tracking-[0.16em] text-ink-400">
              {expanded ? "genişletilmiş" : "material capsule"}
            </span>
          </span>
          {settings.visualizer ? (
            <Visualizer
              active
              style={settings.visualizerStyle}
              color={appearance.accent}
              bars={4}
              className="ml-auto"
            />
          ) : null}
        </span>
        {expanded ? (
          <span className="block border-t border-white/10 px-2.5 py-2 text-[8.5px] text-ink-400">
            Görünüm, müzik ve zamanlayıcı burada
          </span>
        ) : null}
      </button>
      <p className="mt-2 text-[9px] text-ink-500">Kapsüle dokun: daralt / genişlet</p>
    </div>
  );
}

function themeSwatch(mode: ThemeMode): string {
  switch (mode) {
    case "oled":
      return "linear-gradient(135deg, #0a0a0a, #000000)";
    case "custom":
      return `linear-gradient(135deg, ${DEFAULT_SETTINGS.customAccent}, #000000)`;
    case "album":
      return "linear-gradient(135deg, #6366f1, #ef4444 55%, #000)";
    default:
      return "linear-gradient(135deg, #7f1d1d, #000000)";
  }
}
