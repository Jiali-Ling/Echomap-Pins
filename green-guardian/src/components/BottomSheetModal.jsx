import { useEffect, useState } from "react";
import { X, MapPin, ChevronDown, ChevronUp, Navigation } from "lucide-react";
import "../styles/BottomSheetModal.css";

export default function BottomSheetModal({ observation, onClose, onNavigate, currentUserId, onTogglePublic, children }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  const isOwner = observation?.userId === currentUserId;

  useEffect(() => {
    if (observation) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [observation]);

  if (!observation) return null;

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    const deltaY = currentY - startY;
    
    if (deltaY > 100) {
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose();
      }
    } else if (deltaY < -100) {
      setIsExpanded(true);
    }
    
    setStartY(0);
    setCurrentY(0);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      
      <div 
        className={`bottom-sheet ${isExpanded ? 'bottom-sheet--expanded' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bottom-sheet-handle-container">
          <div className="bottom-sheet-handle" />
        </div>

        <button
          className="bottom-sheet-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <button
          className="bottom-sheet-expand"
          onClick={toggleExpand}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>

        <div className="bottom-sheet-content">
          {observation.photo && (
            <div className="bottom-sheet-image">
              <img src={observation.photo} alt={observation.species} />
            </div>
          )}

          <div className="bottom-sheet-header">
            <h2 className="bottom-sheet-title">{observation.species}</h2>
            {observation.scientificName && (
              <p className="bottom-sheet-subtitle">{observation.scientificName}</p>
            )}
          </div>

          {observation.description && (
            <div className="bottom-sheet-section">
              <p className="bottom-sheet-description">{observation.description}</p>
            </div>
          )}

          {observation.location && (
            <div className="bottom-sheet-section">
              <div className="bottom-sheet-location">
                <MapPin size={16} />
                <div>
                  <span className="location-coords">
                    {observation.location.lat.toFixed(4)}, {observation.location.lng.toFixed(4)}
                  </span>
                  {observation.location.accuracy && (
                    <span className="location-accuracy">
                      Accuracy: ±{Math.round(observation.location.accuracy)}m
                    </span>
                  )}
                </div>
              </div>

              {onNavigate && (
                <button
                  className="btn-navigate"
                  onClick={() => onNavigate(observation)}
                >
                  <Navigation size={18} />
                  Navigate Here
                </button>
              )}
            </div>
          )}

          {observation.username && (
            <div className="bottom-sheet-section">
              <div className="observer-badge">
                <div className="observer-avatar">
                  {observation.username.charAt(0)}
                </div>
                <div>
                  <div className="observer-label">Observed by</div>
                  <div className="observer-name">{observation.username}</div>
                </div>
              </div>
            </div>
          )}

          {observation.createdAt && (
            <div className="bottom-sheet-meta">
              <span>Observed on {new Date(observation.createdAt).toLocaleString()}</span>
            </div>
          )}

          {isOwner && (
            <div className="bottom-sheet-toggles">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={observation.isPublic !== false}
                  onChange={() => onTogglePublic(observation.id)}
                />
                <span>Visible to Community</span>
              </label>
            </div>
          )}

          {children && isExpanded && (
            <div className="bottom-sheet-extra">
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
