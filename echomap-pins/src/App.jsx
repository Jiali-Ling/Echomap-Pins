import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import usePersistedState from "./hooks/usePersistedState";
import "./App.css";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CATEGORY_OPTIONS = [
  { value: "wildlife", label: "Wildlife" },
  { value: "illegal_dumping", label: "Illegal Dumping" },
  { value: "facility_fault", label: "Facility Fault" },
  { value: "geologic_feature", label: "Geologic Feature" },
  { value: "other", label: "Other" },
];

const CONTACT_ROUTING = {
  wildlife: {
    team: "Wildlife Rescue Team",
    contactName: "Ranger Ava Stone",
    phone: "+1-555-210-1144",
    email: "wildlife@echomap.local",
  },
  illegal_dumping: {
    team: "City Waste Enforcement",
    contactName: "Officer Leon Park",
    phone: "+1-555-210-3312",
    email: "waste@echomap.local",
  },
  facility_fault: {
    team: "Public Infrastructure",
    contactName: "Engineer Nora Chen",
    phone: "+1-555-210-4875",
    email: "infra@echomap.local",
  },
  geologic_feature: {
    team: "Geology Survey Unit",
    contactName: "Dr. Max Rivera",
    phone: "+1-555-210-9060",
    email: "geology@echomap.local",
  },
  other: {
    team: "General Dispatch Desk",
    contactName: "Operator Team",
    phone: "+1-555-210-0001",
    email: "dispatch@echomap.local",
  },
};

const DEFAULT_SYNC_ENDPOINT = "https://jsonplaceholder.typicode.com/posts";
const FALLBACK_CENTER = [55.8642, -4.2518];
const CATEGORY_DECOR = {
  wildlife: { icon: "🜃", label: "Wildlife" },
  illegal_dumping: { icon: "✶", label: "Dumping" },
  facility_fault: { icon: "⬢", label: "Facility" },
  geologic_feature: { icon: "◈", label: "Geology" },
  other: { icon: "✦", label: "Other" },
};

function createId() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDateTime(timestamp) {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toCompassDirection(degrees) {
  if (typeof degrees !== "number" || Number.isNaN(degrees)) return "-";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return dirs[index];
}

function resolveRoutedContact(category) {
  return CONTACT_ROUTING[category] ?? CONTACT_ROUTING.other;
}

function normalizeImportedReport(raw) {
  const now = Date.now();
  return {
    id: raw.id || createId(),
    title: typeof raw.title === "string" ? raw.title : "Imported Report",
    description: typeof raw.description === "string" ? raw.description : "",
    category: CATEGORY_OPTIONS.some((item) => item.value === raw.category) ? raw.category : "other",
    status: raw.status === "resolved" ? "resolved" : "open",
    location:
      raw.location && typeof raw.location.lat === "number" && typeof raw.location.lng === "number"
        ? {
            lat: raw.location.lat,
            lng: raw.location.lng,
            accuracy: typeof raw.location.accuracy === "number" ? raw.location.accuracy : null,
            capturedAt: raw.location.capturedAt || now,
          }
        : null,
    orientation: {
      heading: typeof raw?.orientation?.heading === "number" ? raw.orientation.heading : null,
      pitch: typeof raw?.orientation?.pitch === "number" ? raw.orientation.pitch : null,
      capturedAt: raw?.orientation?.capturedAt || now,
    },
    photoBase64: typeof raw.photoBase64 === "string" ? raw.photoBase64 : null,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || raw.createdAt || now,
    syncedAt: raw.syncedAt || null,
    pendingSync: raw.pendingSync ?? true,
  };
}

function MapRecenter({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(center) || center.length !== 2) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function MapPickLocation({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng);
    },
  });
  return null;
}

function FernSketch() {
  return (
    <svg viewBox="0 0 180 180" className="sketch-svg" aria-hidden="true">
      <path d="M88 165c-5-26-5-62 6-95 7-21 21-37 38-49" />
      <path d="M98 108c18-2 33-9 43-23M101 126c16 2 32-1 47-13M94 95c-14-2-25-8-36-19" />
      <path d="M90 138c-14-3-29-10-44-24M86 151c-10-2-20-7-29-13" />
      <circle cx="54" cy="111" r="2.5" />
      <circle cx="139" cy="74" r="2.5" />
    </svg>
  );
}

function PineconeSketch() {
  return (
    <svg viewBox="0 0 180 180" className="sketch-svg" aria-hidden="true">
      <path d="M90 26c18 10 31 27 31 54 0 32-19 57-31 71-13-14-32-39-32-71 0-27 13-44 32-54z" />
      <path d="M71 53c12 8 25 8 38 0M64 74c17 10 35 10 52 0M60 96c20 12 40 12 60 0M62 118c18 10 36 10 54 0" />
      <path d="M74 66c-5 8-6 17-5 26M106 66c5 8 6 17 5 26" />
      <path d="M75 138c10 6 20 6 30 0" />
    </svg>
  );
}

function WolfSketch() {
  return (
    <svg viewBox="0 0 220 180" className="sketch-svg" aria-hidden="true">
      <path d="M28 126c14-35 42-58 78-63 23-4 45 0 67 14-9 2-15 8-19 15 11 7 19 18 22 32-9-5-18-8-30-8-10 0-17 2-28 7-9 5-19 8-31 9-23 2-40 0-59-6z" />
      <path d="M98 73 115 45l18 25M128 73l20-35 10 28" />
      <path d="M84 111c6-6 12-8 20-8M133 101c9 0 16 3 23 8M109 123c9 5 18 5 27 0" />
      <circle cx="96" cy="97" r="2.4" />
      <circle cx="145" cy="96" r="2.4" />
    </svg>
  );
}

function ReportModal({ isOpen, report, seedLocation, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("wildlife");
  const [status, setStatus] = useState("open");
  const [photoBase64, setPhotoBase64] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [gpsError, setGpsError] = useState("");
  const [heading, setHeading] = useState(null);
  const [pitch, setPitch] = useState(null);
  const [orientationError, setOrientationError] = useState("");
  const [needsOrientationPermission, setNeedsOrientationPermission] = useState(false);
  const [formError, setFormError] = useState("");

  const watchIdRef = useRef(null);
  const orientationListenerRef = useRef(null);

  const startOrientationListener = () => {
    if (orientationListenerRef.current) return;

    orientationListenerRef.current = (event) => {
      const mobileHeading =
        typeof event.webkitCompassHeading === "number"
          ? event.webkitCompassHeading
          : typeof event.alpha === "number"
            ? (360 - event.alpha + 360) % 360
            : null;

      setHeading(typeof mobileHeading === "number" ? Number(mobileHeading.toFixed(1)) : null);
      setPitch(typeof event.beta === "number" ? Number(event.beta.toFixed(1)) : null);
    };

    window.addEventListener("deviceorientation", orientationListenerRef.current, true);
  };

  const stopOrientationListener = () => {
    if (!orientationListenerRef.current) return;
    window.removeEventListener("deviceorientation", orientationListenerRef.current, true);
    orientationListenerRef.current = null;
  };

  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent === "undefined") {
      setOrientationError("DeviceOrientation API is not supported on this device.");
      return;
    }

    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result === "granted") {
          setNeedsOrientationPermission(false);
          setOrientationError("");
          startOrientationListener();
        } else {
          setOrientationError("Orientation permission was denied.");
        }
      } else {
        startOrientationListener();
      }
    } catch (error) {
      setOrientationError(`Orientation permission failed: ${error.message}`);
    }
  };

  const refreshLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation API is not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsError("");
        setLiveLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: Date.now(),
        });
      },
      (error) => {
        setGpsError(`GPS error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    setTitle(report?.title ?? "");
    setDescription(report?.description ?? "");
    setCategory(report?.category ?? "wildlife");
    setStatus(report?.status ?? "open");
    setPhotoBase64(report?.photoBase64 ?? null);
    setLiveLocation(report?.location ?? seedLocation ?? null);
    setHeading(typeof report?.orientation?.heading === "number" ? report.orientation.heading : null);
    setPitch(typeof report?.orientation?.pitch === "number" ? report.orientation.pitch : null);
    setGpsError("");
    setOrientationError("");
    setFormError("");

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setLiveLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            capturedAt: Date.now(),
          });
        },
        (error) => setGpsError(`GPS watch failed: ${error.message}`),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
      );
    } else {
      setGpsError("Geolocation API is not supported.");
    }

    if (typeof DeviceOrientationEvent !== "undefined") {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        setNeedsOrientationPermission(true);
      } else {
        startOrientationListener();
      }
    } else {
      setOrientationError("DeviceOrientation API is not supported on this device.");
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      stopOrientationListener();
    };
  }, [isOpen, report, seedLocation]);

  const handlePhotoInput = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }

    const now = Date.now();
    onSave({
      id: report?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      status,
      location: liveLocation
        ? {
            lat: liveLocation.lat,
            lng: liveLocation.lng,
            accuracy: liveLocation.accuracy,
            capturedAt: now,
          }
        : null,
      orientation: {
        heading,
        pitch,
        capturedAt: now,
      },
      photoBase64,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{report ? "Edit Report" : "Create Report"}</h2>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label className="field">
            <span>Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what happened and what responders should know."
            />
          </label>

          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>

          <div className="sensor-block">
            <div className="sensor-title">Live Sensor Capture</div>
            <div className="sensor-grid">
              <div className="sensor-item">
                <strong>GPS</strong>
                {liveLocation ? (
                  <p>
                    {liveLocation.lat.toFixed(6)}, {liveLocation.lng.toFixed(6)}
                    <br />
                    Accuracy: {Math.round(liveLocation.accuracy ?? 0)}m
                  </p>
                ) : (
                  <p>No GPS lock yet.</p>
                )}
                <button type="button" className="btn ghost small" onClick={refreshLocation}>
                  Refresh GPS
                </button>
                {gpsError && <p className="error-text">{gpsError}</p>}
              </div>

              <div className="sensor-item">
                <strong>Compass + Pitch</strong>
                <p>
                  Heading: {typeof heading === "number" ? `${heading.toFixed(1)} deg (${toCompassDirection(heading)})` : "-"}
                  <br />
                  Pitch: {typeof pitch === "number" ? `${pitch.toFixed(1)} deg` : "-"}
                </p>
                {needsOrientationPermission && (
                  <button type="button" className="btn ghost small" onClick={requestOrientationPermission}>
                    Enable Orientation Sensor
                  </button>
                )}
                {orientationError && <p className="error-text">{orientationError}</p>}
              </div>
            </div>
          </div>

          <div className="field">
            <span>Camera / Gallery Input (stored as Base64)</span>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoInput} />
            {photoBase64 && (
              <div className="photo-preview">
                <img src={photoBase64} alt="Report preview" />
                <button type="button" className="btn danger small" onClick={() => setPhotoBase64(null)}>
                  Remove Photo
                </button>
              </div>
            )}
          </div>

          {formError && <p className="error-text">{formError}</p>}

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary">
              Save Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [reports, setReports] = usePersistedState("echo_reports_v2", []);
  const [syncEndpoint, setSyncEndpoint] = usePersistedState("echo_sync_endpoint", DEFAULT_SYNC_ENDPOINT);
  const [activePage, setActivePage] = usePersistedState("echo_active_page", "home");
  const [themeMode, setThemeMode] = usePersistedState("echo_theme_mode", "light");
  const [selectedId, setSelectedId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [seedLocation, setSeedLocation] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [deviceContactOverride, setDeviceContactOverride] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const importInputRef = useRef(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode === "dark" ? "dark" : "light");
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-page", activePage);
  }, [activePage]);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setSyncMessage("Network online. You can now sync pending reports.");
    };
    const onOffline = () => {
      setOnline(false);
      setSyncMessage("Network offline. New edits will remain local until synced.");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    if (!reports.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !reports.some((item) => item.id === selectedId)) {
      setSelectedId(reports[0].id);
    }
  }, [reports, selectedId]);

  const pendingCount = useMemo(() => reports.filter((item) => item.pendingSync).length, [reports]);

  const filteredReports = useMemo(() => {
    if (filterCategory === "all") return reports;
    return reports.filter((item) => item.category === filterCategory);
  }, [reports, filterCategory]);

  const selectedReport = useMemo(
    () => reports.find((item) => item.id === selectedId) ?? null,
    [reports, selectedId]
  );

  const mapCenter = useMemo(() => {
    if (selectedReport?.location) {
      return [selectedReport.location.lat, selectedReport.location.lng];
    }
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    const firstWithLocation = reports.find((item) => item.location);
    if (firstWithLocation?.location) {
      return [firstWithLocation.location.lat, firstWithLocation.location.lng];
    }
    return FALLBACK_CENTER;
  }, [selectedReport, userLocation, reports]);

  const handleSaveReport = (draft) => {
    const now = Date.now();

    if (draft.id) {
      setReports((prev) =>
        prev.map((item) =>
          item.id === draft.id
            ? {
                ...item,
                ...draft,
                updatedAt: now,
                pendingSync: true,
              }
            : item
        )
      );
      setSelectedId(draft.id);
      setSyncMessage("Report updated locally.");
    } else {
      const created = {
        ...draft,
        id: createId(),
        createdAt: now,
        updatedAt: now,
        syncedAt: null,
        pendingSync: true,
      };
      setReports((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setSyncMessage("Report created locally.");
    }

    setModalOpen(false);
    setEditingReport(null);
    setSeedLocation(null);
  };


  const handleDelete = (id) => {
    const confirmed = window.confirm("Delete this report permanently?");
    if (!confirmed) return;
    setReports((prev) => prev.filter((item) => item.id !== id));
    setSyncMessage("Report deleted locally.");
  };

  const handleStatusToggle = (report) => {
    setReports((prev) =>
      prev.map((item) =>
        item.id === report.id
          ? {
              ...item,
              status: item.status === "resolved" ? "open" : "resolved",
              updatedAt: Date.now(),
              pendingSync: true,
            }
          : item
      )
    );
  };

  const handleExportJson = () => {
    const payload = {
      version: "2.0",
      exportedAt: Date.now(),
      reports,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `echomap-reports-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed) ? parsed : parsed.reports;
        if (!Array.isArray(list)) {
          setSyncMessage("Import failed: no reports array found.");
          return;
        }

        const normalized = list.map(normalizeImportedReport);
        setReports((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const merged = [...prev];
          normalized.forEach((item) => {
            if (!existingIds.has(item.id)) {
              merged.push(item);
            }
          });
          return merged;
        });
        setSyncMessage(`Imported ${normalized.length} reports.`);
      } catch (error) {
        setSyncMessage(`Import failed: ${error.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleSync = async () => {
    if (!online) {
      setSyncMessage("Cannot sync while offline.");
      return;
    }

    setSyncing(true);
    setSyncMessage("Syncing local JSON payload to server...");
    const payload = {
      sentAt: Date.now(),
      reportCount: reports.length,
      pendingCount,
      reports,
      device: {
        userAgent: navigator.userAgent,
        language: navigator.language,
      },
    };

    try {
      const response = await fetch(syncEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const syncedAt = Date.now();
      setReports((prev) =>
        prev.map((item) => ({
          ...item,
          pendingSync: false,
          syncedAt,
        }))
      );
      setSyncMessage(`Sync success at ${formatDateTime(syncedAt)}.`);
    } catch (error) {
      setSyncMessage(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const selectDeviceContact = async () => {
    try {
      if (!navigator.contacts?.select) {
        setSyncMessage("Contacts API is not available. Using simulated routing contact.");
        return;
      }

      const selected = await navigator.contacts.select(["name", "tel", "email"], { multiple: false });
      if (selected?.length) {
        const picked = selected[0];
        setDeviceContactOverride({
          team: "Device Contact",
          contactName: Array.isArray(picked.name) ? picked.name[0] : picked.name || "Selected Contact",
          phone: Array.isArray(picked.tel) ? picked.tel[0] : picked.tel || "-",
          email: Array.isArray(picked.email) ? picked.email[0] : picked.email || "-",
        });
        setSyncMessage("Device contact selected.");
      }
    } catch (error) {
      setSyncMessage(`Contact selection failed: ${error.message}`);
    }
  };

  const shareReport = async (report, routedContact) => {
    const lines = [
      "EchoMap Incident Report",
      `Title: ${report.title}`,
      `Category: ${report.category}`,
      `Status: ${report.status}`,
      `Description: ${report.description}`,
      `Coordinates: ${report.location ? `${report.location.lat.toFixed(6)}, ${report.location.lng.toFixed(6)}` : "unavailable"}`,
      `Compass/Pitch: ${typeof report.orientation?.heading === "number" ? `${report.orientation.heading} deg` : "-"} / ${typeof report.orientation?.pitch === "number" ? `${report.orientation.pitch} deg` : "-"}`,
      `Dispatch: ${routedContact.team} | ${routedContact.contactName} | ${routedContact.phone}`,
      `Created: ${formatDateTime(report.createdAt)}`,
    ];
    const text = lines.join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: `EchoMap - ${report.title}`,
          text,
        });
        setSyncMessage("Report shared successfully.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setSyncMessage("Share API unavailable. Report copied to clipboard.");
        return;
      }

      setSyncMessage("Share API unavailable and clipboard write failed.");
    } catch (error) {
      setSyncMessage(`Share failed: ${error.message}`);
    }
  };

  const currentRoutedContact = selectedReport
    ? deviceContactOverride || resolveRoutedContact(selectedReport.category)
    : null;
  const selectedCategoryMeta = selectedReport ? CATEGORY_DECOR[selectedReport.category] || CATEGORY_DECOR.other : CATEGORY_DECOR.other;
  const resolvedCount = reports.filter((item) => item.status === "resolved").length;
  const openCount = reports.length - resolvedCount;
  const withPhotoCount = reports.filter((item) => item.photoBase64).length;
  const withLocationCount = reports.filter((item) => item.location).length;
  const categoryCounts = CATEGORY_OPTIONS.map((option) => ({
    ...option,
    count: reports.filter((item) => item.category === option.value).length,
  }));
  const recentReports = [...reports].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const openCreateModal = () => {
    setActivePage("workspace");
    setEditingReport(null);
    setSeedLocation(userLocation ? { ...userLocation, capturedAt: Date.now() } : null);
    setModalOpen(true);
  };
  const scrollToWorkspace = () => {
    setActivePage("workspace");
    window.setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  return (
    <div className={`app-shell page-${activePage} ${themeMode === "dark" ? "theme-dark" : "theme-light"}`}>
      <header className="top-nav-shell">
        <div className="top-nav">
          <div className="brand-unit">
            <span className="brand-mark">O</span>
            <div>
              <h1>EchoMap Pins</h1>
              <p>Ecological Field Platform</p>
            </div>
          </div>
          <nav className="nav-links" aria-label="Main sections">
            <button type="button" className={activePage === "home" ? "nav-tab nav-active" : "nav-tab"} onClick={() => setActivePage("home")}>
              Index
            </button>
            <button
              type="button"
              className={activePage === "workspace" ? "nav-tab nav-active" : "nav-tab"}
              onClick={() => {
                setActivePage("workspace");
                window.setTimeout(() => {
                  workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 40);
              }}
            >
              Workspace
            </button>
            <button type="button" className={activePage === "guide" ? "nav-tab nav-active" : "nav-tab"} onClick={() => setActivePage("guide")}>
              Guide
            </button>
            <button
              type="button"
              className={activePage === "community" ? "nav-tab nav-active" : "nav-tab"}
              onClick={() => setActivePage("community")}
            >
              Community
            </button>
            <button type="button" className={activePage === "data" ? "nav-tab nav-active" : "nav-tab"} onClick={() => setActivePage("data")}>
              Data Hub
            </button>
          </nav>
          <div className="top-actions">
            <div className="theme-switch" role="group" aria-label="Theme switch">
              <button
                type="button"
                className={themeMode === "light" ? "theme-option active" : "theme-option"}
                onClick={() => setThemeMode("light")}
              >
                White
              </button>
              <button
                type="button"
                className={themeMode === "dark" ? "theme-option active" : "theme-option"}
                onClick={() => setThemeMode("dark")}
              >
                Black
              </button>
            </div>
            <button className="contact-button" onClick={scrollToWorkspace}>
              <span className="btn-icon" aria-hidden="true">
                +
              </span>
              Enter Workspace
            </button>
          </div>
        </div>
      </header>

      {activePage === "home" && (
      <section className="hero-collage">
        <aside className="nature-sketches">
          <p>Field Notes</p>
          <FernSketch />
          <PineconeSketch />
          <WolfSketch />
        </aside>
        <div className="hero-collage-main">
          <p className="hero-kicker">Humanities Ecology Desk</p>
          <h2>
            Protect Landscapes Through
            <br />
            Careful Field Observation
          </h2>
          <p className="hero-quote">
            Quietly map each trace of nature so response teams can protect habitats with evidence, not guesswork.
          </p>
          <p className="hero-copy">
            This platform is designed for natural observers, conservation volunteers and ecological stewards.
            Record evidence, preserve context and dispatch each report to the right response route.
          </p>
          <div className="hero-action-row">
            <button className="btn primary extended" onClick={scrollToWorkspace}>
              <span className="btn-icon" aria-hidden="true">
                +
              </span>
              Enter Website
            </button>
            <button className="btn ghost extended" onClick={scrollToWorkspace}>
              <span className="btn-icon" aria-hidden="true">
                O
              </span>
              View Live Map
            </button>
            <button
              className="btn ghost extended"
              onClick={() => {
                setEditingReport(null);
                setSeedLocation(userLocation ? { ...userLocation, capturedAt: Date.now() } : null);
                setModalOpen(true);
              }}
            >
              <span className="btn-icon" aria-hidden="true">
                *
              </span>
              Start New Report
            </button>
          </div>
          <div className="status-row">
            <span className={`status-badge ${online ? "online" : "offline"}`}>
              {online ? "Online" : "Offline"}
            </span>
            <span className="status-badge neutral">Reports: {reports.length}</span>
            <span className="status-badge neutral">Pending Sync: {pendingCount}</span>
          </div>
        </div>
      </section>
      )}

      {activePage === "home" && (
        <section className="home-grid">
          <article className="panel home-card home-feature">
            <h3>Quick Start</h3>
            <p>Move into the field workspace, start a report, and capture GPS + orientation data in one flow.</p>
            <div className="home-feature-media">
              <div className="feature-badges">
                <span className={`feature-badge ${online ? "ok" : "warn"}`}>{online ? "Network Online" : "Network Offline"}</span>
                <span className="feature-badge">Pending Sync: {pendingCount}</span>
                <span className="feature-badge">Resolved: {resolvedCount}</span>
              </div>
              <div className="feature-columns">
                <section className="feature-block">
                  <h4>Live Snapshot</h4>
                  <ul className="feature-list">
                    <li>Reports tracked: {reports.length}</li>
                    <li>Mappable reports: {withLocationCount}</li>
                    <li>Reports with photo: {withPhotoCount}</li>
                    <li>
                      Current GPS:{" "}
                      {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : "Permission needed"}
                    </li>
                  </ul>
                </section>
                <section className="feature-block">
                  <h4>Recent Activity</h4>
                  {recentReports.length > 0 ? (
                    <ul className="feature-list">
                      {recentReports.slice(0, 3).map((item) => (
                        <li key={item.id}>
                          <strong>{item.title}</strong>
                          <span>{formatDateTime(item.updatedAt)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ol className="feature-flow">
                      <li>Create a report from map or New Report button.</li>
                      <li>Capture GPS, orientation, and optional photo proof.</li>
                      <li>Run Sync JSON when network is available.</li>
                    </ol>
                  )}
                </section>
              </div>
            </div>
            <div className="home-actions">
              <button className="btn primary extended" onClick={scrollToWorkspace}>
                <span className="btn-icon" aria-hidden="true">
                  +
                </span>
                Open Workspace
              </button>
              <button className="btn ghost extended" onClick={openCreateModal}>
                <span className="btn-icon" aria-hidden="true">
                  O
                </span>
                Create First Report
              </button>
            </div>
          </article>
          <article className="panel home-card home-metrics">
            <h3>System Snapshot</h3>
            <ul className="metric-list">
              <li>Total reports: {reports.length}</li>
              <li>Open reports: {openCount}</li>
              <li>Resolved reports: {resolvedCount}</li>
              <li>With photos: {withPhotoCount}</li>
              <li>With location: {withLocationCount}</li>
              <li>Pending sync: {pendingCount}</li>
            </ul>
          </article>
          <article className="panel home-card home-links">
            <h3>More Pages</h3>
            <p>Read response playbooks, collaborate with volunteers and review data trends from the same site.</p>
            <div className="home-actions">
              <button className="btn ghost extended" onClick={() => setActivePage("guide")}>
                <span className="btn-icon" aria-hidden="true">
                  ^
                </span>
                Open Guide
              </button>
              <button className="btn ghost extended" onClick={() => setActivePage("community")}>
                <span className="btn-icon" aria-hidden="true">
                  o
                </span>
                Community Hub
              </button>
              <button className="btn ghost extended" onClick={() => setActivePage("data")}>
                <span className="btn-icon" aria-hidden="true">
                  #
                </span>
                Data Hub
              </button>
            </div>
          </article>
        </section>
      )}

      {activePage === "workspace" && (
        <>
          <section className="panel toolbar">
            <button className="btn primary" onClick={openCreateModal}>
              New Report
            </button>
            <button className="btn ghost" onClick={handleSync} disabled={syncing}>
              {syncing ? "Syncing..." : "Sync JSON"}
            </button>
            <button className="btn ghost" onClick={handleExportJson}>
              Export JSON
            </button>
            <button className="btn ghost" onClick={() => importInputRef.current?.click()}>
              Import JSON
            </button>
            <input ref={importInputRef} type="file" accept="application/json" onChange={handleImportJson} hidden />
          </section>

          <section className="panel endpoint-panel">
            <label>
              Sync Endpoint
              <input
                value={syncEndpoint}
                onChange={(event) => setSyncEndpoint(event.target.value)}
                placeholder="https://your-server.example.com/api/reports/sync"
              />
            </label>
            <p className="mini-text">Connection API + JSON sync: reports are posted to this endpoint when you click "Sync JSON".</p>
            {syncMessage && <p className="sync-message">{syncMessage}</p>}
          </section>

          <div className="workspace-grid" id="workspace" ref={workspaceRef}>
            <section className="panel map-panel">
              <h2>Map</h2>
              <p className="mini-text">Tap/click the map to create a new report at that location.</p>
              <div className="map-wrap">
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapRecenter center={mapCenter} />
                  <MapPickLocation
                    onPick={(latlng) => {
                      setSeedLocation({
                        lat: latlng.lat,
                        lng: latlng.lng,
                        accuracy: null,
                        capturedAt: Date.now(),
                      });
                      setEditingReport(null);
                      setModalOpen(true);
                    }}
                  />
                  {reports.filter((item) => item.location).map((item) => (
                    <Marker
                      key={item.id}
                      position={[item.location.lat, item.location.lng]}
                      eventHandlers={{
                        click: () => setSelectedId(item.id),
                      }}
                    >
                      <Popup>
                        <strong>{item.title}</strong>
                        <br />
                        {item.category}
                        <br />
                        {item.status}
                      </Popup>
                    </Marker>
                  ))}
                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>Your current location</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </section>

            <section className="panel list-panel">
              <div className="panel-head">
                <h2>Reports</h2>
                <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
                  <option value="all">All Categories</option>
                  {CATEGORY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="report-list">
                {filteredReports.length === 0 && <p className="empty">No reports in this category.</p>}
                {filteredReports.map((item) => (
                  <button
                    key={item.id}
                    className={`report-card ${item.id === selectedId ? "active" : ""}`}
                    onClick={() => {
                      setSelectedId(item.id);
                      setDeviceContactOverride(null);
                    }}
                  >
                    <div className="report-card-head">
                      <strong>
                        <span className="category-icon">{(CATEGORY_DECOR[item.category] || CATEGORY_DECOR.other).icon}</span>
                        {item.title}
                      </strong>
                      <span className={`chip ${item.status === "resolved" ? "resolved" : "open"}`}>{item.status}</span>
                    </div>
                    <p>
                      {item.description.slice(0, 110)}
                      {item.description.length > 110 ? "..." : ""}
                    </p>
                    <div className="report-meta">
                      <span>{item.category}</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                      <span>{item.pendingSync ? "Pending sync" : "Synced"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel detail-panel">
              <h2>Detail / Dispatch</h2>
              {!selectedReport && <p className="empty">Select a report to see full details.</p>}
              {selectedReport && (
                <>
                  <div className="detail-title-row">
                    <h3>{selectedReport.title}</h3>
                    <span className={`chip ${selectedReport.status === "resolved" ? "resolved" : "open"}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                  <p className="detail-category-mark">
                    <span className="category-icon">{selectedCategoryMeta.icon}</span>
                    {selectedCategoryMeta.label}
                  </p>
                  <p>{selectedReport.description}</p>

                  {selectedReport.photoBase64 && (
                    <div className="detail-photo">
                      <img src={selectedReport.photoBase64} alt={selectedReport.title} />
                    </div>
                  )}

                  <div className="detail-grid">
                    <div>
                      <strong>Timestamp</strong>
                      <p>Created: {formatDateTime(selectedReport.createdAt)}</p>
                      <p>Updated: {formatDateTime(selectedReport.updatedAt)}</p>
                      <p>Synced: {formatDateTime(selectedReport.syncedAt)}</p>
                    </div>
                    <div>
                      <strong>Location</strong>
                      {selectedReport.location ? (
                        <p>
                          {selectedReport.location.lat.toFixed(6)}, {selectedReport.location.lng.toFixed(6)}
                          <br />
                          Accuracy: {Math.round(selectedReport.location.accuracy ?? 0)}m
                        </p>
                      ) : (
                        <p>No location captured.</p>
                      )}
                    </div>
                    <div>
                      <strong>Compass & Accelerometer</strong>
                      <p>
                        Heading:{" "}
                        {typeof selectedReport.orientation?.heading === "number"
                          ? `${selectedReport.orientation.heading} deg (${toCompassDirection(selectedReport.orientation.heading)})`
                          : "-"}
                        <br />
                        Pitch:{" "}
                        {typeof selectedReport.orientation?.pitch === "number"
                          ? `${selectedReport.orientation.pitch} deg`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {currentRoutedContact && (
                    <div className="route-box">
                      <strong>Category Routing Contact</strong>
                      <p>
                        {currentRoutedContact.team}
                        <br />
                        {currentRoutedContact.contactName}
                        <br />
                        {currentRoutedContact.phone} | {currentRoutedContact.email}
                      </p>
                      <div className="route-actions">
                        <button className="btn ghost small" onClick={selectDeviceContact}>
                          Pick Device Contact
                        </button>
                        <button className="btn primary small" onClick={() => shareReport(selectedReport, currentRoutedContact)}>
                          Share / Dispatch
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="detail-actions">
                    <button
                      className="btn ghost"
                      onClick={() => {
                        setEditingReport(selectedReport);
                        setSeedLocation(selectedReport.location);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn ghost" onClick={() => handleStatusToggle(selectedReport)}>
                      Toggle Status
                    </button>
                    <button className="btn danger" onClick={() => handleDelete(selectedReport.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}

      {activePage === "guide" && (
        <section className="guide-grid">
          <article className="panel guide-card">
            <h3>Field Observation Protocol</h3>
            <ol className="simple-list">
              <li>Confirm personal safety and avoid direct confrontation.</li>
              <li>Capture exact GPS coordinates and orientation data.</li>
              <li>Take clear visual evidence and concise descriptions.</li>
              <li>Assign category to trigger proper dispatch route.</li>
              <li>Sync reports when stable network is available.</li>
            </ol>
            <button className="btn primary" onClick={openCreateModal}>
              Start Guided Report
            </button>
          </article>
          <article className="panel guide-card">
            <h3>Category Response Playbook</h3>
            <div className="guide-list">
              {CATEGORY_OPTIONS.map((option) => {
                const route = resolveRoutedContact(option.value);
                return (
                  <div key={option.value} className="guide-item">
                    <strong>{option.label}</strong>
                    <p>{route.team}</p>
                    <p>{route.contactName}</p>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      )}

      {activePage === "community" && (
        <section className="community-grid">
          <article className="panel community-card">
            <h3>Volunteer Missions</h3>
            <ul className="simple-list">
              <li>Wetland wildlife watch: Saturday 07:00</li>
              <li>Urban dumping audit: Sunday 09:30</li>
              <li>Trail damage survey: Wednesday 16:00</li>
            </ul>
            <button className="btn ghost" onClick={openCreateModal}>
              Submit Community Observation
            </button>
          </article>
          <article className="panel community-card">
            <h3>Dispatch Contacts</h3>
            <div className="guide-list">
              {Object.values(CONTACT_ROUTING).map((route) => (
                <div key={route.team} className="guide-item">
                  <strong>{route.team}</strong>
                  <p>{route.contactName}</p>
                  <p>{route.phone}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="panel community-card">
            <h3>Community Metrics</h3>
            <ul className="metric-list">
              <li>Reports submitted this month: {reports.length}</li>
              <li>Resolved ratio: {reports.length ? Math.round((resolvedCount / reports.length) * 100) : 0}%</li>
              <li>Field evidence with media: {withPhotoCount}</li>
              <li>Live mappable reports: {withLocationCount}</li>
            </ul>
          </article>
        </section>
      )}

      {activePage === "data" && (
        <section className="data-grid">
          <article className="panel data-card">
            <h3>Category Distribution</h3>
            <div className="distribution-list">
              {categoryCounts.map((item) => (
                <div key={item.value} className="distribution-item">
                  <div className="distribution-head">
                    <span>{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="distribution-track">
                    <div
                      className="distribution-fill"
                      style={{ width: `${reports.length ? (item.count / reports.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="panel data-card">
            <h3>Recent Report Activity</h3>
            <div className="guide-list">
              {recentReports.length === 0 && <p className="empty">No report activity yet.</p>}
              {recentReports.map((item) => (
                <div key={item.id} className="guide-item">
                  <strong>{item.title}</strong>
                  <p>Updated: {formatDateTime(item.updatedAt)}</p>
                  <p>{item.pendingSync ? "Pending sync" : "Synced"}</p>
                </div>
              ))}
            </div>
            <div className="home-actions">
              <button className="btn ghost" onClick={handleExportJson}>
                Download Data Snapshot
              </button>
              <button className="btn primary" onClick={handleSync} disabled={syncing}>
                {syncing ? "Syncing..." : "Run Sync"}
              </button>
            </div>
          </article>
        </section>
      )}

      <ReportModal
        isOpen={modalOpen}
        report={editingReport}
        seedLocation={seedLocation}
        onClose={() => {
          setModalOpen(false);
          setEditingReport(null);
          setSeedLocation(null);
        }}
        onSave={handleSaveReport}
      />
    </div>
  );
}
