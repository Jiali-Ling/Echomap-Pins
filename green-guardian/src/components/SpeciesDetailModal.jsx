import { X, MapPin, Info, Share2, BookmarkPlus, Camera } from "lucide-react";
import "../styles/SpeciesDetailModal.css";

export default function SpeciesDetailModal({ observation, onClose, onViewSimilar, currentUserId, onTogglePublic, children }) {
  if (!observation) return null;

  const isOwner = observation.userId === currentUserId;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${observation.species} Observation`,
          text: `I observed ${observation.species} on Green Guardian!`,
          url: window.location.href,
        });
      } catch (err) {}
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="species-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        {observation.photo && (
          <div className="species-photo">
            <img src={observation.photo} alt={observation.species} />
          </div>
        )}

        <div className="species-content">
          <div className="species-header">
            <div>
              <h2 className="species-name">{observation.species}</h2>
              {observation.scientificName && (
                <p className="scientific-name">{observation.scientificName}</p>
              )}
            </div>
            <div className="action-buttons">
              <button className="btn-icon-round" onClick={handleShare} aria-label="Share" title="Share this observation">
                <Share2 size={20} />
                <span className="btn-label">Share</span>
              </button>
              <button className="btn-icon-round" aria-label="Bookmark" title="Save to bookmarks">
                <BookmarkPlus size={20} />
                <span className="btn-label">Save</span>
              </button>
            </div>
          </div>

          {observation.description && (
            <div className="info-section">
              <h3>
                <Info size={18} />
                Description
              </h3>
              <p>{observation.description}</p>
            </div>
          )}

          {observation.location && (
            <div className="info-section">
              <h3>
                <MapPin size={18} />
                Location
              </h3>
              <p className="location-text">
                Lat: {observation.location.lat.toFixed(6)}, Lng: {observation.location.lng.toFixed(6)}
                <br />
                <span className="accuracy">Accuracy: ±{Math.round(observation.location.accuracy)}m</span>
              </p>
              <a
                href={`https://www.google.com/maps?q=${observation.location.lat},${observation.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--outline"
              >
                <MapPin size={18} />
                View on Map
              </a>
            </div>
          )}

          {observation.allPredictions && observation.allPredictions.length > 1 && (
            <div className="info-section">
              <h3>Alternative Identifications</h3>
              <div className="predictions-list">
                {observation.allPredictions.slice(1, 4).map((pred, index) => (
                  <div key={index} className="prediction-item">
                    <span className="pred-name">{pred.species}</span>
                    <span className="pred-confidence">{pred.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="info-section">
            <p className="timestamp">
              <Camera size={16} />
              Observed on {new Date(observation.createdAt || Date.now()).toLocaleString()}
            </p>
          </div>

          {isOwner && (
            <div className="modal-toggles">
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

          {children}

          {onViewSimilar && (
            <button className="btn btn--primary btn-full" onClick={onViewSimilar}>
              View Similar Observations in Community
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
