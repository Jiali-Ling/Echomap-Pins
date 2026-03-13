import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { sampleObservations } from "./data/sampleObservations";
import "leaflet/dist/leaflet.css";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered! Scope: ", registration.scope);
      })
      .catch((err) => {
        console.log("Service Worker registration failed: ", err);
      });
  });
}

const loadInitialObservations = () => {
  try {
    const raw = localStorage.getItem("green_guardian_observations");
    const parsed = raw ? JSON.parse(raw) : sampleObservations;
    return Array.isArray(parsed) ? parsed : sampleObservations;
  } catch (e) {
    return sampleObservations;
  }
};

const DATA = loadInitialObservations();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App initialObservations={DATA} />
  </React.StrictMode>
);

