import { useState, useEffect, useRef, useMemo } from "react";
import "./App.css";
import usePersistedState from "./hooks/usePersistedState";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const uid = () => crypto.randomUUID();
const fmtDate = (ms) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const DEMO_CARDS = [
  {
    id: uid(), title: "Glasgow Cathedral", category: "Daily", color: "amber", lat: 55.8623, lng: -4.2352,
    address: "Castle St, Glasgow G4 0QZ", photo: "https://images.unsplash.com/photo-1590501224900-53290083d2b1?w=800",
    text: "Hidden meditation corner in the lower choir, few tourists find this peaceful spot during early morning visits.",
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: uid(), title: "The Lighthouse Rooftop", category: "Scenery", color: "rust", lat: 55.8606, lng: -4.2516,
    address: "11 Mitchell Ln, Glasgow G1 3NU", photo: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800",
    text: "360° view of Glasgow cityscape, best at sunset (6-8pm summer). Hidden Charles Rennie Mackintosh designs on 5th floor.",
    createdAt: Date.now() - 86400000 * 12,
  },
  {
    id: uid(), title: "Stereo Café Bar", category: "Food", color: "sage", lat: 55.8596, lng: -4.2575,
    address: "20-28 Renfield Ln, Glasgow G2 5AR", photo: null,
    text: "Best vegan haggis in town! Hidden vinyl record collection upstairs, ask staff about borrowing system.",
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: uid(), title: "Kelvingrove Bandstand Hidden Trail", category: "Scenery", color: "amber", lat: 55.8693, lng: -4.2909,
    address: "Kelvingrove Park, Glasgow G3 7TA", photo: "https://images.unsplash.com/photo-1505672678657-cc7037095e60?w=800",
    text: "Secret path behind bandstand leads to Victorian-era grotto. Best visited spring mornings 7-9am for wildlife.",
    createdAt: Date.now() - 86400000 * 18,
  },
  {
    id: uid(), title: "University of Glasgow Cloisters", category: "Art", color: "rust", lat: 55.8722, lng: -4.2892,
    address: "University Ave, Glasgow G12 8QQ", photo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800",
    text: "Film location for 'The Batman' (2021). Gothic tunnel system beneath quadrangle open Mon-Fri 2-4pm.",
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: uid(), title: "Riverside Museum Playground", category: "Story", color: "sage", lat: 55.8664, lng: -4.3097,
    address: "100 Pointhouse Pl, Glasgow G3 8RS", photo: null,
    text: "Hidden sandbox with vintage Glasgow tram replica. Local kids' secret hideout, parents rarely notice the historical marker.",
    createdAt: Date.now() - 86400000 * 25,
  },
];

const CATEGORIES = [
  { label: "All", value: "all", icon: "ALL" },
  { label: "Nearby", value: "nearby", icon: "LOCATE" },
  { label: "Daily", value: "Daily", icon: "DAY" },
  { label: "Food", value: "Food", icon: "FOOD" },
  { label: "Art", value: "Art", icon: "ART" },
  { label: "Scenery", value: "Scenery", icon: "VIEW" },
  { label: "Story", value: "Story", icon: "STORY" },
  { label: "Other", value: "Other", icon: "MORE" },
];

const CARD_COLORS = ["amber", "rust", "sage"];

const Icons = {
  map: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1.2 6.3c-.1 0 0 15.7 0 15.7l6.8-3.9 8.2 3.8 6.9-3.8c0 0 .1-15.9 0-16L16.3 6 8.1 2.1 1.2 6.3z" style={{strokeDasharray:"1,1"}}/><path d="M8.1 2.3c0 .1-.2 15.8-.1 15.9M16 6.2c.1 0 .1 15.7 0 15.8"/></svg>,
  explore: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10" style={{strokeDasharray:"2,1"}}/><path d="M16.3 7.9l-2.1 6.2-6.1 2.1 1.9-6.4 6.3-1.9z"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  user: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19.1 20.8c0-.1 0-1.9-.1-2.1-.3-1.8-1.2-3.1-3.9-3.8-1.1-.3-2.2-.3-3.1-.3-1 0-2.1.1-3.2.4-2.5.6-3.5 2-3.7 3.7 0 .3-.1 2 0 2.1"/><circle cx="12" cy="7" r="4" style={{strokeDasharray:"1.5,0.8"}}/></svg>,
  plus: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12.1 5.2c0 0-.2 13.5-.1 13.6M5.3 12c0 0 13.3-.1 13.5 0"/></svg>,
  x: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18.1 6.2L6 17.9M6.1 6.1l11.8 11.8"/></svg>,
  pin: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21.1 10.2c.1 1.5-.6 3.2-1.8 5.1-1.1 1.8-2.5 3.5-3.8 5-1.1 1.2-2 2.2-2.8 2.8-.3.2-.5.3-.7.3-.2 0-.4-.1-.7-.3-.8-.6-1.7-1.5-2.7-2.7-1.4-1.5-2.8-3.3-3.9-5.1-1.2-2-1.9-3.8-1.8-5.3.1-2.4 1-4.4 2.4-5.8C6.7 2.8 9 2 11.2 2.1c2.3 0 4.6.9 6.2 2.5 1.4 1.3 2.3 3.1 2.5 5.2.1.2.1.3.2.4z" style={{strokeDasharray:"2,1"}}/><circle cx="12" cy="10" r="2.8"/></svg>,
  camera: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M23.1 19.1c0 .5-.2.9-.5 1.3-.4.3-.9.5-1.4.5H3c-.5 0-1-.2-1.4-.5-.3-.4-.5-.8-.5-1.3V8.1c0-.5.2-1 .5-1.3.4-.4.9-.6 1.4-.6h3.9l2.1-2.9 2.1-3H14l2 3 2.1 2.9h3.8c.5 0 1 .2 1.4.6.4.3.6.8.6 1.3v11z" style={{strokeDasharray:"2,1"}}/><circle cx="12" cy="13" r="3.8" style={{strokeDasharray:"1.5,1"}}/></svg>,
  search: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7.8" style={{strokeDasharray:"2,0.8"}}/><path d="m20.8 20.9-4.2-4.3"/></svg>,
  clock: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9.8" style={{strokeDasharray:"2,1"}}/><path d="M12.1 6.2v5.7l3.8 2.1"/></svg>,
  edit: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17.1 3.2c.5-.5 1.1-.8 1.8-.8.7 0 1.3.3 1.9.8.5.6.8 1.2.8 1.9 0 .7-.3 1.3-.9 1.8L8.1 19.8 7.6 20.4 2.1 21.9l1.5-5.4.6-.5L17.1 3.2z"/><path d="M15.2 5.1l3.7 3.8"/></svg>,
  trash: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3.1 6.2h17.8M18.9 6.1v13.8c0 .5-.2 1-.5 1.4-.4.3-.9.5-1.4.5H7.1c-.5 0-1-.2-1.4-.5-.4-.4-.6-.9-.6-1.4V6.1m3.1 0V4.2c0-.5.2-1 .6-1.4.4-.3.9-.6 1.4-.6h3.7c.5 0 1 .3 1.4.6.4.4.6.9.6 1.4v1.9" style={{strokeDasharray:"2,1"}}/><path d="M10.1 11v6M14 11v6"/></svg>,
  back: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14.9 17.9l-5.8-5.8 5.9-6"/></svg>,
  share: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="18" cy="5" r="2.8" style={{strokeDasharray:"1.5,0.8"}}/><circle cx="6" cy="12" r="2.8" style={{strokeDasharray:"1.5,0.8"}}/><circle cx="18" cy="19" r="2.8" style={{strokeDasharray:"1.5,0.8"}}/><path d="m8.5 13.4 6.9 4M15.3 6.5l-6.7 4"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.1 6.2L9 16.9l-4.9-4.8"/></svg>,
  wifi: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5.2 12.6c1.8-1.8 4.2-2.9 6.8-2.9 2.6 0 5 1.1 6.8 2.9M1.5 9.1c2.8-2.8 6.6-4.5 10.5-4.5 3.9 0 7.7 1.7 10.5 4.5M8.6 16.2c.9-.9 2.2-1.5 3.4-1.5 1.2 0 2.5.6 3.4 1.5" style={{strokeDasharray:"1.5,1"}}/><circle cx="12" cy="20" r="1.2" fill="currentColor"/></svg>,
  wifiOff: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m2.1 2.1 19.8 19.8M8.6 16.6c.8-.8 1.8-1.3 2.9-1.5M2.1 8.9c1.4-1.2 2.9-2.1 4.5-2.7m4.5-1c3.7 0 7.3 1.5 10.1 4.1" style={{strokeDasharray:"1.5,1"}}/><circle cx="12" cy="20" r="1.2" fill="currentColor"/></svg>,
  locate: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21.1 10.2c.1 1.5-.6 3.2-1.8 5.1-1.1 1.8-2.5 3.5-3.8 5-1.1 1.2-2 2.2-2.8 2.8-.3.2-.5.3-.7.3-.2 0-.4-.1-.7-.3-.8-.6-1.7-1.5-2.7-2.7-1.4-1.5-2.8-3.3-3.9-5.1-1.2-2-1.9-3.8-1.8-5.3.1-2.4 1-4.4 2.4-5.8C6.7 2.8 9 2 11.2 2.1c2.3 0 4.6.9 6.2 2.5 1.4 1.3 2.3 3.1 2.5 5.2.1.2.1.3.2.4z" style={{strokeDasharray:"2,1"}}/><circle cx="12" cy="10" r="2.8"/></svg>,
  mic: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2c1.7 0 3 1.3 3 3v6c0 1.7-1.3 3-3 3s-3-1.3-3-3V5c0-1.7 1.3-3 3-3z" style={{strokeDasharray:"1.5,1"}}/><path d="M19 10v1c0 3.9-3.1 7-7 7s-7-3.1-7-7v-1M12 18v4M8 22h8"/></svg>,
  download: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-4M7 10l5 5 5-5M12 15V3" style={{strokeDasharray:"1.5,1"}}/></svg>,
  upload: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-4M7 6l5-5 5 5M12 1v14" style={{strokeDasharray:"1.5,1"}}/></svg>,
};

const T = {
  light: {
    bg: "#FCEEF5", card: "#FFFFFF", inputBg: "#FFF5FB", fg: "#1A1A1A", mutedFg: "#8B7E8E",
    muted: "#F5E5EE", border: "#F0D9E6", borderHeavy: "#E5C9D9", shadow: "rgba(0,0,0,0.08)",
    primary: "#E91E63", primaryFg: "#FFFFFF",
    amber: "#FF6B9D", rust: "#FF4757", sage: "#9368B7",
    success: "#4ECDC4", error: "#FF6B9D", warning: "#FFB142", info: "#5F9DF7",
    sidebar: "#FFF8FC", mapBg: "#FFFFFF",
    bgPattern: "radial-gradient(circle at 20% 50%, #FFE5F3 0%, transparent 50%), radial-gradient(circle at 80% 50%, #FFE5F3 0%, transparent 50%), radial-gradient(circle at 40% 80%, #F8E0EB 0%, transparent 50%), radial-gradient(circle at 0% 0%, #FFD1E3 0%, transparent 50%)",
  },
  dark: {
    bg: "#1A1625", card: "#2A2438", inputBg: "#352F44", fg: "#F8F0FF", mutedFg: "#B8A8CC",
    muted: "#2A2438", border: "#3E3552", borderHeavy: "#4E4563", shadow: "rgba(0,0,0,0.5)",
    primary: "#BA68C8", primaryFg: "#FFFFFF",
    amber: "#FFB74D", rust: "#EF5350", sage: "#81C784",
    success: "#4ECDC4", error: "#FF6B9D", warning: "#FFB142", info: "#64B5F6",
    sidebar: "#221C35", mapBg: "#1F1F1F",
    bgPattern: "radial-gradient(circle at 20% 50%, #2A1F38 0%, transparent 50%), radial-gradient(circle at 80% 50%, #2A1F38 0%, transparent 50%)",
  },
};

const colorMap = {
  amber: {
    light: { bg: "#FFF9E5", border: "#FFD9A6", text: "#D97E2A" },
    dark: { bg: "#3A3220", border: "#5A4F38", text: "#FFB74D" },
  },
  rust: {
    light: { bg: "#FFE8F0", border: "#FFBDD1", text: "#E91E63" },
    dark: { bg: "#3A2628", border: "#5A3F42", text: "#F48FB1" },
  },
  sage: {
    light: { bg: "#F0E8FF", border: "#D9BFFF", text: "#9368B7" },
    dark: { bg: "#2A2435", border: "#3F3A4F", text: "#BA68C8" },
  },
};

const cssKeyframes = `
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.3); opacity: 0.4; } }
@keyframes fabIn { from { transform: scale(0) rotate(-180deg); } to { transform: scale(1) rotate(0); } }
@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
@keyframes bookFlip { 
  0% { opacity: 0; transform: perspective(1000px) rotateY(-15deg) scale(0.9); }
  100% { opacity: 1; transform: perspective(1000px) rotateY(0deg) scale(1); }
}
@keyframes slideInRight { 
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideUpFade {
  from { transform: translateX(-50%) translateY(20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}
@keyframes floatUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
`;

export default function EchoMapApp() {
  const [showLanding, setShowLanding] = usePersistedState("showLanding", true);
  const [dark, setDark] = usePersistedState("dark", true);
  const [cards, setCards] = usePersistedState("cards", DEMO_CARDS);
  const [view, setView] = useState("map");
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [toast, setToast] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCardDetail, setShowCardDetail] = useState(false);
  const [sidebarWidth, setSidebarWidth] = usePersistedState("sidebarWidth", 420);
  const [isResizing, setIsResizing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  const theme = dark ? T.dark : T.light;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateCard = (data) => {
    const newCard = { id: uid(), ...data, color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)], createdAt: Date.now() };
    setCards([...cards, newCard]);
    showToast("Story card created successfully!");
    setView("explore");
  };

  const handleUpdateCard = (id, updates) => {
    setCards(cards.map(c => c.id === id ? { ...c, ...updates } : c));
    showToast("Story card updated!");
    setSelectedCard(null);
  };

  const handleDeleteCard = (id) => {
    setCards(cards.filter(c => c.id !== id));
    showToast("Story card deleted!");
    setSelectedCard(null);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ cards, exportedAt: Date.now(), version: "1.0" }, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `echomap-pins-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Data exported successfully!");
  };

  const handleImportData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.cards && Array.isArray(data.cards)) {
          const confirm = window.confirm(`Import ${data.cards.length} cards? This will merge with existing data.`);
          if (confirm) {
            const existingIds = new Set(cards.map(c => c.id));
            const newCards = data.cards.filter(c => !existingIds.has(c.id));
            setCards([...cards, ...newCards]);
            showToast(`Imported ${newCards.length} new cards!`, "success");
          }
        } else {
          showToast("Invalid file format!", "error");
        }
      } catch (err) {
        showToast("Failed to import: " + err.message, "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const onOnline = () => { setOnline(true); showToast("Back online!", "success"); };
    const onOffline = () => { setOnline(false); showToast("Offline mode activated", "warning"); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log("Geolocation error:", error)
      );
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 300 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // PWA update detection
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                setWaitingWorker(newWorker);
              }
            });
          }
        });
      });

      // Check for updates every 60 seconds
      const interval = setInterval(() => {
        navigator.serviceWorker.ready.then(registration => {
          registration.update();
        });
      }, 60000);

      return () => clearInterval(interval);
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      waitingWorker.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') {
          window.location.reload();
        }
      });
    }
  };

  const allCards = cards;
  const filteredCards = cards
    .filter(c => {
      if (filterCategory === "all") return true;
      if (filterCategory === "nearby") {
        if (!userLocation || !calculateDistance) return false;
        const distance = calculateDistance(userLocation.lat, userLocation.lng, c.lat, c.lng);
        return distance <= 5000; // 5km radius
      }
      return c.category === filterCategory;
    })
    .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.text.toLowerCase().includes(searchQuery.toLowerCase()) || c.address?.toLowerCase().includes(searchQuery.toLowerCase()));

  // Show landing page first
  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <>
      <style>{cssKeyframes}</style>
      <div style={{
        minHeight: "100vh", 
        background: `${theme.bgPattern}, ${theme.bg}`,
        backgroundSize: "cover",
        color: theme.fg,
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        width: "100%", display: "flex", flexDirection: "column", overflow: "hidden",
        position: "relative",
      }}>
        {/* Decorative Elements */}
        {!dark && (
          <>
            <div style={{
              position: "absolute", top: "5%", left: "3%", fontSize: 32, opacity: 0.15,
              animation: "pulse 3s infinite", zIndex: 0, color: "#FFB6D9",
            }}>♥</div>
            <div style={{
              position: "absolute", top: "15%", right: "8%", fontSize: 24, opacity: 0.12,
              animation: "pulse 4s infinite 1s", zIndex: 0, color: "#DDA0DD",
            }}>★</div>
            <div style={{
              position: "absolute", bottom: "20%", left: "5%", fontSize: 28, opacity: 0.1,
              animation: "pulse 3.5s infinite 0.5s", zIndex: 0, color: "#FFB6D9",
            }}>♥</div>
            <div style={{
              position: "absolute", bottom: "10%", right: "12%", fontSize: 20, opacity: 0.13,
              animation: "pulse 4.5s infinite 1.5s", zIndex: 0, color: "#DDA0DD",
            }}>★</div>
            <div style={{
              position: "absolute", top: "40%", right: "4%", fontSize: 26, opacity: 0.11,
              animation: "pulse 3.8s infinite 2s", zIndex: 0, color: "#FFB6D9",
            }}>♥</div>
            <div style={{
              position: "absolute", top: "60%", left: "2%", fontSize: 22, opacity: 0.14,
              animation: "pulse 4.2s infinite 0.8s", zIndex: 0, color: "#DDA0DD",
            }}>★</div>
          </>
        )}
        
        <ModernTopBar 
          theme={theme} 
          dark={dark} 
          setDark={setDark} 
          online={online} 
          onExport={handleExportData}
          onImportClick={handleImportData}
        />

        <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
          {/* Sidebar */}
          <div style={{
            width: sidebarOpen ? sidebarWidth : 0,
            background: theme.sidebar,
            borderRight: `1px solid ${theme.border}`,
            transition: isResizing ? "none" : "width 0.3s ease",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
            position: "relative",
          }}>
            {sidebarOpen && (
              <SidebarContent
                theme={theme}
                dark={dark}
                cards={filteredCards}
                onCardClick={(card) => { setSelectedCard(card); setShowCardDetail(true); }}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                onCreate={() => setView("create")}
                userLocation={userLocation}
                calculateDistance={calculateDistance}
              />
            )}
            {/* Resize Handle */}
            {sidebarOpen && (
              <div
                onMouseDown={() => setIsResizing(true)}
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 8,
                  cursor: "col-resize",
                  background: "transparent",
                  zIndex: 40,
                }}
              >
                <div style={{
                  position: "absolute",
                  right: 2,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 4,
                  height: 60,
                  background: theme.border,
                  borderRadius: 2,
                  opacity: 0.4,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}
                />
              </div>
            )}
          </div>

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              position: "absolute",
              left: sidebarOpen ? sidebarWidth - 15 : 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: 32,
              height: 80,
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderLeft: sidebarOpen ? "none" : `1px solid ${theme.border}`,
              borderRadius: sidebarOpen ? "0 8px 8px 0" : "8px",
              cursor: "pointer",
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              color: theme.mutedFg,
            }}
          >
            <span style={{ fontSize: 18, transform: sidebarOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }}>›</span>
          </button>

          {/* Map */}
          <div style={{ flex: 1, position: "relative", background: theme.mapBg }}>
            {view === "map" && <LeafletMapView theme={theme} dark={dark} cards={allCards} onCardClick={(card) => { setSelectedCard(card); setShowCardDetail(true); }} />}
            {view === "create" && <CreateView theme={theme} dark={dark} onCreate={handleCreateCard} onBack={() => setView("map")} />}
            {view === "profile" && <ProfileView theme={theme} dark={dark} cards={allCards} setDark={setDark} />}
          </div>
        </div>

        {/* 3D Flip Card Detail */}
        {selectedCard && showCardDetail && (
          <>
            {/* Backdrop overlay */}
            <div 
              onClick={() => { setShowCardDetail(false); setSelectedCard(null); }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: dark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.3)",
                backdropFilter: "blur(4px)",
                zIndex: 9998,
                animation: "fadeIn 0.3s ease",
                cursor: "pointer",
              }}
            />
            <FlipCardDetail
              theme={theme}
              dark={dark}
              card={selectedCard}
              onClose={() => { setShowCardDetail(false); setSelectedCard(null); }}
              onDelete={handleDeleteCard}
              onUpdate={handleUpdateCard}
            />
          </>
        )}

        {toast && <Toast theme={theme} dark={dark} msg={toast.msg} type={toast.type} />}
        {!online && <OfflineBanner theme={theme} />}
        
        {/* PWA Update Notification */}
        {updateAvailable && (
          <div style={{
            position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
            background: theme.primary,
            color: theme.primaryFg,
            padding: "14px 24px",
            borderRadius: 16,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            display: "flex", alignItems: "center", gap: 16,
            zIndex: 10000,
            animation: "slideUpFade 0.3s ease",
            border: "2px solid rgba(255,255,255,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icons.search style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>New version available!</span>
            </div>
            <button onClick={handleUpdate} style={{
              background: "rgba(255,255,255,0.95)",
              color: theme.primary,
              border: "none",
              padding: "6px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Reload
            </button>
            <button onClick={() => setUpdateAvailable(false)} style={{
              background: "transparent",
              color: theme.primaryFg,
              border: "none",
              padding: "6px 10px",
              borderRadius: 10,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              opacity: 0.7,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}
            >
              Later
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Hand-drawn style SVG icons
const HandDrawnIcons = {
  location: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 4c-6.5 0-12 5.2-12 11.5 0 8.5 11.2 24 11.7 24.6.3.4.8.4 1.1 0 .5-.6 11.7-16.1 11.7-24.6C36 9.2 30.5 4 24 4z" fill="none" strokeDasharray="2,2"/>
      <circle cx="24" cy="15" r="4" fill="none"/>
      <path d="M23 5c-5 1-10 5-10 10" opacity="0.3"/>
    </svg>
  ),
  camera: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="14" width="36" height="26" rx="3" fill="none" strokeDasharray="1,1"/>
      <path d="M15 14l3-6h12l3 6" fill="none"/>
      <circle cx="24" cy="27" r="7" fill="none"/>
      <circle cx="24" cy="27" r="4" fill="none" strokeDasharray="2,2"/>
      <circle cx="36" cy="20" r="1.5" fill="currentColor"/>
      <path d="M8 16c1 0 2 1 2 2" opacity="0.3"/>
    </svg>
  ),
  microphone: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="18" y="8" width="12" height="18" rx="6" fill="none" strokeDasharray="2,2"/>
      <path d="M12 24c0 6.6 5.4 12 12 12s12-5.4 12-12" fill="none"/>
      <path d="M24 36v8" />
      <path d="M18 44h12" strokeWidth="3"/>
      <path d="M20 12c0-2 1-4 4-4" opacity="0.3"/>
      <circle cx="21" cy="16" r="1" fill="currentColor"/>
      <circle cx="27" cy="16" r="1" fill="currentColor"/>
    </svg>
  ),
  cloud: () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M36 28c3.3 0 6-2.7 6-6s-2.7-6-6-6c-.3 0-.7 0-1 .1C34 11.2 29.4 8 24 8c-6.6 0-12 5.4-12 12 0 .7.1 1.4.2 2C9.3 22.6 7 25.5 7 29c0 4.4 3.6 8 8 8h21z" fill="none" strokeDasharray="2,3"/>
      <path d="M16 28l4 4 8-8" strokeWidth="3"/>
      <path d="M10 24c0-1 .5-2 1-2.5" opacity="0.3"/>
    </svg>
  ),
  sparkles: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" fill="currentColor" opacity="0.3"/>
      <path d="M19 13l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="currentColor" opacity="0.5"/>
      <path d="M6 18l.5 1.5L8 20l-1.5.5L6 22l-.5-1.5L4 20l1.5-.5L6 18z" fill="currentColor" opacity="0.4"/>
    </svg>
  ),
};

function LandingPage({ onEnter }) {
  const stats = [
    { value: "1000+", label: "Stories Shared" },
    { value: "50+", label: "Cities" },
    { value: "10K+", label: "Memories Captured" },
    { value: "100+", label: "Active Users" },
  ];

  return (
    <>
      <style>{cssKeyframes}</style>
      <div style={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #fff7e6 0%, #ffe8cc 50%, #ffd9b3 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        {/* Background image overlay - mushroom forest illustration */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("/src/assets/landing-background.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.25,
          filter: "blur(2px)",
          pointerEvents: "none",
        }} />

        {/* Decorative overlay to blend background */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(255,247,230,0.7) 0%, rgba(255,232,204,0.7) 50%, rgba(255,217,179,0.7) 100%)",
          pointerEvents: "none",
        }} />

        {/* Main content */}
        <div style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          maxWidth: 900,
          padding: "0 40px",
          animation: "floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          {/* Logo */}
          <div style={{
            width: 100,
            height: 100,
            borderRadius: 28,
            background: "linear-gradient(135deg, #E91E63, #FF6B9D)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 30px",
            boxShadow: "0 20px 60px rgba(233, 30, 99, 0.4)",
            border: "3px solid rgba(255, 255, 255, 0.8)",
            animation: "scaleUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both",
          }}>
            <Icons.map style={{ width: 50, height: 50, color: "white" }} />
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Crimson Pro', serif",
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 20,
            background: "linear-gradient(135deg, #C62828, #E91E63, #9C27B0)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.03em",
            animation: "floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
          }}>
            Bringing Your Vision to Life<br />with Stories and Memories
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 22,
            lineHeight: 1.6,
            color: "#5D4E37",
            marginBottom: 50,
            maxWidth: 700,
            margin: "0 auto 50px",
            fontWeight: 500,
            animation: "floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both",
          }}>
            Discover and share local stories, capture moments with GPS precision,
            and explore the world through the eyes of your community.
          </p>

          {/* Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 30,
            marginBottom: 60,
            animation: "floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both",
          }}>
            {stats.map((stat, idx) => (
              <div key={idx} style={{
                padding: "30px 20px",
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                borderRadius: 20,
                border: "2px solid rgba(233, 30, 99, 0.2)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 15px 40px rgba(233, 30, 99, 0.15)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.08)";
              }}
              >
                <div style={{
                  fontSize: 42,
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #E91E63, #FF6B9D)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: 8,
                  fontFamily: "'Crimson Pro', serif",
                }}>{stat.value}</div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#5D4E37",
                  letterSpacing: "0.02em",
                }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button onClick={onEnter} style={{
            padding: "20px 60px",
            fontSize: 20,
            fontWeight: 800,
            background: "linear-gradient(135deg, #E91E63, #FF6B9D)",
            color: "white",
            border: "3px solid rgba(255, 255, 255, 0.8)",
            borderRadius: 20,
            cursor: "pointer",
            boxShadow: "0 15px 40px rgba(233, 30, 99, 0.4)",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            fontFamily: "inherit",
            animation: "floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both",
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "center",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
            e.currentTarget.style.boxShadow = "0 20px 50px rgba(233, 30, 99, 0.5)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "0 15px 40px rgba(233, 30, 99, 0.4)";
          }}
          >
            <HandDrawnIcons.sparkles />
            Start Exploring Now
          </button>

          {/* Features */}
          <div style={{
            marginTop: 70,
            display: "flex",
            justifyContent: "center",
            gap: 50,
            flexWrap: "wrap",
            animation: "floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both",
          }}>
            {[
              { icon: HandDrawnIcons.location, text: "GPS Location", color: "#E91E63" },
              { icon: HandDrawnIcons.camera, text: "Photo Capture", color: "#FF6B9D" },
              { icon: HandDrawnIcons.microphone, text: "Voice Notes", color: "#9C27B0" },
              { icon: HandDrawnIcons.cloud, text: "Offline Ready", color: "#FF9100" },
            ].map((feature, idx) => (
              <div key={idx} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                fontSize: 16,
                fontWeight: 600,
                color: "#5D4E37",
                padding: "20px",
                background: "rgba(255, 255, 255, 0.6)",
                borderRadius: 16,
                border: "2px solid rgba(233, 30, 99, 0.15)",
                backdropFilter: "blur(8px)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.borderColor = feature.color;
                e.currentTarget.style.boxShadow = `0 10px 30px ${feature.color}30`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(233, 30, 99, 0.15)";
                e.currentTarget.style.boxShadow = "none";
              }}
              >
                <div style={{ color: feature.color }}>{feature.icon()}</div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div style={{
          position: "absolute",
          bottom: 30,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 14,
          color: "#8B7355",
          opacity: 0.7,
        }}>
          A Progressive Web App • Works Offline • Install on Any Device
        </div>
      </div>
    </>
  );
}

function ModernTopBar({ theme, dark, setDark, online, onExport, onImportClick }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => { const t = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })), 30000); return () => clearInterval(t); }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 32px", background: theme.card,
      borderBottom: `2px solid ${theme.border}`,
      boxShadow: !dark ? `0 2px 12px rgba(255, 182, 217, 0.12)` : `0 1px 3px ${theme.shadow}`,
      zIndex: 50,
      position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.amber})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 16px ${theme.primary}50`,
          border: !dark ? "2px solid rgba(255, 255, 255, 0.8)" : "none",
        }}>
          <Icons.map style={{ width: 28, height: 28, color: "white" }} />
        </div>
        <div>
          <h1 style={{
            fontFamily: "'Crimson Pro', serif", fontSize: 26, fontWeight: 800,
            margin: 0, letterSpacing: "-0.02em",
            background: !dark ? `linear-gradient(135deg, ${theme.primary}, ${theme.rust})` : "none",
            WebkitBackgroundClip: !dark ? "text" : "none",
            WebkitTextFillColor: !dark ? "transparent" : theme.fg,
          }}>EchoMap Pins</h1>
          <p style={{ fontSize: 14, color: theme.mutedFg, margin: 0, fontWeight: 600 }}>Discover stories around you</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: theme.mutedFg, fontWeight: 600 }}>
          {online ? <Icons.wifi style={{ width: 22, height: 22 }} /> : <Icons.wifiOff style={{ width: 22, height: 22 }} />}
          <span>{time}</span>
        </div>
        
        {/* Export Button */}
        <button onClick={onExport} style={{
          height: 48, padding: "0 20px", borderRadius: 14,
          border: `2px solid ${theme.border}`,
          background: theme.inputBg, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          transition: "all 0.2s",
          boxShadow: !dark ? "0 2px 8px rgba(255, 182, 217, 0.1)" : "none",
          fontSize: 15, fontWeight: 700, color: theme.fg,
          fontFamily: "inherit",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = theme.muted; e.currentTarget.style.transform = "scale(1.05)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = theme.inputBg; e.currentTarget.style.transform = "scale(1)"; }}
        title="Export all data as JSON"
        >
          <Icons.download style={{ width: 22, height: 22 }} />
          Export
        </button>
        
        {/* Import Button */}
        <label style={{
          height: 48, padding: "0 20px", borderRadius: 14,
          border: `2px solid ${theme.border}`,
          background: theme.inputBg, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          transition: "all 0.2s",
          boxShadow: !dark ? "0 2px 8px rgba(255, 182, 217, 0.1)" : "none",
          fontSize: 15, fontWeight: 700, color: theme.fg,
          fontFamily: "inherit",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = theme.muted; e.currentTarget.style.transform = "scale(1.05)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = theme.inputBg; e.currentTarget.style.transform = "scale(1)"; }}
        title="Import data from JSON"
        >
          <Icons.upload style={{ width: 22, height: 22 }} />
          Import
          <input type="file" accept=".json" onChange={onImportClick} style={{ display: "none" }} />
        </label>
        
        <button onClick={() => setDark(!dark)} style={{
          width: 48, height: 48, borderRadius: 14,
          border: `2px solid ${theme.border}`,
          background: theme.inputBg, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
          boxShadow: !dark ? "0 2px 8px rgba(255, 182, 217, 0.1)" : "none",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = theme.muted; e.currentTarget.style.transform = "scale(1.05)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = theme.inputBg; e.currentTarget.style.transform = "scale(1)"; }}
        >
          {dark ? <span style={{ fontSize: 26 }}>☀</span> : <span style={{ fontSize: 26 }}>☾</span>}
        </button>
      </div>
    </div>
  );
}

function SidebarContent({ theme, dark, cards, onCardClick, searchQuery, setSearchQuery, filterCategory, setFilterCategory, onCreate, userLocation, calculateDistance }) {
  // Sort cards by distance if user location is available
  const sortedCards = useMemo(() => {
    if (!userLocation || !calculateDistance) return cards;
    
    return [...cards].sort((a, b) => {
      const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return distA - distB;
    });
  }, [cards, userLocation, calculateDistance]);
  
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>
      {/* Decorative corner elements for light mode */}
      {!dark && (
        <>
          <div style={{
            position: "absolute", top: 10, right: 10, fontSize: 18, opacity: 0.08,
            color: "#FFB6D9", pointerEvents: "none", zIndex: 1,
          }}>★</div>
          <div style={{
            position: "absolute", top: 50, right: 30, fontSize: 14, opacity: 0.06,
            color: "#DDA0DD", pointerEvents: "none", zIndex: 1,
          }}>♥</div>
        </>
      )}
      
      {/* Search Bar */}
      <div style={{ padding: "20px 20px 16px", position: "relative", zIndex: 2 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 18px", borderRadius: 16,
          background: theme.inputBg,
          border: `2px solid ${theme.border}`,
          boxShadow: !dark ? "0 2px 8px rgba(255, 182, 217, 0.1)" : "none",
        }}>
          <Icons.search style={{ width: 22, height: 22, color: theme.mutedFg }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search stories..."
            style={{
              border: "none", background: "none", outline: "none",
              width: "100%", fontSize: 16, color: theme.fg,
              fontFamily: "inherit", fontWeight: 500,
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", gap: 10, padding: "0 20px 20px",
        overflowX: "auto", scrollbarWidth: "thin",
      }}>
        {CATEGORIES.map(cat => {
          const active = filterCategory === cat.value;
          return (
            <button key={cat.value} onClick={() => setFilterCategory(cat.value)} style={{
              padding: "12px 20px", borderRadius: 24, whiteSpace: "nowrap",
              fontSize: 15, fontWeight: active ? 700 : 600,
              background: active ? theme.primary : theme.card,
              color: active ? theme.primaryFg : theme.fg,
              border: `2px solid ${active ? theme.primary : theme.border}`,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: active && !dark ? "0 2px 12px rgba(233, 30, 99, 0.3)" : "none",
            }}
            onMouseEnter={e => { 
              if (!active) { 
                e.currentTarget.style.background = theme.inputBg; 
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={e => { 
              if (!active) { 
                e.currentTarget.style.background = theme.card; 
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Card List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: theme.mutedFg }}>
            {sortedCards.length} {sortedCards.length === 1 ? "Story" : "Stories"}{userLocation && <span style={{ color: theme.primary, fontSize: 13, marginLeft: 6 }}>• Sorted by distance</span>}
          </p>
          <button onClick={onCreate} style={{
            padding: "10px 18px", borderRadius: 12, fontSize: 15, fontWeight: 700,
            background: theme.primary, color: theme.primaryFg,
            border: "none", cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: !dark ? "0 2px 12px rgba(233, 30, 99, 0.3)" : "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <Icons.plus style={{ width: 20, height: 20 }} />
            New
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedCards.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "40px 20px",
              color: theme.mutedFg,
            }}>
              <Icons.explore style={{ width: 56, height: 56, opacity: 0.3, margin: "0 auto 12px" }} />
              <p style={{ fontSize: 18, fontWeight: 700 }}>No stories found</p>
              <p style={{ fontSize: 14, marginTop: 4, fontWeight: 500 }}>Create your first story card</p>
            </div>
          ) : (
            sortedCards.map((card, i) => (
              <SidebarCard 
                key={card.id} 
                card={card} 
                theme={theme} 
                dark={dark} 
                onClick={() => onCardClick(card)} 
                delay={i * 0.03} 
                userLocation={userLocation}
                calculateDistance={calculateDistance}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarCard({ card, theme, dark, onClick, delay = 0, userLocation, calculateDistance }) {
  const c = colorMap[card.color]?.[dark ? "dark" : "light"] || colorMap.amber[dark ? "dark" : "light"];
  
  const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };
  
  const distance = userLocation && calculateDistance 
    ? calculateDistance(userLocation.lat, userLocation.lng, card.lat, card.lng)
    : null;

  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "16px", borderRadius: 18,
      background: theme.card, 
      border: `2px solid ${theme.border}`,
      cursor: "pointer", textAlign: "left", width: "100%",
      animation: `fadeIn 0.3s ease ${delay}s both`,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: !dark ? "0 2px 8px rgba(255, 182, 217, 0.08)" : "none",
      position: "relative",
      overflow: "hidden",
    }}
    onMouseEnter={e => { 
      e.currentTarget.style.background = theme.inputBg; 
      e.currentTarget.style.transform = "translateX(6px) scale(1.02)"; 
      e.currentTarget.style.boxShadow = !dark ? "0 4px 16px rgba(255, 182, 217, 0.15)" : "0 4px 12px rgba(0,0,0,0.3)";
    }}
    onMouseLeave={e => { 
      e.currentTarget.style.background = theme.card; 
      e.currentTarget.style.transform = "translateX(0) scale(1)"; 
      e.currentTarget.style.boxShadow = !dark ? "0 2px 8px rgba(255, 182, 217, 0.08)" : "none";
    }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: 16, flexShrink: 0,
        background: card.photo ? `url(${card.photo}) center/cover` : `linear-gradient(135deg, ${c.bg}, ${c.border})`,
        border: `3px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 800, color: c.text,
        boxShadow: `0 4px 12px ${c.border}40`,
      }}>
        {!card.photo && card.category.slice(0, 3).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontSize: 18, fontWeight: 700, marginBottom: 6,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{card.title}</h4>
        <p style={{ fontSize: 14, color: theme.mutedFg, marginBottom: 4, fontWeight: 600 }}>
          {card.category} · {fmtDate(card.createdAt)}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: theme.mutedFg, fontWeight: 500 }}>
            <Icons.locate style={{ width: 16, height: 16 }} />
            <span>{card.address?.split(",")[0] || "Location"}</span>
          </div>
          {distance !== null && (
            <div style={{ 
              display: "flex", alignItems: "center", gap: 4, 
              fontSize: 13, fontWeight: 700,
              color: theme.primary,
              padding: "4px 8px", borderRadius: 10,
              background: !dark ? `${theme.primary}15` : `${theme.primary}20`,
            }}>
              <span>→</span>
              <span>{formatDistance(distance)}</span>
            </div>
          )}
        </div>
      </div>
      <Icons.explore style={{ width: 26, height: 26, color: theme.mutedFg, flexShrink: 0 }} />
    </button>
  );
}

function LeafletMapView({ theme, dark, cards, onCardClick }) {
  const mapCenter = [55.8642, -4.2518];
  const mapZoom = 13;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: "100%", height: "100%", background: theme.mapBg }}
        zoomControl={false}
      >
        <TileLayer
          url={dark 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {cards.map(card => (
          <Marker
            key={card.id}
            position={[card.lat, card.lng]}
            eventHandlers={{
              click: () => onCardClick(card),
            }}
          >
            <Popup>
              <div style={{ fontFamily: "inherit", minWidth: 200 }}>
                <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>{card.title}</h4>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "#666" }}>{card.category}</p>
                {card.photo && <img src={card.photo} alt={card.title} style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />}
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.4 }}>{card.text.slice(0, 100)}...</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Controls */}
      <div style={{
        position: "absolute", top: 20, right: 20, zIndex: 1000,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <button style={{
          width: 44, height: 44, borderRadius: 10,
          background: theme.card, border: `1px solid ${theme.border}`,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 2px 8px ${theme.shadow}`,
        }}>
          <Icons.locate style={{ width: 20, height: 20, color: theme.fg }} />
        </button>
      </div>
    </div>
  );
}

function FlipCardDetail({ theme, dark, card, onClose, onDelete, onUpdate }) {
  const c = colorMap[card.color]?.[dark ? "dark" : "light"] || colorMap.amber[dark ? "dark" : "light"];
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(card.audioURL || null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [editedText, setEditedText] = useState(card.text);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        const reader = new FileReader();
        reader.onloadend = () => {
          onUpdate({ ...card, audioURL: reader.result });
        };
        reader.readAsDataURL(blob);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const saveEdit = () => {
    onUpdate({ ...card, title: editedTitle, text: editedText, updatedAt: Date.now() });
    setEditMode(false);
  };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: "min(600px, 50vw)", zIndex: 9999,
      background: theme.card,
      borderLeft: `3px solid ${theme.border}`,
      boxShadow: !dark 
        ? `-4px 0 30px rgba(255, 150, 200, 0.25)` 
        : `-4px 0 30px rgba(0,0,0,0.7)`,
      animation: "slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "28px 32px", borderBottom: `2px solid ${theme.border}`,
          display: "flex", alignItems: "center", gap: 14,
          background: !dark ? `linear-gradient(135deg, ${c.bg}30, ${c.bg}10)` : `linear-gradient(135deg, ${c.bg}40, transparent)`,
        }}>
          <button onClick={onClose} style={{
            width: 52, height: 52, borderRadius: 14,
            border: `2px solid ${theme.border}`,
            background: theme.inputBg, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <Icons.back style={{ width: 26, height: 26 }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              display: "inline-block",
              padding: "8px 18px", borderRadius: 24,
              fontSize: 15, fontWeight: 800,
              background: c.bg, color: c.text,
              border: `2px solid ${c.border}`,
              boxShadow: `0 2px 8px ${c.border}40`,
            }}>{card.category}</div>
          </div>
          <button onClick={() => editMode ? saveEdit() : setEditMode(true)} style={{
            width: 52, height: 52, borderRadius: 14,
            border: `2px solid ${theme.border}`,
            background: editMode ? theme.success : theme.inputBg, 
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {editMode ? <Icons.check style={{ width: 24, height: 24, color: "white" }} /> : <Icons.edit style={{ width: 24, height: 24 }} />}
          </button>
          <button onClick={() => { if(confirm("Delete this story?")) onDelete(card.id); }} style={{
            width: 52, height: 52, borderRadius: 14,
            border: `2px solid ${theme.error}40`,
            background: theme.inputBg, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: theme.error,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.borderColor = theme.error; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = `${theme.error}40`; }}
          >
            <Icons.trash style={{ width: 24, height: 24 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {card.photo && (
            <div style={{
              height: 300,
              backgroundImage: `url(${card.photo})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderBottom: `3px solid ${theme.border}`,
            }} />
          )}

          <div style={{ padding: 32 }}>
            {editMode ? (
              <input
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: 36, fontWeight: 700,
                  lineHeight: 1.2, marginBottom: 20,
                  letterSpacing: "-0.03em",
                  color: theme.fg,
                  background: theme.inputBg,
                  border: `2px solid ${theme.border}`,
                  borderRadius: 12,
                  padding: "12px 16px",
                  width: "100%",
                  outline: "none",
                }}
              />
            ) : (
              <h2 style={{
                fontFamily: "'Crimson Pro', serif",
                fontSize: 36, fontWeight: 700,
                lineHeight: 1.2, marginBottom: 20,
                letterSpacing: "-0.03em",
                color: theme.fg,
              }}>{card.title}</h2>
            )}

            <div style={{
              display: "flex", alignItems: "center", gap: 20,
              marginBottom: 28, paddingBottom: 28,
              borderBottom: `2px dashed ${theme.border}`,
              fontSize: 15, color: theme.mutedFg, fontWeight: 600,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icons.clock style={{ width: 20, height: 20 }} />
                {fmtDate(card.createdAt)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icons.locate style={{ width: 20, height: 20 }} />
                {card.address || `${card.lat.toFixed(4)}, ${card.lng.toFixed(4)}`}
              </div>
            </div>

            {editMode ? (
              <textarea
                value={editedText}
                onChange={e => setEditedText(e.target.value)}
                style={{
                  fontSize: 16, lineHeight: 1.9,
                  color: theme.fg,
                  letterSpacing: "0.01em",
                  background: theme.inputBg,
                  border: `2px solid ${theme.border}`,
                  borderRadius: 12,
                  padding: "16px",
                  width: "100%",
                  minHeight: 200,
                  outline: "none",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            ) : (
              <p style={{
                fontSize: 17, lineHeight: 1.9,
                color: theme.fg, whiteSpace: "pre-wrap",
                letterSpacing: "0.01em",
              }}>{card.text}</p>
            )}

            {/* Audio Recording Section */}
            <div style={{
              marginTop: 32, paddingTop: 28,
              borderTop: `2px dashed ${theme.border}`,
            }}>
              <h3 style={{
                fontSize: 20, fontWeight: 800,
                marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <Icons.mic style={{ width: 24, height: 24 }} />
                Voice Note
              </h3>
              
              {audioURL && (
                <audio controls src={audioURL} style={{
                  width: "100%",
                  marginBottom: 12,
                  borderRadius: 12,
                }} />
              )}
              
              <div style={{ display: "flex", gap: 12 }}>
                {!isRecording ? (
                  <button onClick={startRecording} style={{
                    flex: 1,
                    padding: "16px 24px",
                    borderRadius: 14,
                    border: `2px solid ${theme.border}`,
                    background: theme.primary,
                    color: theme.primaryFg,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    fontWeight: 700,
                    fontSize: 16,
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <Icons.mic style={{ width: 22, height: 22 }} />
                    Record Audio
                  </button>
                ) : (
                  <button onClick={stopRecording} style={{
                    flex: 1,
                    padding: "16px 24px",
                    borderRadius: 14,
                    border: `2px solid ${theme.error}`,
                    background: theme.error,
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    fontWeight: 700,
                    fontSize: 16,
                    fontFamily: "inherit",
                    animation: "pulse 1.5s infinite",
                  }}>
                    <span style={{ fontSize: 22 }}>⏹</span>
                    Stop Recording
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ theme, dark, online }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => { const t = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })), 15000); return () => clearInterval(t); }, []);

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 40px", fontSize: 12, fontWeight: 600, color: theme.mutedFg,
      background: dark ? "rgba(25,22,18,0.95)" : "rgba(243,238,223,0.95)",
      backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40,
      borderBottom: `1px solid ${theme.border}`,
    }}>
      <span>{time}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {online ? <Icons.wifi style={{ width: 14, height: 14 }} /> : <Icons.wifiOff style={{ width: 14, height: 14 }} />}
        <span style={{ fontSize: 11, letterSpacing: "0.5px" }}>{online ? "ONLINE" : "OFFLINE"}</span>
      </div>
    </div>
  );
}

function TopBar({ theme, dark, setDark }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "20px 40px", borderBottom: `1.5px solid ${theme.border}`,
      background: dark ? "rgba(30,27,22,0.95)" : "rgba(250,247,240,0.95)",
      backdropFilter: "blur(12px)", position: "sticky", top: 35, zIndex: 40,
    }}>
      <h1 style={{
        fontFamily: "'Crimson Pro', serif", fontSize: 28, fontWeight: 700,
        letterSpacing: "-0.03em", margin: 0, display: "flex", alignItems: "center", gap: 12,
      }}>
        <Icons.map style={{ width: 28, height: 28, color: theme.amber }} />
        EchoMap Pins
      </h1>
      <button onClick={() => setDark(!dark)} style={{
        width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${theme.border}`,
        background: theme.card, cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: 16,
        transition: "all 0.25s cubic-bezier(0.68,-0.25,0.265,1.25)",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "rotate(180deg)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "rotate(0)"; }}
      >
        {dark ? <span style={{ fontSize: 18 }}>☀</span> : <span style={{ fontSize: 18 }}>☾</span>}
      </button>
    </div>
  );
}

function MapView({ theme, dark, cards, onCardClick }) {
  const canvasRef = useRef(null);
  const [userLoc, setUserLoc] = useState(null);
  const [locLoading, setLocLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 55.8642, lng: -4.2518 });
  const mapBounds = { latMin: 55.81, latMax: 55.92, lngMin: -4.35, lngMax: -4.18 };
  const maxWidth = 1200;

  const getLocation = () => {
    setLocLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
        () => { setUserLoc({ lat: 55.8642, lng: -4.2518 }); setLocLoading(false); },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserLoc({ lat: 55.8642, lng: -4.2518 });
      setLocLoading(false);
    }
  };

  useEffect(() => { getLocation(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = 440, h = 340;
    canvas.width = w; canvas.height = h;

    ctx.fillStyle = dark ? "#1E1B16" : "#FFF7E6";
    ctx.fillRect(0, 0, w, h);

    const toPixel = (lat, lng) => {
      const x = ((lng - mapBounds.lngMin) / (mapBounds.lngMax - mapBounds.lngMin)) * w;
      const y = h - ((lat - mapBounds.latMin) / (mapBounds.latMax - mapBounds.latMin)) * h;
      return { x, y };
    };

    ctx.strokeStyle = dark ? "#3A362D" : "#E9E3CE";
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 8; i++) {
      const y = (i / 8) * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      const x = (i / 8) * w;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    cards.forEach(card => {
      const { x, y } = toPixel(card.lat, card.lng);
      if (x < 0 || x > w || y < 0 || y > h) return;

      const colorKey = card.color || "amber";
      const c = colorMap[colorKey]?.[dark ? "dark" : "light"] || colorMap.amber[dark ? "dark" : "light"];

      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = c.bg;
      ctx.beginPath();
      ctx.moveTo(x, y - 20); ctx.lineTo(x - 7, y - 8); ctx.lineTo(x + 7, y - 8);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y - 8, 8, 0, Math.PI * 2);
      ctx.fillStyle = c.text;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    if (userLoc) {
      const { x, y } = toPixel(userLoc.lat, userLoc.lng);
      if (x >= 0 && x <= w && y >= 0 && y <= h) {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = dark ? "rgba(224,122,95,0.2)" : "rgba(224,122,95,0.15)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#E07A5F";
        ctx.fill();
        ctx.strokeStyle = "#FFF7E6";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [cards, userLoc, dark, mapCenter]);

  return (
    <div style={{ padding: "24px 40px", maxWidth: maxWidth, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
      <div style={{
        position: "relative", borderRadius: 16, overflow: "hidden",
        border: `2px solid ${theme.border}`, background: theme.card,
        boxShadow: `0 4px 16px ${theme.shadow}`, marginBottom: 16,
      }}>
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "auto" }} />
        {locLoading && (
          <div style={{
            position: "absolute", inset: 0, background: `${theme.bg}aa`, backdropFilter: "blur(4px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${theme.muted}`, borderTopColor: theme.amber, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}/>
            <p style={{ fontSize: 13, fontWeight: 600, color: theme.mutedFg }}>Finding your location...</p>
          </div>
        )}
        <button onClick={getLocation} style={{
          position: "absolute", bottom: 12, right: 12, width: 40, height: 40,
          borderRadius: 12, border: `2px solid ${theme.border}`,
          background: theme.card, cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", color: theme.amber,
          boxShadow: `0 2px 8px ${theme.shadow}`,
        }}>
          <Icons.locate style={{ width: 18, height: 18 }} />
        </button>
        <div style={{
          position: "absolute", bottom: 12, left: 12, padding: "6px 12px",
          borderRadius: 10, background: `${theme.card}dd`, backdropFilter: "blur(8px)",
          border: `1px solid ${theme.border}`, fontSize: 10, fontWeight: 600, color: theme.mutedFg,
        }}>
          <Icons.locate style={{ width: 10, height: 10, display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
          {userLoc ? `${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)}` : "Location unavailable"}
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderRadius: 14, background: theme.card,
        border: `1.5px solid ${theme.border}`, marginBottom: 14,
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700 }}>{cards.length} Story Cards</p>
          <p style={{ fontSize: 12, color: theme.mutedFg }}>Click card pins on the map to view details</p>
        </div>
        <Icons.explore style={{ width: 32, height: 32, color: theme.amber }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cards.slice(0, 3).map((card, i) => <MiniCard key={card.id} card={card} theme={theme} dark={dark} onClick={() => onCardClick(card)} delay={i * 0.1} />)}
        {cards.length > 3 && (
          <p style={{ textAlign: "center", fontSize: 12, color: theme.mutedFg, marginTop: 4 }}>
            + {cards.length - 3} more story cards
          </p>
        )}
      </div>
    </div>
  );
}

function MiniCard({ card, theme, dark, onClick, delay = 0 }) {
  const c = colorMap[card.color]?.[dark ? "dark" : "light"] || colorMap.amber[dark ? "dark" : "light"];
  const catIcon = CATEGORIES.find(ct => ct.value === card.category)?.icon || "PIN";

  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
      borderRadius: 14, background: theme.card, border: `1.5px solid ${theme.border}`,
      cursor: "pointer", textAlign: "left", width: "100%",
      animation: `fadeIn 0.3s ease ${delay}s both`,
      transition: "all 0.2s ease",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = theme.muted; }}
    onMouseLeave={e => { e.currentTarget.style.background = theme.card; }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: card.photo ? `url(${card.photo}) center/cover` : `linear-gradient(135deg, ${c.bg}, ${c.bg}dd)`,
        border: `1.5px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!card.photo && (CATEGORIES.find(ct => ct.value === card.category)?.icon || "\u25C8")}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontSize: 14, fontWeight: 700, marginBottom: 2, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>{card.title}</h4>
        <p style={{ fontSize: 11, color: theme.mutedFg }}>
          <Icons.locate style={{ width: 10, height: 10, display: "inline", verticalAlign: "-1px", marginRight: 3 }} />
          {card.category} \u00B7 {fmtDate(card.createdAt)}
        </p>
      </div>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: c.bg, border: `1.5px solid ${c.border}`, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: c.text, fontWeight: 700,
      }}>→</div>
    </button>
  );
}

function ExploreView({ theme, dark, cards, allCards, onCardClick, searchQuery, setSearchQuery, filterCategory, setFilterCategory }) {
  const maxWidth = 1200;
  return (
    <div style={{ padding: "24px 40px", maxWidth: maxWidth, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
      <div style={{ padding: "12px 20px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
          borderRadius: 99, background: theme.inputBg, border: `1.5px solid ${theme.border}`,
          transition: "border-color 0.2s",
        }}>
          <Icons.search style={{ width: 16, height: 16, color: theme.mutedFg, flexShrink: 0 }} />
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search story cards..."
            style={{
              border: "none", background: "none", outline: "none", width: "100%",
              fontSize: 14, color: theme.fg, fontFamily: "inherit",
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{
              border: "none", background: "none", cursor: "pointer", padding: 0, color: theme.mutedFg,
            }}>
              <Icons.x style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: "flex", gap: 10, marginBottom: "24px", overflowX: "auto",
        scrollbarWidth: "none", msOverflowStyle: "none", flexWrap: "wrap",
      }}>
        {CATEGORIES.map(cat => {
          const active = filterCategory === cat.value;
          return (
            <button key={cat.value} onClick={() => setFilterCategory(cat.value)} style={{
              padding: "6px 14px", borderRadius: 99, whiteSpace: "nowrap",
              fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer",
              fontFamily: "inherit",
              background: active ? theme.primary : "transparent",
              color: active ? theme.primaryFg : theme.fg,
              border: `1.5px solid ${active ? theme.primary : theme.border}`,
              transition: "all 0.25s cubic-bezier(0.68,-0.25,0.265,1.25)",
              transform: active ? "scale(1.05)" : "scale(1)",
            }}>
              {cat.icon} {cat.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {cards.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 20px",
            color: theme.mutedFg, animation: "fadeIn 0.4s ease",
          }}>
            <Icons.explore style={{ width: 48, height: 48, opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>No story cards</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Tap + to create your first story card</p>
          </div>
        ) : (
          cards.map((card, i) => (
            <StoryCard key={card.id} card={card} theme={theme} dark={dark} onClick={() => onCardClick(card)} delay={i * 0.06} />
          ))
        )}
      </div>
    </div>
  );
}

function StoryCard({ card, theme, dark, onClick, delay = 0 }) {
  const c = colorMap[card.color]?.[dark ? "dark" : "light"] || colorMap.amber[dark ? "dark" : "light"];
  const catIcon = CATEGORIES.find(ct => ct.value === card.category)?.icon || "PIN";

  return (
    <button onClick={onClick} style={{
      background: theme.card, borderRadius: 16, overflow: "hidden",
      border: `2px solid ${theme.border}`, cursor: "pointer",
      textAlign: "left", width: "100%",
      boxShadow: `0 2px 12px ${theme.shadow}`,
      animation: `fadeIn 0.4s ease ${delay}s both`,
      transition: "all 0.25s ease",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${theme.shadow}`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 2px 12px ${theme.shadow}`; }}
    >
      {card.photo ? (
        <div style={{
          height: 160, backgroundImage: `url(${card.photo})`,
          backgroundSize: "cover", backgroundPosition: "center",
          borderBottom: `1.5px solid ${theme.border}`,
        }}/>
      ) : (
        <div style={{
          height: 80, background: `linear-gradient(135deg, ${c.bg}, ${c.bg}dd)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderBottom: `1.5px solid ${c.border}`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.08,
            backgroundImage: `radial-gradient(${c.border} 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}/>
          <span style={{ fontSize: 28, position: "relative" }}>{catIcon}</span>
        </div>
      )}

      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{
            padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700,
            background: c.bg, color: c.text, border: `1px solid ${c.border}`,
            letterSpacing: "0.03em",
          }}>{catIcon} {card.category}</span>
          <span style={{ fontSize: 10, color: theme.mutedFg, fontWeight: 500 }}>
            {fmtDate(card.createdAt)}
          </span>
        </div>

        <h4 style={{
          fontFamily: "'Crimson Pro', serif", fontSize: 18, fontWeight: 700,
          lineHeight: 1.3, marginBottom: 6, letterSpacing: "-0.01em",
        }}>{card.title}</h4>

        <p style={{
          fontSize: 13, color: theme.mutedFg, lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>{card.text}</p>

        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginTop: 10,
          fontSize: 11, color: theme.mutedFg, fontWeight: 500,
        }}>
          <Icons.pin style={{ width: 12, height: 12, color: theme.amber }} />
          <span>{card.address || `${card.lat?.toFixed(3)}, ${card.lng?.toFixed(3)}`}</span>
        </div>
      </div>
    </button>
  );
}

function CreateView({ theme, dark, onCreate, onBack }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Daily");
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [step, setStep] = useState(1);
  const fileRef = useRef(null);

  const getLocation = () => {
    setLocLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      () => { setLocation({ lat: 55.8462, lng: -4.4237 }); setLocLoading(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(), text: text.trim(), category, photo,
      lat: location?.lat || 55.8462, lng: location?.lng || -4.4237,
      address: location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Manual location",
    });
  };

  useEffect(() => { getLocation(); }, []);

  return (
    <div style={{ animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "16px 20px",
        borderBottom: `1.5px solid ${theme.border}`,
        background: dark ? "rgba(30,27,22,0.95)" : "rgba(243,238,223,0.95)",
        backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 30,
      }}>
        <button onClick={onBack} style={{
          width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${theme.border}`,
          background: "transparent", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", color: theme.fg,
        }}>
          <Icons.back style={{ width: 24, height: 24 }} />
        </button>
        <h2 style={{
          fontFamily: "'Crimson Pro', serif", fontSize: 24, fontWeight: 800, flex: 1,
        }}>Create Story Card</h2>
        <div style={{ display: "flex", gap: 4 }}>
          {[1,2,3].map(s => (
            <div key={s} style={{
              width: 10, height: 10, borderRadius: 99,
              background: step >= s ? theme.amber : theme.muted,
              transition: "background 0.3s",
            }}/>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {step === 1 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                height: 200, borderRadius: 16, border: `2px dashed ${theme.border}`,
                background: photo ? `url(${photo}) center/cover` : (dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", gap: 8, position: "relative", overflow: "hidden",
                transition: "all 0.3s ease",
              }}
            >
              {!photo && (
                <>
                  <div style={{
                    width: 64, height: 64, borderRadius: 18, background: theme.muted,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icons.camera style={{ width: 32, height: 32, color: theme.mutedFg }} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: theme.mutedFg }}>Tap to take photo or select image</p>
                  <p style={{ fontSize: 13, color: theme.mutedFg, opacity: 0.7 }}>Supports Camera API for live capture</p>
                </>
              )}
              {photo && (
                <button onClick={(e) => { e.stopPropagation(); setPhoto(null); }} style={{
                  position: "absolute", top: 10, right: 10, width: 40, height: 40,
                  borderRadius: 12, background: "rgba(0,0,0,0.5)", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white",
                }}>
                  <Icons.x style={{ width: 20, height: 20 }} />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto}
              style={{ display: "none" }} />

            <div style={{
              marginTop: 16, padding: "16px 18px", borderRadius: 16,
              background: theme.card, border: `1.5px solid ${theme.border}`,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: location ? colorMap.sage[dark?"dark":"light"].bg : theme.muted,
                border: `1.5px solid ${location ? colorMap.sage[dark?"dark":"light"].border : theme.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {locLoading ? (
                  <div style={{ width: 20, height: 20, border: `2px solid ${theme.muted}`, borderTopColor: theme.amber, borderRadius: "50%", animation: "spin 0.6s linear infinite" }}/>
                ) : (
                  <Icons.pin style={{ width: 22, height: 22, color: location ? theme.sage : theme.mutedFg }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700 }}>
                  {location ? "Location acquired" : locLoading ? "Getting location..." : "Waiting for location"}
                </p>
                <p style={{ fontSize: 13, color: theme.mutedFg }}>
                  {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Using Geolocation API"}
                </p>
              </div>
              <button onClick={getLocation} style={{
                padding: "8px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: theme.primary, color: theme.primaryFg,
                border: "none", cursor: "pointer", fontFamily: "inherit",
              }}>Refresh</button>
            </div>

            <button onClick={() => setStep(2)} style={{
              marginTop: 20, width: "100%", padding: "14px", borderRadius: 14,
              background: theme.primary, color: theme.primaryFg,
              border: `2px solid ${theme.borderHeavy}`,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: `0 4px 12px ${theme.shadow}`,
              transition: "all 0.25s cubic-bezier(0.68,-0.25,0.265,1.25)",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >Next \u2192</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <label style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, display: "block", color: theme.mutedFg }}>
              Story Title *
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Give this place a name..."
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 14,
                background: theme.inputBg, border: `1.5px solid ${theme.border}`,
                fontSize: 18, fontWeight: 700, color: theme.fg, outline: "none",
                fontFamily: "'Crimson Pro', serif",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = theme.amber}
              onBlur={e => e.target.style.borderColor = theme.border}
            />

            <label style={{ fontSize: 15, fontWeight: 700, marginTop: 18, marginBottom: 8, display: "block", color: theme.mutedFg }}>
              Your Story
            </label>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Share some stories, secrets, or tips about this place..."
              rows={5}
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 14,
                background: theme.inputBg, border: `1.5px solid ${theme.border}`,
                fontSize: 16, color: theme.fg, outline: "none", resize: "vertical",
                fontFamily: "inherit", lineHeight: 1.6,
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = theme.amber}
              onBlur={e => e.target.style.borderColor = theme.border}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: "13px", borderRadius: 14, fontSize: 14, fontWeight: 600,
                background: "transparent", color: theme.fg, border: `1.5px solid ${theme.border}`,
                cursor: "pointer", fontFamily: "inherit",
              }}>\u2190 Back</button>
              <button onClick={() => title.trim() && setStep(3)} style={{
                flex: 1, padding: "13px", borderRadius: 14, fontSize: 14, fontWeight: 700,
                background: title.trim() ? theme.primary : theme.muted,
                color: title.trim() ? theme.primaryFg : theme.mutedFg,
                border: "none", cursor: title.trim() ? "pointer" : "default",
                fontFamily: "inherit",
              }}>Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "block", color: theme.mutedFg }}>
              Choose Category
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {CATEGORIES.filter(c => c.value !== "all").map(cat => {
                const active = category === cat.value;
                return (
                  <button key={cat.value} onClick={() => setCategory(cat.value)} style={{
                    padding: "14px 10px", borderRadius: 14, textAlign: "center",
                    background: active ? theme.primary : theme.card,
                    color: active ? theme.primaryFg : theme.fg,
                    border: `2px solid ${active ? theme.primary : theme.border}`,
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.25s cubic-bezier(0.68,-0.25,0.265,1.25)",
                    transform: active ? "scale(1.03)" : "scale(1)",
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{cat.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: active ? 700 : 500 }}>{cat.label}</div>
                  </button>
                );
              })}
            </div>

            <div style={{
              padding: 16, borderRadius: 14, background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              border: `1px dashed ${theme.border}`, marginBottom: 16,
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: theme.mutedFg, marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>Preview</p>
              <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: 17, fontWeight: 700 }}>{title}</p>
              {text && <p style={{ fontSize: 13, color: theme.mutedFg, marginTop: 4, lineHeight: 1.5 }}>{text.slice(0, 80)}{text.length > 80 ? "..." : ""}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 11, color: theme.mutedFg }}>
                <span>{CATEGORIES.find(c => c.value === category)?.icon} {category}</span>
                <span>·</span>
                <span>{photo ? "With photo" : "No photo"}</span>
                <span>·</span>
                <span>{location ? "Located" : "Not located"}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(2)} style={{
                flex: 1, padding: "16px", borderRadius: 16, fontSize: 16, fontWeight: 700,
                background: "transparent", color: theme.fg, border: `1.5px solid ${theme.border}`,
                cursor: "pointer", fontFamily: "inherit",
              }}>\u2190 Back</button>
              <button onClick={handleSubmit} style={{
                flex: 2, padding: "16px", borderRadius: 16, fontSize: 17, fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.amber}, ${theme.rust || theme.amber})`,
                color: "#fff", border: `2px solid ${theme.borderHeavy}`,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: `0 4px 16px ${theme.shadow}`,
                transition: "all 0.25s cubic-bezier(0.68,-0.25,0.265,1.25)",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px) scale(1.01)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0) scale(1)"}
              >\u2726 Publish Story</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailView({ theme, dark, card, onBack, onDelete, onUpdate }) {
  const maxWidth = 900;
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editText, setEditText] = useState(card.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const c = colorMap[card.color]?.[dark ? "dark" : "light"] || colorMap.amber[dark ? "dark" : "light"];
  const catIcon = CATEGORIES.find(ct => ct.value === card.category)?.icon || "PIN";

  const handleSave = () => {
    onUpdate(card.id, { title: editTitle, text: editText });
    setEditing(false);
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: maxWidth, margin: "0 auto" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "14px 20px",
        borderBottom: `1.5px solid ${theme.border}`,
        background: dark ? "rgba(30,27,22,0.95)" : "rgba(243,238,223,0.95)",
        backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 30,
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${theme.border}`,
          background: "transparent", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", color: theme.fg,
        }}>
          <Icons.back style={{ width: 18, height: 18 }} />
        </button>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Story Details</span>
        <button onClick={() => setEditing(!editing)} style={{
          width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${theme.border}`,
          background: editing ? theme.amber : "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: editing ? "#fff" : theme.fg, transition: "all 0.2s",
        }}>
          <Icons.edit style={{ width: 16, height: 16 }} />
        </button>
        <button onClick={() => setShowDeleteConfirm(true)} style={{
          width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${theme.error}44`,
          background: "transparent", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", color: theme.error,
        }}>
          <Icons.trash style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {card.photo ? (
        <div style={{
          height: 240, backgroundImage: `url(${card.photo})`,
          backgroundSize: "cover", backgroundPosition: "center",
          borderBottom: `2px solid ${theme.border}`,
        }}/>
      ) : (
        <div style={{
          height: 140, background: `linear-gradient(135deg, ${c.bg}, ${c.bg}bb)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderBottom: `2px solid ${c.border}`, position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.06,
            backgroundImage: `radial-gradient(${c.border} 1.5px, transparent 1.5px)`,
            backgroundSize: "20px 20px",
          }}/>
          <span style={{ fontSize: 52, position: "relative" }}>{catIcon}</span>
        </div>
      )}

      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{
            padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: c.bg, color: c.text, border: `1.5px solid ${c.border}`,
          }}>{catIcon} {card.category}</span>
          <span style={{ fontSize: 11, color: theme.mutedFg }}>
            <Icons.clock style={{ width: 10, height: 10, display: "inline", verticalAlign: "-1px", marginRight: 3 }} />
            {fmtDate(card.createdAt)}
          </span>
        </div>

        {editing ? (
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
            style={{
              width: "100%", padding: "8px 0", fontSize: 24, fontWeight: 700,
              fontFamily: "'Crimson Pro', serif", border: "none", borderBottom: `2px solid ${theme.amber}`,
              background: "transparent", color: theme.fg, outline: "none", marginBottom: 12,
            }} />
        ) : (
          <h2 style={{
            fontFamily: "'Crimson Pro', serif", fontSize: 24, fontWeight: 700,
            lineHeight: 1.3, marginBottom: 12, letterSpacing: "-0.02em",
          }}>{card.title}</h2>
        )}

        {editing ? (
          <textarea value={editText} onChange={e => setEditText(e.target.value)}
            rows={6}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 12,
              background: theme.inputBg, border: `1.5px solid ${theme.amber}`,
              fontSize: 14, color: theme.fg, outline: "none", resize: "vertical",
              fontFamily: "inherit", lineHeight: 1.7,
            }} />
        ) : (
          <p style={{ fontSize: 15, lineHeight: 1.8, color: theme.fg, opacity: 0.9 }}>
            {card.text || "No description"}
          </p>
        )}

        <div style={{
          marginTop: 20, padding: "14px 16px", borderRadius: 14,
          background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          border: `1.5px solid ${theme.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: colorMap.sage[dark?"dark":"light"].bg,
            border: `1.5px solid ${colorMap.sage[dark?"dark":"light"].border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icons.pin style={{ width: 18, height: 18, color: theme.sage }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{card.address || "Location recorded"}</p>
            <p style={{ fontSize: 11, color: theme.mutedFg }}>{card.lat?.toFixed(5)}, {card.lng?.toFixed(5)}</p>
          </div>
        </div>

        {editing && (
          <button onClick={handleSave} style={{
            marginTop: 16, width: "100%", padding: "14px", borderRadius: 14,
            background: theme.amber, color: "#fff", border: "none",
            fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            <Icons.check style={{ width: 16, height: 16, display: "inline", verticalAlign: "-3px", marginRight: 6 }} />
            Save Changes
          </button>
        )}

        {!editing && (
          <button style={{
            marginTop: 16, width: "100%", padding: "13px", borderRadius: 14,
            background: "transparent", color: theme.fg,
            border: `1.5px solid ${theme.border}`,
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <Icons.share style={{ width: 16, height: 16 }} />
            Share Story Card
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: 20, backdropFilter: "blur(4px)",
          animation: "fadeIn 0.2s ease",
        }} onClick={() => setShowDeleteConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: theme.card, borderRadius: 20, padding: "24px",
            border: `2px solid ${theme.border}`, maxWidth: 320, width: "100%",
            boxShadow: `0 20px 60px ${theme.shadow}`,
            animation: "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: `${theme.error}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Icons.trash style={{ width: 24, height: 24, color: theme.error }} />
            </div>
            <h3 style={{ textAlign: "center", fontSize: 18, fontWeight: 700, fontFamily: "'Crimson Pro', serif", marginBottom: 8 }}>
              Confirm Delete?
            </h3>
            <p style={{ textAlign: "center", fontSize: 13, color: theme.mutedFg, marginBottom: 20, lineHeight: 1.5 }}>
              This story card cannot be recovered after deletion
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{
                flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                background: "transparent", color: theme.fg, border: `1.5px solid ${theme.border}`,
                cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button onClick={() => onDelete(card.id)} style={{
                flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: theme.error, color: "#fff", border: "none",
                cursor: "pointer", fontFamily: "inherit",
              }}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileView({ theme, dark, cards, setDark }) {
  const maxWidth = 800;
  const totalCards = cards.length;
  const withPhotos = cards.filter(c => c.photo).length;
  const categories = [...new Set(cards.map(c => c.category))];

  return (
    <div style={{ padding: "40px", maxWidth: maxWidth, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: "0 auto 14px",
          background: `linear-gradient(135deg, ${theme.amber}, ${theme.rust || theme.amber})`,
          border: `3px solid ${theme.card}`, boxShadow: `0 4px 16px ${theme.shadow}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "scaleIn 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <span style={{ fontSize: 30, color: "white" }}>\u25C8</span>
        </div>
        <h2 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 22, fontWeight: 700 }}>Story Collector</h2>
        <p style={{ fontSize: 13, color: theme.mutedFg, marginTop: 4 }}>Discover hidden stories in the city</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Cards", value: totalCards, icon: Icons.explore },
          { label: "With Photos", value: withPhotos, icon: Icons.camera },
          { label: "Categories", value: categories.length, icon: Icons.pin },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: "16px 10px", borderRadius: 14, textAlign: "center",
            background: theme.card, border: `1.5px solid ${theme.border}`,
            animation: `fadeIn 0.3s ease ${i * 0.1}s both`,
          }}>
            <stat.icon style={{ width: 24, height: 24, marginBottom: 6, color: theme.amber }} />
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Crimson Pro', serif" }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: theme.mutedFg, fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {[
        { icon: Icons.user, label: "Dark Mode", desc: dark ? "Currently: On" : "Currently: Off", action: () => setDark(!dark) },
        { icon: Icons.locate, label: "Location Service", desc: "Geolocation API", action: null },
        { icon: Icons.camera, label: "Camera Permission", desc: "Camera API", action: null },
        { icon: Icons.pin, label: "Local Storage", desc: `${totalCards} cards saved`, action: null },
        { icon: Icons.wifi, label: "Offline Mode", desc: "Service Worker Ready", action: null },
      ].map((item, i) => (
        <button key={i} onClick={item.action} style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
          borderRadius: 14, background: theme.card, border: `1.5px solid ${theme.border}`,
          cursor: item.action ? "pointer" : "default", width: "100%", textAlign: "left",
          marginBottom: 10, animation: `fadeIn 0.3s ease ${0.3 + i * 0.06}s both`,
          transition: "all 0.2s ease",
        }}>
          <item.icon style={{ width: 22, height: 22, color: theme.amber, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</p>
            <p style={{ fontSize: 11, color: theme.mutedFg }}>{item.desc}</p>
          </div>
          {item.action && <span style={{ color: theme.mutedFg, fontSize: 14 }}>→</span>}
        </button>
      ))}

      <div style={{
        marginTop: 20, padding: 16, borderRadius: 14, textAlign: "center",
        background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
        border: `1px dashed ${theme.border}`,
      }}>
        <p style={{ fontSize: 12, color: theme.mutedFg, lineHeight: 1.6 }}>
          EchoMap Pins v1.0<br/>
          Offline Place Story Cards · PWA<br/>
          <span style={{ fontWeight: 600 }}>React + Vite</span>
        </p>
      </div>
    </div>
  );
}

function FAB({ theme, onClick }) {
  return (
    <button onClick={onClick} style={{
      position: "fixed", bottom: 92, right: "max(calc(50% - 220px), 20px)",
      width: 56, height: 56, borderRadius: 18,
      background: `linear-gradient(135deg, ${theme.amber}, ${theme.rust || theme.amber})`,
      border: `2.5px solid ${theme.borderHeavy}`,
      boxShadow: `0 6px 24px rgba(196,145,46,0.35)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", zIndex: 35, color: "white",
      animation: "fabIn 0.5s cubic-bezier(0.68,-0.25,0.265,1.25) 0.3s both",
      transition: "all 0.25s cubic-bezier(0.68,-0.25,0.265,1.25)",
    }}
    on MouseEnter={e => { e.currentTarget.style.transform = "scale(1.1) rotate(90deg)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1) rotate(0)"; }}
    >
      <Icons.plus style={{ width: 26, height: 26 }} />
    </button>
  );
}

function BottomNav({ theme, dark, active, onChange }) {
  const tabs = [
    { id: "map", icon: Icons.map, label: "Map" },
    { id: "explore", icon: Icons.explore, label: "Explore" },
    { id: "profile", icon: Icons.user, label: "Profile" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      width: "100%",
      background: dark ? "rgba(30,27,22,0.95)" : "rgba(250,247,240,0.95)",
      backdropFilter: "blur(16px) saturate(1.8)",
      borderTop: `1.5px solid ${theme.border}`,
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
      zIndex: 40,
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "6px 20px", borderRadius: 14,
            background: isActive ? (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)") : "transparent",
            border: "none", cursor: "pointer",
            color: isActive ? theme.amber : theme.mutedFg,
            transition: "all 0.25s cubic-bezier(0.68,-0.25,0.265,1.25)",
            transform: isActive ? "scale(1.05)" : "scale(1)",
          }}>
            <Icon style={{ width: 22, height: 22, transition: "all 0.2s" }} />
            <span style={{
              fontSize: 10, fontWeight: isActive ? 700 : 500,
              letterSpacing: "0.02em",
            }}>{tab.label}</span>
            {isActive && (
              <div style={{
                width: 4, height: 4, borderRadius: 99, background: theme.amber,
                marginTop: -1,
              }}/>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Toast({ theme, dark, msg, type }) {
  const colors = {
    success: { bg: dark ? "#1a3020" : "#e8f5e8", border: theme.success, icon: "OK" },
    error: { bg: dark ? "#351a1a" : "#fdeae5", border: theme.error, icon: "ERR" },
    warning: { bg: dark ? "#3a3020" : "#fff4d9", border: theme.warning, icon: "WARN" },
    info: { bg: dark ? "#1a2535" : "#e3f0ff", border: theme.info, icon: "INFO" },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{
      position: "fixed", top: 48, left: "50%", transform: "translateX(-50%)",
      zIndex: 200, maxWidth: 440, width: "calc(100% - 40px)",
      animation: "toastIn 0.35s cubic-bezier(0.16,1,0.3,1)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
        borderRadius: 14, background: c.bg, border: `1.5px solid ${c.border}`,
        boxShadow: `0 8px 32px ${theme.shadow}`,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: c.border,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 800, color: "white", flexShrink: 0,
          letterSpacing: "0.5px",
        }}>{c.icon}</div>
        <p style={{ fontSize: 13, fontWeight: 600, color: theme.fg }}>{msg}</p>
      </div>
    </div>
  );
}

function OfflineBanner({ theme }) {
  return (
    <div style={{
      position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)",
      zIndex: 100, maxWidth: 440, width: "calc(100% - 40px)",
      animation: "toastIn 0.3s ease",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
        borderRadius: 12, background: "rgba(60,50,35,0.95)", color: "#F3EEDF",
        backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <Icons.wifiOff style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.7 }} />
        <p style={{ fontSize: 12, fontWeight: 600 }}>Offline Mode · Saved story cards still viewable</p>
      </div>
    </div>
  );
}
