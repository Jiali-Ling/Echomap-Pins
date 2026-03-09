import { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, Check, X, Loader, AlertCircle } from "lucide-react";
import useSpeciesRecognition from "../hooks/useSpeciesRecognition";
import "../styles/SpeciesScanner.css";

export default function SpeciesScanner({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  const { classifyImage, isReady, isLoading, error: modelError } = useSpeciesRecognition();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported. Please use HTTPS or a modern browser.");
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Please allow camera access. Check browser settings if needed.");
      } else if (err.name === "NotFoundError") {
        setError("No camera detected on this device.");
      } else if (err.name === "NotSupportedError" || err.name === "TypeError") {
        setError("Camera not supported. HTTPS may be required on this device.");
      } else {
        setError("Unable to access camera. Try refreshing the page.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
      };
      reader.readAsDataURL(blob);
    }, "image/jpeg", 0.95);
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      if (isReady) {
        const img = document.createElement("img");
        img.src = capturedImage;
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const predictions = await classifyImage(img);
        
        if (predictions && predictions.length > 0) {
          onCapture({
            photo: capturedImage,
            species: predictions[0].species,
            confidence: predictions[0].confidence,
            allPredictions: predictions,
          });
          return;
        }
      }
      
      onCapture({
        photo: capturedImage,
        species: "Unknown Species",
        confidence: 0,
        allPredictions: [],
      });
      
    } catch (err) {
      onCapture({
        photo: capturedImage,
        species: "Unknown Species",
        confidence: 0,
        allPredictions: [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };

  return (
    <div className="species-scanner">
      <div className="scanner-header">
        <h2>Scan Wildlife</h2>
        <button className="btn-icon" onClick={onCancel} aria-label="Close">
          <X size={24} />
        </button>
      </div>

      <div className="scanner-viewport">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-preview"
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            
            {!cameraReady && (
              <div className="loading-overlay">
                <Loader className="spinner" size={32} />
                <p>Starting camera...</p>
              </div>
            )}
          </>
        ) : (
          <img src={capturedImage} alt="Captured" className="captured-image" />
        )}

        {error && (
          <div className="error-overlay">
            <div className="error-card">
              <AlertCircle size={48} />
              <h3>Camera Access Required</h3>
              <p>{error}</p>
              <button className="btn-retry" onClick={startCamera}>
                <RotateCcw size={20} />
                Retry Camera Access
              </button>
              <div className="error-card-help">
                <div className="error-card-help-title">Need Help?</div>
                <div className="error-card-help-text">
                  Chrome: Tap the lock icon in address bar → Site settings → Camera → Allow
                </div>
              </div>
            </div>
          </div>
        )}
        
        {modelError && (
          <div className="warning-toast">
            <AlertCircle size={16} />
            <span>{modelError}</span>
          </div>
        )}
      </div>

      <div className="scanner-controls">
        {!capturedImage ? (
          <>
            <div className="ai-status">
              {isLoading ? (
                <><Loader className="spinner-small" size={16} /> Loading AI model...</>
              ) : isReady ? (
                <><Check size={16} /> AI Ready</>
              ) : (
                <><AlertCircle size={16} /> AI Unavailable</>
              )}
            </div>
            <button
              className="btn-capture"
              onClick={capturePhoto}
              disabled={!cameraReady}
              aria-label="Capture photo"
            >
              <Camera size={32} />
            </button>
            <div className="ai-status" style={{ opacity: 0 }}>Placeholder</div>
          </>
        ) : (
          <>
            <button className="btn btn--secondary" onClick={retakePhoto}>
              <RotateCcw size={20} />
              Retake
            </button>
            <button
              className="btn btn--primary"
              onClick={analyzeImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <><Loader className="spinner-small" size={20} /> {isReady ? 'Analyzing...' : 'Saving...'}</>
              ) : isReady ? (
                <><Check size={20} /> Identify Species</>
              ) : (
                <><Check size={20} /> Save Photo</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
