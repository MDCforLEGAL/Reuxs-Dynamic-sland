/* ReuXs landing page — no framework, no build step.
 *
 * 1. Colour engine: the same accent → gradient maths the app uses.
 * 2. Interactive capsule lab (theme, opacity, radius, scale, glow, tracks).
 * 3. Demo player + control-panel tabs.
 * 4. Live release list from the public GitHub API (with a graceful fallback).
 */
(() => {
  "use strict";

  const REPO = "MDCforLEGAL/Reuxs-Dynamic-sland";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* ------------------------------------------------------------ colour math */

  const hexToRgb = (hex) => {
    const clean = String(hex || "").replace("#", "");
    const value = clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0").slice(0, 6);
    return [
      parseInt(value.slice(0, 2), 16) || 0,
      parseInt(value.slice(2, 4), 16) || 0,
      parseInt(value.slice(4, 6), 16) || 0
    ];
  };

  const toHex = ([r, g, b]) =>
    "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

  const mix = (a, b, weight) => {
    const [r1, g1, b1] = hexToRgb(a);
    const [r2, g2, b2] = hexToRgb(b);
    const w = Math.min(1, Math.max(0, weight));
    return toHex([r1 + (r2 - r1) * w, g1 + (g2 - g1) * w, b1 + (b2 - b1) * w]);
  };

  const rgba = (hex, alpha) => {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
  };

  /* ---------------------------------------------------------------- tracks */

  const TRACKS = [
    {
      title: "Midnight Drive",
      artist: "Synthwave Collective",
      album: "Neon Roads",
      duration: 228,
      cover: "linear-gradient(135deg, #6366f1, #ef4444 58%, #111)",
      dominant: "#6366F1",
      accent: "#EF4444"
    },
    {
      title: "Crimson Static",
      artist: "Obsidian Kids",
      album: "Low Orbit",
      duration: 194,
      cover: "linear-gradient(135deg, #f87171, #7f1d1d 55%, #0a0a0a)",
      dominant: "#7F1D1D",
      accent: "#FB7185"
    },
    {
      title: "Deep Field",
      artist: "Aurora Nine",
      album: "Echoes",
      duration: 252,
      cover: "linear-gradient(135deg, #22d3ee, #0e7490 48%, #0a0a0a)",
      dominant: "#0E7490",
      accent: "#22D3EE"
    }
  ];

  const state = {
    mode: "crimson", // crimson | oled | album | custom
    custom: "#EF4444",
    opacity: 0.92,
    radius: 26,
    scale: 1,
    glow: 55,
    track: 0,
    playing: true,
    position: 84
  };

  const currentTrack = () => TRACKS[state.track];

  const accentFor = () => {
    if (state.mode === "album") return currentTrack().accent;
    if (state.mode === "custom") return state.custom;
    if (state.mode === "oled") return "#E4E4E7";
    return "#EF4444";
  };

  function paint() {
    const accent = accentFor();
    const base = state.mode === "album" ? currentTrack().dominant : accent;
    const root = document.documentElement;

    const g1 = state.mode === "oled" ? "#141414" : mix(base, "#000000", 0.4);
    const g2 = state.mode === "oled" ? "#0A0A0A" : mix(base, "#000000", 0.55);
    const g3 = state.mode === "oled" ? "#050505" : mix(base, "#000000", 0.72);

    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-rgb", hexToRgb(accent).join(", "));
    root.style.setProperty("--accent-soft", mix(accent, "#FFFFFF", 0.32));
    root.style.setProperty("--g1", rgba(g1, state.opacity));
    root.style.setProperty("--g2", rgba(g2, state.opacity));
    root.style.setProperty("--g3", rgba(g3, state.opacity));
    root.style.setProperty("--capsule-radius", `${state.radius}px`);
    root.style.setProperty("--capsule-scale", String(state.scale));
    root.style.setProperty("--capsule-glow", String(state.glow));
  }

  /* ------------------------------------------------------------------ mirror */

  function formatTime(seconds) {
    const total = Math.max(0, Math.round(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  function renderTrackUi() {
    const track = currentTrack();
    const progress = Math.min(1, state.position / track.duration);

    ["heroTitle", "demoTitle", "expandTitle", "playerTitle"].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = track.title;
    });
    ["heroArtist", "playerArtist"].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = id === "playerArtist" ? `${track.artist} · ${track.album}` : track.artist;
    });
    const demoArtist = document.getElementById("demoArtist");
    if (demoArtist) demoArtist.textContent = track.artist.toUpperCase();
    const expandArtist = document.getElementById("expandArtist");
    if (expandArtist) expandArtist.textContent = track.artist;

    ["heroArt", "demoArt", "expandArt", "playerCover"].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.style.background = track.cover;
    });
    const playerCover = document.getElementById("playerCover");
    if (playerCover) playerCover.classList.toggle("playing", state.playing);

    const positionText = formatTime(state.position);
    const durationText = formatTime(track.duration);
    const pairs = [
      ["seekNow", positionText],
      ["playerNow", positionText],
      ["seekEnd", durationText],
      ["playerEnd", durationText]
    ];
    pairs.forEach(([id, text]) => {
      const node = document.getElementById(id);
      if (node) node.textContent = text;
    });

    const percent = `${Math.round(progress * 100)}%`;
    ["seekFill", "playerSeek"].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.style.width = percent;
    });

    const play = document.getElementById("expandPlay");
    const playTrack = document.getElementById("playTrack");
    if (play) play.textContent = state.playing ? "❚❚" : "▶";
    if (playTrack) playTrack.textContent = state.playing ? "❚❚" : "▶";

    document.body.classList.toggle("is-paused", !state.playing);

    const dominant = document.getElementById("paletteDominant");
    const accent = document.getElementById("paletteAccent");
    const hex = document.getElementById("paletteHex");
    if (dominant) dominant.style.background = currentTrack().dominant;
    if (accent) accent.style.background = currentTrack().accent;
    if (hex) hex.textContent = `${currentTrack().dominant} / ${currentTrack().accent}`;

    $$("#trackRow .track-btn").forEach((button, index) => {
      button.setAttribute("aria-pressed", String(index === state.track));
    });
    const indexLabel = document.getElementById("trackIndex");
    if (indexLabel) indexLabel.textContent = `${state.track + 1} / ${TRACKS.length}`;
  }

  function refresh() {
    paint();
    renderTrackUi();
  }

  /* ------------------------------------------------------------- track menu */

  const trackRow = document.getElementById("trackRow");
  if (trackRow) {
    TRACKS.forEach((track, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "track-btn";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `${track.title} — ${track.artist}`);
      const cover = document.createElement("i");
      cover.style.background = track.cover;
      const label = document.createElement("span");
      label.textContent = track.title;
      button.append(cover, label);
      button.addEventListener("click", () => {
        state.track = index;
        state.position = 0;
        refresh();
      });
      trackRow.appendChild(button);
    });
  }

  /* --------------------------------------------------------------- controls */

  const opacityRange = document.getElementById("opacityRange");
  const radiusRange = document.getElementById("radiusRange");
  const scaleRange = document.getElementById("scaleRange");
  const glowRange = document.getElementById("glowRange");
  const accentPicker = document.getElementById("accentPicker");
  const colorRow = document.getElementById("colorRow");
  const themeValue = document.getElementById("themeValue");

  const THEME_LABELS = {
    crimson: "Koyu Kırmızı",
    oled: "Saf OLED",
    album: "Albüm kapağı",
    custom: "Özel renk"
  };

  function syncControls() {
    if (opacityRange) {
      opacityRange.value = String(Math.round(state.opacity * 100));
      const out = document.getElementById("opacityValue");
      if (out) out.textContent = `%${Math.round(state.opacity * 100)}`;
    }
    if (radiusRange) {
      radiusRange.value = String(state.radius);
      const out = document.getElementById("radiusValue");
      if (out) out.textContent = `${state.radius} px`;
    }
    if (scaleRange) {
      scaleRange.value = String(Math.round(state.scale * 100));
      const out = document.getElementById("scaleValue");
      if (out) out.textContent = `%${Math.round(state.scale * 100)}`;
    }
    if (glowRange) {
      glowRange.value = String(state.glow);
      const out = document.getElementById("glowValue");
      if (out) out.textContent = `%${state.glow}`;
    }
    if (themeValue) themeValue.textContent = THEME_LABELS[state.mode];
    if (colorRow) colorRow.hidden = state.mode !== "custom";
    if (accentPicker) accentPicker.value = state.custom.toLowerCase();
    const accentValue = document.getElementById("accentValue");
    if (accentValue) accentValue.textContent = state.custom.toUpperCase();

    $$("#themeChips .chip").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.dataset.theme === state.mode));
    });
  }

  opacityRange?.addEventListener("input", (event) => {
    state.opacity = Math.min(1, Math.max(0.35, Number(event.target.value) / 100));
    syncControls();
    paint();
  });

  radiusRange?.addEventListener("input", (event) => {
    state.radius = Number(event.target.value);
    syncControls();
    paint();
  });

  scaleRange?.addEventListener("input", (event) => {
    state.scale = Number(event.target.value) / 100;
    syncControls();
    paint();
  });

  glowRange?.addEventListener("input", (event) => {
    state.glow = Number(event.target.value);
    syncControls();
    paint();
  });

  accentPicker?.addEventListener("input", (event) => {
    state.custom = event.target.value.toUpperCase();
    state.mode = "custom";
    syncControls();
    paint();
  });

  $$("#themeChips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.mode = chip.dataset.theme || "crimson";
      syncControls();
      paint();
    });
  });

  /* ------------------------------------------------------------- capsule lab */

  const demoCapsule = document.getElementById("demoCapsule");
  const expandPanel = document.getElementById("expandPanel");
  const labHint = document.getElementById("labHint");

  const toggleExpand = () => {
    if (!expandPanel) return;
    const open = expandPanel.hidden;
    expandPanel.hidden = !open;
    if (labHint) labHint.textContent = open ? "Tekrar tıkla: daralt" : "Kapsüle tıkla: genişlet / daralt";
    renderTrackUi();
  };

  demoCapsule?.addEventListener("click", toggleExpand);
  demoCapsule?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleExpand();
    }
  });

  const heroCapsule = document.getElementById("heroCapsule");
  heroCapsule?.addEventListener("click", () => {
    document.getElementById("kapsul")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------------------------------------------------------------- playback */

  const togglePlay = () => {
    state.playing = !state.playing;
    renderTrackUi();
  };

  document.getElementById("expandPlay")?.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePlay();
  });
  document.getElementById("playTrack")?.addEventListener("click", togglePlay);

  document.getElementById("nextTrack")?.addEventListener("click", () => {
    state.track = (state.track + 1) % TRACKS.length;
    state.position = 0;
    refresh();
  });

  document.getElementById("prevTrack")?.addEventListener("click", () => {
    state.track = (state.track + TRACKS.length - 1) % TRACKS.length;
    state.position = 0;
    refresh();
  });

  window.setInterval(() => {
    if (!state.playing) return;
    state.position += 1;
    if (state.position > currentTrack().duration) {
      state.track = (state.track + 1) % TRACKS.length;
      state.position = 0;
      paint();
    }
    renderTrackUi();
  }, 1000);

  /* ------------------------------------------------------------ panel tabs */

  $$("#panelTabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$("#panelTabs .tab").forEach((other) => {
        other.classList.toggle("active", other === tab);
        other.setAttribute("aria-selected", String(other === tab));
      });
      $$(".pane").forEach((pane) => {
        pane.classList.toggle("active", pane.dataset.pane === tab.dataset.tab);
      });
    });
  });

  /* --------------------------------------------------------------- reveal */

  const revealables = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );
    revealables.forEach((node) => observer.observe(node));
  } else {
    revealables.forEach((node) => node.classList.add("in"));
  }

  /* ------------------------------------------------------ scroll progress */

  const progressBar = document.getElementById("scrollProgress");
  const onScroll = () => {
    if (!progressBar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    progressBar.style.width = `${(ratio * 100).toFixed(2)}%`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------- releases */

  const list = document.getElementById("releaseList");
  const note = document.getElementById("downloadNote");
  const latestCard = document.getElementById("latestCard");

  const PLATFORMS = [
    { suffix: ".exe", label: "Windows kurulumu", kind: "EXE", primary: true },
    { suffix: ".msi", label: "Windows MSI", kind: "MSI", primary: false },
    { suffix: ".apk", label: "Android APK", kind: "APK", primary: false }
  ];

  function assetFor(assets, suffix) {
    return (assets || []).find((asset) => String(asset.name || "").toLowerCase().endsWith(suffix));
  }

  function assetButtons(assets, primarySuffix) {
    const row = document.createElement("div");
    row.className = "asset-row";

    PLATFORMS.forEach((platform) => {
      const asset = assetFor(assets, platform.suffix);
      if (!asset) return;
      const link = document.createElement("a");
      link.className = "asset";
      if (platform.suffix === primarySuffix) link.classList.add("primary");
      link.href = asset.browser_download_url;
      link.rel = "noopener";

      const kind = document.createElement("span");
      kind.className = "asset-kind";
      kind.textContent = platform.kind;

      const label = document.createElement("span");
      label.textContent = platform.label;

      const size = document.createElement("span");
      size.className = "asset-kind";
      size.textContent = asset.size ? `${(asset.size / 1048576).toFixed(1)} MB` : "";

      link.append(kind, label, size);
      link.title = asset.name;
      row.appendChild(link);
    });

    if (!row.children.length) {
      const empty = document.createElement("span");
      empty.className = "asset";
      empty.textContent = "Bu sürümde dosya yok";
      row.appendChild(empty);
    }
    return row;
  }

  function formatDate(value) {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } catch {
      return "";
    }
  }

  function setVersionEverywhere(tag) {
    if (!tag) return;
    const normalized = tag.startsWith("v") ? tag : `v${tag}`;
    ["statVersion", "navVersion", "paneVersion"].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = normalized;
    });
  }

  function renderLatest(release) {
    if (!latestCard || !release) return;
    const tag = document.getElementById("latestTag");
    const date = document.getElementById("latestDate");
    const holder = document.getElementById("latestAssets");
    if (tag) tag.textContent = release.tag_name;
    if (date) {
      date.textContent = `${formatDate(release.published_at)} · ${release.assets?.length || 0} dosya`;
    }
    if (holder) {
      holder.replaceChildren(assetButtons(release.assets, ".exe"));
    }
    latestCard.hidden = false;
  }

  function renderRelease(release, latestTag) {
    const card = document.createElement("article");
    card.className = "release";

    const head = document.createElement("div");
    head.className = "release-head";

    const tag = document.createElement("span");
    tag.className = "release-tag";
    tag.textContent = release.tag_name || release.name || "sürüm";

    const date = document.createElement("span");
    date.className = "release-date";
    date.textContent = formatDate(release.published_at);

    const badges = document.createElement("div");
    badges.className = "release-badges";
    if (latestTag && release.tag_name === latestTag) {
      const latest = document.createElement("span");
      latest.className = "release-badge latest";
      latest.textContent = "en son";
      badges.appendChild(latest);
    }
    if (release.prerelease) {
      const pre = document.createElement("span");
      pre.className = "release-badge";
      pre.textContent = "ön sürüm";
      badges.appendChild(pre);
    }

    head.append(tag, date, badges);
    card.appendChild(head);
    card.appendChild(assetButtons(release.assets, release.tag_name === latestTag ? ".exe" : ""));

    if (release.body && release.body.trim()) {
      const details = document.createElement("details");
      details.className = "release-notes";
      const summary = document.createElement("summary");
      summary.textContent = "Sürüm notları";
      const pre = document.createElement("pre");
      pre.textContent = release.body.trim();
      details.append(summary, pre);
      card.appendChild(details);
    }

    return card;
  }

  async function loadReleases() {
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=6`, {
        headers: { Accept: "application/vnd.github+json" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const releases = await response.json();
      const published = releases.filter((release) => !release.draft);

      if (!published.length) throw new Error("boş liste");

      const latest = published.find((release) => !release.prerelease) || published[0];
      renderLatest(latest);
      setVersionEverywhere(latest.tag_name);

      if (list) {
        const previous = published.filter((release) => release.id !== latest.id);
        list.replaceChildren(...previous.map((release) => renderRelease(release, latest.tag_name)));
        const title = document.getElementById("previousTitle");
        if (title) title.hidden = previous.length === 0;
      }

      const apk = assetFor(latest.assets, ".apk");
      if (apk && apk.size) {
        const stat = document.getElementById("statSize");
        if (stat) stat.textContent = `~${Math.round(apk.size / 1048576)} MB`;
      }

      if (note) {
        note.replaceChildren(
          document.createTextNode("Tüm sürümler: "),
          Object.assign(document.createElement("a"), {
            href: `https://github.com/${REPO}/releases`,
            textContent: "github.com/" + REPO + "/releases"
          })
        );
      }
    } catch (error) {
      if (list) list.replaceChildren();
      if (note) {
        note.replaceChildren(
          document.createTextNode("Sürüm listesi şu an alınamadı. "),
          Object.assign(document.createElement("a"), {
            href: `https://github.com/${REPO}/releases/latest`,
            textContent: "En son sürümü GitHub'da aç ↗"
          })
        );
      }
    }
  }

  /* -------------------------------------------------------------------- boot */

  syncControls();
  refresh();
  void loadReleases();
})();
