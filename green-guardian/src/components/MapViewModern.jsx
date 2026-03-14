import { useEffect, useMemo, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { MapPin, Locate, TrendingUp, Eye, Heart, Calendar, Leaf, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createMarkerIcon = () =>
  L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#81b29a" fill-opacity="0.9" stroke="#2d2a24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

const createUserLocationIcon = () =>
  L.divIcon({
    html: `<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: "user-location-marker",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

function AutoFitBounds({ observations, userLocation }) {
  const map = useMap();
  useEffect(() => {
    const bounds = [];
    observations.forEach((obs) => {
      if (obs.location) bounds.push([obs.location.lat, obs.location.lng]);
    });
    if (userLocation) bounds.push([userLocation.lat, userLocation.lng]);
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  }, [observations, userLocation, map]);
  return null;
}

function LocateControl({ onLocationFound }) {
  const map = useMap();

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        onLocationFound(loc);
        map.setView([loc.lat, loc.lng], 15, { duration: 1 });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [map, onLocationFound]);

  return (
    <button className="map-locate-btn" onClick={handleLocate} aria-label="Locate me" title="Locate me">
      <Locate size={20} />
    </button>
  );
}

function ObsPanelImage({ photo, species }) {
  const [err, setErr] = useState(false);
  if (!photo || err) {
    return (
      <div className="map-panel-img-fallback">
        <Leaf size={32} />
      </div>
    );
  }
  return (
    <img
      src={photo}
      alt={species}
      className="map-panel-img"
      onError={() => setErr(true)}
    />
  );
}

function RecentObsItem({ obs, onClick }) {
  const [err, setErr] = useState(false);
  return (
    <div className="map-recent-item" onClick={() => onClick(obs)}>
      <div className="map-recent-thumb">
        {obs.photo && !err ? (
          <img src={obs.photo} alt={obs.species} onError={() => setErr(true)} loading="lazy" />
        ) : (
          <div className="map-recent-thumb-fallback">
            <Leaf size={20} />
          </div>
        )}
      </div>
      <div className="map-recent-info">
        <div className="map-recent-species">{obs.species}</div>
        <div className="map-recent-meta">
          <span>{obs.username}</span>
          {obs.confidence && <span className="map-recent-confidence">{obs.confidence}%</span>}
        </div>
      </div>
      <Heart size={14} className="map-recent-heart" />
      <span className="map-recent-likes">{obs.likes || 0}</span>
    </div>
  );
}

export default function MapViewModern({ observations = [], userLocation, onObservationClick, user }) {
  const [mapCenter] = useState([32.0603, 118.7969]);
  const [localUserLocation, setLocalUserLocation] = useState(() => {
    const lat = Number(userLocation?.lat);
    const lng = Number(userLocation?.lng);
    const accuracy = Number(userLocation?.accuracy);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(accuracy) && accuracy > 0) {
      return {
        lat,
        lng,
        accuracy,
      };
    }
    return null;
  });
  const [selectedObservation, setSelectedObservation] = useState(null);

  const hasPreciseUserLocation =
    Number.isFinite(localUserLocation?.lat) &&
    Number.isFinite(localUserLocation?.lng) &&
    Number.isFinite(localUserLocation?.accuracy) &&
    localUserLocation.accuracy > 0;

  const displayObservations = useMemo(() => {
    const fallbackLat = hasPreciseUserLocation ? localUserLocation.lat : mapCenter[0];
    const fallbackLng = hasPreciseUserLocation ? localUserLocation.lng : mapCenter[1];
    const overlapCounts = new Map();

    return observations.map((obs, index) => {
      const rawLat = Number(
        obs?.location?.lat ??
          obs?.location?.latitude ??
          obs?.lat ??
          obs?.latitude
      );
      const rawLng = Number(
        obs?.location?.lng ??
          obs?.location?.lon ??
          obs?.location?.longitude ??
          obs?.lng ??
          obs?.lon ??
          obs?.longitude
      );
      const hasValidLocation = Number.isFinite(rawLat) && Number.isFinite(rawLng);

      let baseLat = rawLat;
      let baseLng = rawLng;

      if (!hasValidLocation) {
        const idSeed = `${obs.id || ""}-${obs.species || ""}-${index}`;
        let hash = 0;
        for (let i = 0; i < idSeed.length; i++) {
          hash = idSeed.charCodeAt(i) + ((hash << 5) - hash);
        }

        const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
        const radius = 0.01 + (Math.abs(hash >> 8) % 100) * 0.0002;
        baseLat = fallbackLat + Math.cos(angle) * radius;
        baseLng = fallbackLng + Math.sin(angle) * radius;
      }

      const overlapKey = `${baseLat.toFixed(5)},${baseLng.toFixed(5)}`;
      const overlapIndex = overlapCounts.get(overlapKey) || 0;
      overlapCounts.set(overlapKey, overlapIndex + 1);

      let finalLat = baseLat;
      let finalLng = baseLng;

      if (overlapIndex > 0) {
        // Spread overlapping markers in a tiny spiral so each one is clickable.
        const spiralAngle = overlapIndex * 2.399963229728653;
        const spiralRadius = 0.0012 * Math.ceil(overlapIndex / 6);
        finalLat = baseLat + Math.cos(spiralAngle) * spiralRadius;
        finalLng = baseLng + Math.sin(spiralAngle) * spiralRadius;
      }

      return {
        ...obs,
        markerKey: `${obs.id || "obs"}-${index}`,
        location: {
          lat: finalLat,
          lng: finalLng,
          accuracy: obs?.location?.accuracy ?? 0,
        },
      };
    });
  }, [hasPreciseUserLocation, localUserLocation, mapCenter, observations]);

  const stats = useMemo(() => ({
    total: observations.length,
    species: new Set(observations.map((o) => o.species)).size,
    likes: observations.reduce((s, o) => s + (o.likes || 0), 0),
  }), [observations]);

  const recentObservations = useMemo(
    () => [...observations].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10),
    [observations]
  );

  useEffect(() => {
    const lat = Number(userLocation?.lat);
    const lng = Number(userLocation?.lng);
    const accuracy = Number(userLocation?.accuracy);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(accuracy) && accuracy > 0) {
      setLocalUserLocation({
        lat,
        lng,
        accuracy,
      });
    }
  }, [userLocation]);

  useEffect(() => {
    if (hasPreciseUserLocation || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [hasPreciseUserLocation]);

  const handleMarkerClick = (obs) => {
    setSelectedObservation(obs);
    onObservationClick?.(obs);
  };

  return (
    <div className="map-view-modern">
      <div className="map-inner">
        <div className="map-header-card">
          <div className="map-avatar">
            {user?.username?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="map-welcome">Welcome, {user?.username || "Observer"}</h2>
            <p className="map-bio">{user?.bio || "Wildlife conservation enthusiast"}</p>
          </div>
        </div>

        <div className="map-stats-row">
          <div className="map-stat-card">
            <TrendingUp size={20} className="map-stat-icon map-stat-icon--blue" />
            <div className="map-stat-value">{stats.total}</div>
            <div className="map-stat-label">Observations</div>
          </div>
          <div className="map-stat-card">
            <Eye size={20} className="map-stat-icon map-stat-icon--green" />
            <div className="map-stat-value">{stats.species}</div>
            <div className="map-stat-label">Species</div>
          </div>
          <div className="map-stat-card">
            <Heart size={20} className="map-stat-icon map-stat-icon--red" />
            <div className="map-stat-value">{stats.likes}</div>
            <div className="map-stat-label">Total Likes</div>
          </div>
        </div>

        <div className="map-main-grid">
          <div className="map-container-wrap">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {displayObservations.map((obs) => (
                <Marker
                  key={obs.markerKey}
                  position={[obs.location.lat, obs.location.lng]}
                  icon={createMarkerIcon()}
                  eventHandlers={{ click: () => handleMarkerClick(obs) }}
                >
                  <Popup>
                    <strong>{obs.species}</strong>
                    <br />
                    <small>{obs.username}</small>
                  </Popup>
                </Marker>
              ))}

              {hasPreciseUserLocation && (
                <>
                  <Circle
                    center={[localUserLocation.lat, localUserLocation.lng]}
                    radius={Math.max(20, Math.min(localUserLocation.accuracy, 250))}
                    pathOptions={{
                      color: "#4285F4",
                      fillColor: "#4285F4",
                      fillOpacity: 0.16,
                      weight: 1,
                    }}
                  />
                  <Marker
                    position={[localUserLocation.lat, localUserLocation.lng]}
                    icon={createUserLocationIcon()}
                  >
                    <Popup>
                      <strong>Your location</strong>
                      <br />
                      <small>Accuracy: +- {Math.round(localUserLocation.accuracy)}m</small>
                    </Popup>
                  </Marker>
                </>
              )}

              <AutoFitBounds
                observations={displayObservations}
                userLocation={hasPreciseUserLocation ? localUserLocation : null}
              />
              <LocateControl onLocationFound={setLocalUserLocation} />
            </MapContainer>
          </div>

          <div className="map-detail-panel">
            {selectedObservation ? (
              <div className="map-panel-selected">
                <button
                  className="map-panel-close"
                  onClick={() => setSelectedObservation(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <div className="map-panel-photo-wrap">
                  <ObsPanelImage photo={selectedObservation.photo} species={selectedObservation.species} />
                </div>
                <h3 className="map-panel-species">{selectedObservation.species}</h3>
                <div className="map-panel-confidence">
                  Confidence: {selectedObservation.confidence}%
                </div>
                <p className="map-panel-desc">{selectedObservation.description}</p>
                <div className="map-panel-meta">
                  <span>{selectedObservation.username}</span>
                  <span>{selectedObservation.likes || 0} likes</span>
                </div>
                <button
                  className="map-panel-detail-btn"
                  onClick={() => onObservationClick?.(selectedObservation)}
                >
                  View Full Details
                </button>
              </div>
            ) : (
              <div className="map-panel-list">
                <div className="map-panel-list-header">
                  <Calendar size={18} />
                  <span>Recent Observations</span>
                  <span className="map-panel-list-count">{observations.length} total</span>
                </div>
                <div className="map-panel-list-scroll">
                  {recentObservations.length === 0 ? (
                    <div className="map-panel-empty">
                      <MapPin size={40} />
                      <p>No observations yet</p>
                    </div>
                  ) : (
                    recentObservations.map((obs) => (
                      <RecentObsItem key={obs.id} obs={obs} onClick={handleMarkerClick} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
