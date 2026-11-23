import React from "react";
import ReactDOM from "react-dom/client";
import App, { isSettingsWindow } from "./App";
import { isTauri } from "./lib/os";
import "./styles.css";

// In a plain browser (dev/preview) paint a desktop-like backdrop so the
// transparent Tauri window still looks right.
if (!isTauri()) {
  document.documentElement.classList.add("browser-shell");
}
if (isSettingsWindow()) {
  document.documentElement.classList.add("settings-shell");
}

const container = document.getElementById("root");
if (!container) throw new Error("ReuXs: #root element is missing");

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
