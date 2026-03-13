import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { sampleObservations } from "./data/sampleObservations";
import "leaflet/dist/leaflet.css";
import "./index.css";

import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

const loadInitialObservations = () => {
  try {
    const raw = localStorage.getItem("green_guardian_observations");
    const parsed = raw ? JSON.parse(raw) : sampleObservations;
    return Array.isArray(parsed) ? parsed : sampleObservations;
  } catch (e) {
    return sampleObservations;
  }
};

const initialObservations = loadInitialObservations();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App initialObservations={initialObservations} />
  </React.StrictMode>
);

