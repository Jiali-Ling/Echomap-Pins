import { useMemo, useRef, useState } from "react";
import usePersistedState from "./hooks/usePersistedState";
import MapView from "./components/MapView";
import CardModal from "./components/CardModal";
import { Camera, Mic, MapPin, List, Map as MapIcon, Home, PlusCircle, Trash2, Locate } from "lucide-react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "./App.css";

const STORAGE_KEY = "echomap.cards.v1";

function makeId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const readAndResizeImage = (file, maxW = 900, quality = 0.85) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = fr.result;
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

export default function App() {
  const [cards, setCards] = usePersistedState(STORAGE_KEY, []);
  const [mode, setMode] = useState("home"); // home | list | create | map
  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [location, setLocation] = useState(null); // { lat, lng, accuracy, ts }
  const [locStatus, setLocStatus] = useState("");
  const [photo, setPhoto] = useState(null); // dataURL
  const [audio, setAudio] = useState(null); // dataURL
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const activeCard = useMemo(
    () => cards.find((c) => c.id === activeId) ?? null,
    [cards, activeId]
  );

  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => b.createdAt - a.createdAt);
  }, [cards]);

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readAndResizeImage(file);
      setPhoto(dataUrl);
    } catch {
      // 简单处理：失败就不设图
    } finally {
      e.target.value = ""; // 允许重复选择同一张图
    }
  };

  const getLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocStatus("Geolocation not supported.");
      return;
    }

    setLocStatus("Locating…");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
          ts: Date.now(),
        });
        setLocStatus("Location added ✓");
      },
      (err) => {
        setLocStatus(`Location failed: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudio(reader.result);
        };
        reader.readAsDataURL(audioBlob);
        
        // 停止所有音频轨道
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);

      // 最大录制时间 30 秒
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 30) {
            stopRecording();
            return 30;
          }
          return t + 1;
        });
      }, 1000);
    } catch (err) {
      alert(`Cannot access microphone: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const onCreate = (e) => {
    e.preventDefault();
    const t = title.trim();
    const s = story.trim();
    if (!t || !s) return;

    const now = Date.now();
    const newCard = {
      id: makeId(),
      title: t,
      story: s,
      createdAt: now,
      updatedAt: now,
      location: location,
      photo: photo,
      audio: audio,
    };

    setCards((prev) => [newCard, ...prev]);
    setTitle("");
    setStory("");
    setLocation(null);
    setLocStatus("");
    setPhoto(null);
    setAudio(null);
    setRecordingTime(0);
    setMode("list");
  };

  const onDelete = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

      if (mode === "home") {
    return (
      <div className="home">
        <div className="hero">
          <section className="scroll">
            <div className="scroll__inner">
              <div className="scroll__media">
                <img
                  className="heroImage"
                  src="/landing.png"
                  alt="EchoMap Pins landing illustration"
                />
                <div className="heroFade" />
             </div>
            </div>
          </section>

          <aside className="sidepanel">
            <div className="sidepanel__top">
              <div className="sidepanel__icon">
                  <MapPin size={32} color="#fff" />
              </div>
              <div>
                <div className="sidepanel__name">EchoMap Pins</div>
                <div className="sidepanel__tag">Local-first • Shareable • Offline</div>
              </div>
            </div>

            <div className="sidepanel__quote">“Leave a story on the map.”</div>

            <div className="sidepanel__desc">
              Create a card → saved on device → view anytime offline.
              <br />
              Next: Camera + PWA offline caching.
            </div>

            <button className="btn btn--primary btn--block" onClick={() => {
              console.log("Enter button clicked, changing mode to map");
              setMode("map");
            }}>
              Enter
            </button>

            <button className="btn btn--ghost btn--block" onClick={() => {
              console.log("Create button clicked, changing mode to create");
              setMode("create");
            }}>
              Create a card
            </button>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">EchoMap Pins</h1>

        <div className="actions">
          <button className="btn btn--ghost" onClick={() => setMode("home")}>
            Home
          </button>

          <button 
            className={`btn ${mode === "map" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setMode("map")}
          >
            Map
          </button>

          <button 
            className={`btn ${mode === "list" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setMode("list")}
          >
            List
          </button>

          {mode !== "create" ? (
            <button className="btn btn--primary" onClick={() => setMode("create")}>
              New Card
            </button>
          ) : (
            <button className="btn btn--ghost" onClick={() => setMode("map")}>
              Back
            </button>
         )}
          </div>
      </header>

      {mode === "map" ? (
        <MapView
          cards={sortedCards}
          onSelect={(id) => setActiveId(id)}
          onCreate={() => setMode("create")}
          onCreateAtLocation={(latlng) => {
            setLocation({
              lat: latlng.lat,
              lng: latlng.lng,
              accuracy: 0,
              ts: Date.now(),
            });
            setLocStatus("Location from map ✓");
            setMode("create");
          }}
        />
      ) : mode === "create" ? (
        <form className="panel" onSubmit={onCreate}>

          <div className="photoBox">
            <button
              className="btn"
              type="button"
              onClick={() => fileRef.current?.click()}
            >
              <Camera size={18} className="inline-block mr-2" /> Add photo
            </button>

            <input
              ref={fileRef}
              className="hiddenFile"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPickPhoto}
            />

            {photo ? (
              <div className="photoPreview">
                <img className="photoImg" src={photo} alt="Selected" />
                <button
                  className="btn btn--danger"
                  type="button"
                  onClick={() => setPhoto(null)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="hint">Tip: on Android this can open the camera.</p>
            )}
          </div>

          <div className="audioBox">
            <button
              className="btn"
              type="button"
              onClick={recording ? stopRecording : startRecording}
              style={{ background: recording ? "#e07a5f" : undefined }}
            >
              {recording ? `⏹ Stop (${recordingTime}s)` : <><Mic size={18} className="inline-block mr-2" /> Record Audio</>}
            </button>

            {audio ? (
              <div className="audioPreview">
                <audio controls src={audio} style={{ width: "100%", marginBottom: "8px" }} />
                <button
                  className="btn btn--danger"
                  type="button"
                  onClick={() => setAudio(null)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="hint">
                {recording ? "Recording... (max 30s)" : "Tap to start recording (10-30s recommended)"}
              </p>
            )}
          </div>

          <label className="field">
            <span>Title</span>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The quiet alley behind the library"
            />
          </label>

          <label className="field">
            <span>Story</span>
            <textarea
              className="input input--area"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Write the story someone should know about this place..."
              rows={6}
            />
          </label>

          <div style={{ display: "grid", gap: 8 }}>
            <button className="btn" type="button" onClick={getLocation}>
             <Locate size={18} className="inline-block mr-2" /> Get Location
            </button>

            {location ? (
              <p className="hint">
                Lat {location.lat.toFixed(5)}, Lng {location.lng.toFixed(5)} (±{Math.round(location.accuracy)}m)
              </p>
            ) : null}

           {locStatus ? <p className="hint">{locStatus}</p> : null}
          </div>


          <button className="btn btn--primary btn--block" type="submit">
            Save
          </button>

          <p className="hint">
            (Next steps: add location + photo; then PWA offline.)
          </p>
        </form>
      ) : (
        <main className="content">
          {sortedCards.length === 0 ? (
            <p className="empty">No cards yet. Create your first one.</p>
          ) : (
            <ul className="list">
              {sortedCards.map((c) => (
                <li key={c.id} className="card">
                  <div className="card__row">
                    <div>
                      <p className="card__title">{c.title}</p>
                      <p className="card__meta">
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                      <p className="card__text">
                        {c.story.length > 120 ? c.story.slice(0, 120) + "…" : c.story}
                      </p>
                    </div>

                    <button
                      className="btn btn--danger"
                      onClick={() => onDelete(c.id)}
                      type="button"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      )}

      {activeCard ? (
        <CardModal card={activeCard} onClose={() => setActiveId(null)} />
      ) : null}
    </div>
  );
}


