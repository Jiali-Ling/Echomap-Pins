import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 自定义 emoji 图标
const createEmojiIcon = () => {
  return L.divIcon({
    html: '<div style="font-size: 32px; text-align: center; line-height: 1;">📍</div>',
    className: "emoji-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// 当前位置图标
const createUserLocationIcon = () => {
  return L.divIcon({
    html: '<div style="font-size: 28px; text-align: center; line-height: 1;">📍</div>',
    className: "user-location-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

// 定位到用户当前位置组件
function LocateUser({ userLocation, onLocationFound }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.5 });
    }
  }, [userLocation, map]);

  const handleLocate = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          onLocationFound({ lat: latitude, lng: longitude, accuracy });
        },
        (err) => {
          alert(`无法获取位置: ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("您的浏览器不支持定位功能");
    }
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '10px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={handleLocate}
          style={{
            width: '34px',
            height: '34px',
            background: 'white',
            border: '2px solid rgba(0,0,0,0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="刷新当前位置"
        >
          🎯
        </button>
      </div>
    </div>
  );
}

// 自动调整地图视图到所有标记点
function AutoFitBounds({ cards }) {
  const map = useMap();

  useEffect(() => {
    const cardsWithLocation = cards.filter((c) => c.location);
    if (cardsWithLocation.length > 0) {
      const bounds = cardsWithLocation.map((c) => [c.location.lat, c.location.lng]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [cards, map]);

  return null;
}

// 处理地图点击事件
function MapClickHandler({ onMapClick }) {
  const [clickedPosition, setClickedPosition] = useState(null);
  
  useMapEvents({
    click(e) {
      setClickedPosition(e.latlng);
    },
  });

  return clickedPosition ? (
    <Popup
      position={clickedPosition}
      onClose={() => setClickedPosition(null)}
    >
      <div style={{ textAlign: "center", padding: "8px" }}>
        <p style={{ margin: "0 0 12px 0", fontWeight: "bold" }}>
          📍 在此添加故事？
        </p>
        <button
          style={{
            width: "100%",
            padding: "10px 16px",
            background: "#81b29a",
            border: "2px solid #2d2a24",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
          }}
          onClick={() => {
            onMapClick(clickedPosition);
            setClickedPosition(null);
          }}
        >
          + 创建新故事
        </button>
      </div>
    </Popup>
  ) : null;
}

export default function MapView({ cards, onSelect, onCreate, onCreateAtLocation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.006]); // 默认纽约
  const [isLocating, setIsLocating] = useState(true);
  
  const cardsWithLocation = useMemo(
    () => cards.filter((c) => c.location),
    [cards]
  );

  // 组件加载时自动获取用户位置
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const userPos = { lat: latitude, lng: longitude, accuracy };
          setUserLocation(userPos);
          setMapCenter([latitude, longitude]);
          setIsLocating(false);
        },
        (err) => {
          console.log("自动定位失败:", err.message);
          // 如果有卡片，使用第一个卡片的位置
          if (cardsWithLocation.length > 0) {
            const firstCard = cardsWithLocation[0].location;
            setMapCenter([firstCard.lat, firstCard.lng]);
          }
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
      // 如果有卡片，使用第一个卡片的位置
      if (cardsWithLocation.length > 0) {
        const firstCard = cardsWithLocation[0].location;
        setMapCenter([firstCard.lat, firstCard.lng]);
      }
    }
  }, []); // 只在组件挂载时执行一次

  return (
    <div className="mapView">
      {isLocating && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '12px 20px',
          borderRadius: '8px',
          border: '2px solid #2d2a24',
          fontWeight: 'bold'
        }}>
          🎯 正在定位...
        </div>
      )}
      <div className="mapContainerWrapper">
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: "100%", width: "100%", borderRadius: "18px" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {cardsWithLocation.map((card) => (
            <Marker
              key={card.id}
              position={[card.location.lat, card.location.lng]}
              icon={createEmojiIcon()}
              eventHandlers={{
                click: () => onSelect(card.id),
              }}
            >
              <Popup>
                <div style={{ maxWidth: "200px" }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>{card.title}</h3>
                  <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#666" }}>
                    {card.story.length > 100
                      ? card.story.slice(0, 100) + "…"
                      : card.story}
                  </p>
                  {card.photo && (
                    <img
                      src={card.photo}
                      alt={card.title}
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        marginBottom: "8px",
                      }}
                    />
                  )}
                  {card.audio && (
                    <div style={{ marginBottom: "8px" }}>
                      <audio controls src={card.audio} style={{ width: "100%", height: "32px" }} />
                    </div>
                  )}
                  <button
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "#81b29a",
                      border: "2px solid #2d2a24",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                    onClick={() => onSelect(card.id)}
                  >
                    查看详情
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserLocationIcon()}
            >
              <Popup>
                <div style={{ textAlign: "center" }}>
                  <strong>📍 您的位置</strong>
                  <br />
                  <small>精度: ±{Math.round(userLocation.accuracy)}m</small>
                </div>
              </Popup>
            </Marker>
          )}

          <LocateUser userLocation={userLocation} onLocationFound={setUserLocation} />
          <AutoFitBounds cards={cardsWithLocation} />
          {onCreateAtLocation && <MapClickHandler onMapClick={onCreateAtLocation} />}
        </MapContainer>
      </div>

      <div className="mapFooter">
        <button className="btn btn--primary" onClick={onCreate}>
          + New Card
        </button>
        <p className="hint">
          {cardsWithLocation.length} card{cardsWithLocation.length !== 1 ? "s" : ""} with
          location
        </p>
      </div>
    </div>
  );
}
