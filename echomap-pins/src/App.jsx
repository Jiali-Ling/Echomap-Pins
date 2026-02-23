import { useState, useEffect, useRef, useCallback } from "react";

function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = window.__memoryStore?.[key];
      return stored !== undefined ? stored : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => {
    if (!window.__memoryStore) window.__memoryStore = {};
    window.__memoryStore[key] = state;
  }, [key, state]);
  return [state, setState];
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const fmtDate = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff/60000)}min ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}hr ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const DEMO_CARDS = [
  {
    id: "demo1", title: "The Cat at Old Street", text: "Every afternoon at 3 PM, this orange cat appears in this corner to sunbathe. It seems to have become the guardian of this street.",
    lat: 55.8462, lng: -4.4237, address: "Paisley High Street", category: "Daily",
    photo: null, createdAt: Date.now() - 86400000 * 2, color: "amber"
  },
  {
    id: "demo2", title: "Hidden Graffiti Wall", text: "There's a colorful graffiti wall around the corner depicting the city's history. Few people notice it.",
    lat: 55.8453, lng: -4.4251, address: "Cotton Street", category: "Art",
    photo: null, createdAt: Date.now() - 86400000 * 5, color: "rust"
  },
  {
    id: "demo3", title: "Best Viewpoint", text: "Standing here, you can see the magnificent view of the entire valley. It's especially beautiful at sunset when the sky turns golden and purple.",
    lat: 55.8478, lng: -4.4212, address: "Oakshaw Hill", category: "Scenery",
    photo: null, createdAt: Date.now() - 86400000, color: "sage"
  },
];

const CATEGORIES = [
  { label: "All", value: "all", icon: "◈" },
  { label: "Daily", value: "Daily", icon: "☀" },
  { label: "Food", value: "Food", icon: "◉" },
  { label: "Art", value: "Art", icon: "✦" },
  { label: "Scenery", value: "Scenery", icon: "△" },
  { label: "Story", value: "Story", icon: "◇" },
  { label: "Other", value: "Other", icon: "○" },
];

const CARD_COLORS = ["amber", "rust", "sage"];

const Icons = {
  map: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><path d="M8 2v16"/><path d="M16 6v16"/></svg>,
  explore: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  plus: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" {...p}><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
  user: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  camera: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  pin: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  back: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>,
  edit: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  sun: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  moon: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  x: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...p}><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>,
  search: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  clock: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  wifi: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>,
  wifiOff: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>,
  share: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98"/><path d="M15.41 6.51l-6.82 3.98"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6L9 17l-5-5"/></svg>,
  image: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
};

const T = {
  light: {
    bg: "#F3EEDF", fg: "#2D2318", card: "#FAF7F0", cardFg: "#2D2318",
    primary: "#3D2E1F", primaryFg: "#FAF7F0",
    amber: "#C4912E", amberDark: "#9E7020", rust: "#8B4023", rustDark: "#6D3019",
    sage: "#6B9B6B", sageDark: "#4F7F4F",
    muted: "#DDD5C2", mutedFg: "#5C4A37",
    border: "#B5A88A", borderHeavy: "#3D2E1F",
    inputBg: "#EDE8D8", success: "#3D9B5F", error: "#C4382A", info: "#3A7BC4",
    warning: "#C4912E", shadow: "rgba(61,46,31,0.12)", parchment50: "#FAF7F0",
    parchment200: "#EDE8D8", parchment300: "#DDD5C2", parchment400: "#C8BD9F",
  },
  dark: {
    bg: "#1E1B16", fg: "#F3EEDF", card: "#28241E", cardFg: "#FAF7F0",
    primary: "#EDE8D8", primaryFg: "#1A1510",
    amber: "#9E7020", amberDark: "#C4912E", rust: "#8B4023", rustDark: "#6D3019",
    sage: "#4F7F4F", sageDark: "#6B9B6B",
    muted: "#38322A", mutedFg: "#9E9585",
    border: "#45403A", borderHeavy: "#C8BD9F",
    inputBg: "#302B24", success: "#56C47A", error: "#C4382A", info: "#56A0E4",
    warning: "#D4A545", shadow: "rgba(0,0,0,0.3)", parchment50: "#FAF7F0",
    parchment200: "#EDE8D8", parchment300: "#DDD5C2", parchment400: "#C8BD9F",
  },
};

const colorMap = {
  amber: { light: { bg: "#FFF4D9", border: "#C4912E", text: "#7A5B15" }, dark: { bg: "#3A3020", border: "#C4912E", text: "#E4C070" } },
  rust: { light: { bg: "#FDEAE5", border: "#8B4023", text: "#5C2A15" }, dark: { bg: "#352420", border: "#8B4023", text: "#D49080" } },
  sage: { light: { bg: "#E8F5E8", border: "#6B9B6B", text: "#3A5F3A" }, dark: { bg: "#1E3020", border: "#6B9B6B", text: "#90C490" } },
};

const keyframesCSS = `
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;0,900;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes bounce { 0% { transform: translateY(0); } 50% { transform: translateY(-6px); } 100% { transform: translateY(0); } }
@keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes ripple { 0% { transform: scale(0); opacity: 0.6; } 100% { transform: scale(4); opacity: 0; } }
@keyframes fabIn { from { opacity: 0; transform: scale(0) rotate(-180deg); } to { opacity: 1; transform: scale(1) rotate(0); } }
@keyframes pinBounce { 0% { transform: translateY(0) scale(1); } 30% { transform: translateY(-8px) scale(1.1); } 50% { transform: translateY(0) scale(0.95); } 70% { transform: translateY(-3px) scale(1.02); } 100% { transform: translateY(0) scale(1); } }
@keyframes toastIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
*::-webkit-scrollbar { width: 4px; }
*::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 99px; }
`;

export default function EchoMapApp() {
  const [dark, setDark] = usePersistedState("echomap-dark", false);
  const [cards, setCards] = usePersistedState("echomap-cards", DEMO_CARDS);
  const [view, setView] = useState("map");
  const [selectedCard, setSelectedCard] = useState(null);
  const [toast, setToast] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const theme = dark ? T.dark : T.light;

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => { setIsOnline(false); showToast("Switched to offline mode", "warning"); };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type, id: uid() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const createCard = (card) => {
    const newCard = { ...card, id: uid(), createdAt: Date.now(), color: CARD_COLORS[Math.floor(Math.random() * 3)] };
    setCards(prev => [newCard, ...prev]);
    showToast("Story card created successfully! ✦");
    setView("explore");
  };

  const updateCard = (id, updates) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    showToast("Story card updated");
  };

  const deleteCard = (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    showToast("Story card deleted", "error");
    setSelectedCard(null);
    setView("explore");
  };

  const openDetail = (card) => { setSelectedCard(card); setView("detail"); };

  const filteredCards = cards.filter(c => {
    const matchCat = filterCategory === "all" || c.category === filterCategory;
    const matchSearch = !searchQuery || c.title.includes(searchQuery) || c.text.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const s = {
    app: {
      fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
      background: theme.bg, color: theme.fg,
      minHeight: "100vh", maxWidth: 480, margin: "0 auto",
      position: "relative", overflow: "hidden",
      transition: "background 0.4s ease, color 0.4s ease",
    },
    "@media": {},
  };

  return (
    <div style={s.app}>
      <style>{keyframesCSS}</style>

      <StatusBar theme={theme} dark={dark} isOnline={isOnline} />

      {view !== "create" && view !== "detail" && (
        <TopBar theme={theme} dark={dark} setDark={setDark} view={view} cardCount={cards.length} />
      )}

      <div style={{ paddingBottom: 80, minHeight: "calc(100vh - 140px)" }}>
        {view === "map" && <MapView theme={theme} dark={dark} cards={cards} onCardClick={openDetail} />}
        {view === "explore" && (
          <ExploreView theme={theme} dark={dark} cards={filteredCards} allCards={cards}
            onCardClick={openDetail} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            filterCategory={filterCategory} setFilterCategory={setFilterCategory} />
        )}
        {view === "create" && <CreateView theme={theme} dark={dark} onCreate={createCard} onBack={() => setView("map")} />}
        {view === "profile" && <ProfileView theme={theme} dark={dark} cards={cards} dark2={dark} setDark={setDark} />}
        {view === "detail" && selectedCard && (
          <DetailView theme={theme} dark={dark} card={selectedCard} onBack={() => setView("explore")}
            onDelete={deleteCard} onUpdate={updateCard} />
        )}
      </div>

      {view !== "create" && view !== "detail" && (
        <FAB theme={theme} onClick={() => setView("create")} />
      )}

      {view !== "create" && view !== "detail" && (
        <BottomNav theme={theme} dark={dark} active={view} onChange={setView} />
      )}

      {toast && <Toast theme={theme} dark={dark} msg={toast.msg} type={toast.type} />}

      {!isOnline && <OfflineBanner theme={theme} />}
    </div>
  );
}

function StatusBar({ theme, dark, isOnline }) {
  return (
    <div style={{
      height: 28, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px", fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
      background: dark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)",
      color: theme.mutedFg, backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 50,
    }}>
      <span>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {isOnline ? <Icons.wifi style={{ width: 12, height: 12 }} /> : <Icons.wifiOff style={{ width: 12, height: 12 }} />}
        <span style={{ fontSize: 12 }}>▉▉▊</span>
      </div>
    </div>
  );
}

function TopBar({ theme, dark, setDark, view, cardCount }) {
  return (
    <div style={{
      padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
      background: dark ? "rgba(30,27,22,0.9)" : "rgba(243,238,223,0.9)",
      backdropFilter: "blur(12px)", position: "sticky", top: 28, zIndex: 40,
      borderBottom: `1.5px solid ${theme.border}`,
      animation: "slideDown 0.3s ease",
    }}>
      <div>
        <h1 style={{
          fontFamily: "'Crimson Pro', ui-serif, Georgia, serif",
          fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}>
          EchoMap
          <span style={{ color: theme.amber, marginLeft: 2 }}>.</span>
        </h1>
        <p style={{ fontSize: 11, color: theme.mutedFg, fontWeight: 500, marginTop: 1, letterSpacing: "0.03em" }}>
          {view === "map" ? "Discover nearby stories" : view === "explore" ? `${cardCount} story cards` : "My stories"}
        </p>
      </div>
      <button onClick={() => setDark(!dark)} style={{
        width: 40, height: 40, borderRadius: 12,
        border: `1.5px solid ${theme.border}`,
        background: dark ? theme.card : theme.parchment200,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.3s cubic-bezier(0.68,-0.25,0.265,1.25)",
        color: theme.fg,
      }}>
        {dark ? <Icons.sun style={{ width: 18, height: 18 }} /> : <Icons.moon style={{ width: 18, height: 18 }} />}
      </button>
    </div>
  );
}

function MapView({ theme, dark, cards, onCardClick }) {
  const [userLoc, setUserLoc] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLoading(false); },
        (err) => { setGeoError(err.message); setLoading(false); setUserLoc({ lat: 55.8462, lng: -4.4237 }); },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else { setLoading(false); setUserLoc({ lat: 55.8462, lng: -4.4237 }); }
  }, []);

  const mapBg = dark
    ? "linear-gradient(135deg, #1a2a1a 0%, #1E1B16 40%, #1a1e2a 100%)"
    : "linear-gradient(135deg, #d4e8c4 0%, #e8dcc4 40%, #c4d4e8 100%)";

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{
        height: 340, background: mapBg, position: "relative", overflow: "hidden",
        borderBottom: `2px solid ${theme.border}`,
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: dark ? 0.06 : 0.08,
          backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 480 340">
          <path d="M0 170 Q120 150 240 180 Q360 210 480 170" stroke={theme.muted} strokeWidth="3" fill="none" opacity="0.4"/>
          <path d="M200 0 Q180 100 220 170 Q260 240 240 340" stroke={theme.muted} strokeWidth="2.5" fill="none" opacity="0.3"/>
          <path d="M0 80 Q160 100 320 60 Q400 45 480 70" stroke={theme.muted} strokeWidth="2" fill="none" opacity="0.25"/>
        </svg>

        {cards.slice(0, 8).map((card, i) => {
          const x = 60 + (i * 47 + card.id.charCodeAt(0)) % 340;
          const y = 50 + (i * 37 + card.id.charCodeAt(1)) % 230;
          const c = colorMap[card.color]?.[dark ? "dark" : "light"] || colorMap.amber[dark ? "dark" : "light"];
          return (
            <button key={card.id} onClick={() => onCardClick(card)} style={{
              position: "absolute", left: x, top: y, transform: "translate(-50%, -100%)",
              cursor: "pointer", border: "none", background: "none", padding: 0,
              animation: `pinBounce 0.5s ease ${i * 0.1}s both`,
              zIndex: 10 + i, transition: "transform 0.2s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translate(-50%, -100%) scale(1.2)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translate(-50%, -100%) scale(1)"}
            >
              <div style={{
                width: 36, height: 44, position: "relative",
                filter: `drop-shadow(0 3px 6px ${theme.shadow})`,
              }}>
                <svg viewBox="0 0 36 44" width="36" height="44">
                  <path d="M18 44 C18 44 2 28 2 16 C2 7.16 9.16 0 18 0 C26.84 0 34 7.16 34 16 C34 28 18 44 18 44Z"
                    fill={c.bg} stroke={c.border} strokeWidth="2.5"/>
                  <circle cx="18" cy="16" r="8" fill={c.border} opacity="0.15"/>
                  <text x="18" y="20" textAnchor="middle" fontSize="14" fill={c.border}>
                    {CATEGORIES.find(ct => ct.value === card.category)?.icon || "◈"}
                  </text>
                </svg>
              </div>
            </button>
          );
        })}

        {userLoc && !loading && (
          <div style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            zIndex: 20,
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%", background: theme.info,
              border: `3px solid white`, boxShadow: `0 0 0 6px rgba(58,123,196,0.2), 0 2px 8px ${theme.shadow}`,
              animation: "pulse 2s ease infinite",
            }} />
          </div>
        )}

        {loading && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.1)", backdropFilter: "blur(2px)",
          }}>
            <div style={{
              width: 36, height: 36, border: `3px solid ${theme.muted}`,
              borderTopColor: theme.amber, borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }}/>
          </div>
        )}

        <div style={{
          position: "absolute", top: 16, right: 16, width: 36, height: 36,
          borderRadius: "50%", background: dark ? "rgba(40,36,30,0.8)" : "rgba(250,247,240,0.9)",
          border: `1.5px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: theme.fg, backdropFilter: "blur(8px)",
        }}>N</div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
          padding: "10px 14px", borderRadius: 12,
          background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          border: `1px solid ${theme.border}`,
        }}>
          <Icons.pin style={{ width: 16, height: 16, color: theme.amber, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600 }}>
              {userLoc ? `${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)}` : "Locating..."}
            </p>
            <p style={{ fontSize: 11, color: theme.mutedFg }}>{geoError ? `⚠ ${geoError}` : "Current location · GPS"}</p>
          </div>
        </div>

        <h3 style={{
          fontFamily: "'Crimson Pro', serif", fontSize: 18, fontWeight: 700,
          marginBottom: 12, letterSpacing: "-0.01em",
        }}>
          Nearby Stories <span style={{ color: theme.amber }}>({cards.length})</span>
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cards.slice(0, 3).map((card, i) => (
            <MiniCard key={card.id} card={card} theme={theme} dark={dark} onClick={() => onCardClick(card)} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniCard({ card, theme, dark, onClick, delay = 0 }) {
  const c = colorMap[card.color]?.[dark ? "dark" : "light"] || colorMap.amber[dark ? "dark" : "light"];
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
      borderRadius: 14, background: theme.card, border: `1.5px solid ${theme.border}`,
      cursor: "pointer", textAlign: "left", width: "100%",
      boxShadow: `0 2px 8px ${theme.shadow}`,
      animation: `fadeIn 0.4s ease ${delay}s both`,
      transition: "all 0.2s ease",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${theme.shadow}`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 2px 8px ${theme.shadow}`; }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: card.photo ? `url(${card.photo}) center/cover` : c.bg,
        border: `1.5px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>
        {!card.photo && (CATEGORIES.find(ct => ct.value === card.category)?.icon || "◈")}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.title}</p>
        <p style={{ fontSize: 11, color: theme.mutedFg, marginTop: 2 }}>
          {card.address || "Unknown location"} · {fmtDate(card.createdAt)}
        </p>
      </div>
      <div style={{
        width: 24, height: 24, borderRadius: 8,
        background: c.bg, border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: c.text, fontWeight: 700,
      }}>→</div>
    </button>
  );
}


