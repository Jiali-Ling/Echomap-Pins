import { useEffect, useRef, useState } from "react";
import { Navigation, Camera, X } from "lucide-react";
import useGeolocation, { calculateDistance, calculateBearing } from "../hooks/useGeolocation";
import "../styles/ARCameraView.css";

export default function ARCameraView({ targetLocation, targetName, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [deviceOrientation, setDeviceOrientation] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const { location, error: gpsError, startTracking, stopTracking } = useGeolocation();

  useEffect(() => {
    startCameraStream();
    startTracking();
    startOrientationTracking();

    return () => {
      stopCameraStream();
      stopTracking();
      stopOrientationTracking();
    };
  }, []);

  const startCameraStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(null);
    } catch (err) {
      setCameraError("Unable to access camera. Please grant camera permissions.");
    }
  };

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleOrientation = (event) => {
    if (event.alpha !== null) {
      setDeviceOrientation(event.alpha);
    } else if (event.webkitCompassHeading !== undefined) {
      setDeviceOrientation(event.webkitCompassHeading);
    }
  };

  const startOrientationTracking = () => {
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);
      window.addEventListener("deviceorientationabsolute", handleOrientation);
    }
  };

  const stopOrientationTracking = () => {
    window.removeEventListener("deviceorientation", handleOrientation);
    window.removeEventListener("deviceorientationabsolute", handleOrientation);
  };

  const getNavigationData = () => {
    if (!location || !targetLocation) {
      return null;
    }

    const distance = calculateDistance(
      location.lat,
      location.lng,
      targetLocation.lat,
      targetLocation.lng
    );

    const bearing = calculateBearing(
      location.lat,
      location.lng,
      targetLocation.lat,
      targetLocation.lng
    );

    const relativeBearing = (bearing - deviceOrientation + 360) % 360;

    return {
      distance,
      bearing,
      relativeBearing,
    };
  };

  const navData = getNavigationData();

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  return (
    <div className="ar-camera-view">
      <button className="ar-close-btn" onClick={onClose}>
        <X size={24} />
      </button>

      <div className="ar-camera-container">
        {cameraError ? (
          <div className="ar-error">
            <Camera size={64} />
            <p>{cameraError}</p>
            <button onClick={startCameraStream} className="retry-btn">
              Retry Camera Access
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="ar-video"
          />
        )}
      </div>

      {navData && (
        <>
          <div className="ar-compass">
            <div className="compass-ring">
              <div className="compass-marker north">N</div>
              <div className="compass-marker east">E</div>
              <div className="compass-marker south">S</div>
              <div className="compass-marker west">W</div>
            </div>
            <div
              className="ar-arrow"
              style={{
                transform: `rotate(${navData.relativeBearing}deg)`,
              }}
            >
              <div className="arrow-icon">↑</div>
            </div>
          </div>

          <div className="ar-info-panel">
            <div className="ar-target-name">
              <Navigation size={20} />
              <span>{targetName}</span>
            </div>
            <div className="ar-distance">
              <div className="distance-value">{formatDistance(navData.distance)}</div>
              <div className="distance-label">Distance</div>
            </div>
            {location && location.accuracy && (
              <div className="ar-accuracy">
                GPS Accuracy: ±{Math.round(location.accuracy)}m
                {location.accuracy > 50 && (
                  <span className="accuracy-warning"> (Low accuracy)</span>
                )}
              </div>
            )}
          </div>

          <div className="ar-direction-indicator">
            <div
              className="direction-bar"
              style={{
                opacity: Math.max(0.3, 1 - Math.abs(navData.relativeBearing - 180) / 180),
              }}
            >
              {navData.relativeBearing < 30 || navData.relativeBearing > 330
                ? "Straight ahead"
                : navData.relativeBearing < 180
                ? "Turn right"
                : "Turn left"}
            </div>
          </div>
        </>
      )}

      {!location && !gpsError && (
        <div className="ar-loading">
          <div className="loading-spinner"></div>
          <p>Acquiring GPS signal...</p>
        </div>
      )}
    </div>
  );
}
