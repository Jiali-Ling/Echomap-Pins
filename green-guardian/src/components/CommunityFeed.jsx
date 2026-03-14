import { useState, useMemo } from "react";
import { Heart, MessageCircle, MapPin, Award, Search, Trash2, Leaf } from "lucide-react";
import "../styles/CommunityFeed.css";

const SCOPE_FILTER_MAP = {
  all: () => true,
  mine: (obs, currentUserId) => obs.userId === currentUserId,
};

const VISIBILITY_FILTER_MAP = {
  all: () => true,
  pending: (obs) => obs.isPublic === false,
  done: (obs) => obs.isPublic !== false,
};

export default function CommunityFeed({ observations, onSelectObservation, currentUserId, onDeleteObservation, onTogglePublic }) {
  const [scopeFilter, setScopeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredObservations = useMemo(() => {
    let result = [...observations]
      .filter((obs) => (SCOPE_FILTER_MAP[scopeFilter] || SCOPE_FILTER_MAP.all)(obs, currentUserId))
      .filter((obs) => (VISIBILITY_FILTER_MAP[statusFilter] || VISIBILITY_FILTER_MAP.all)(obs));

    if (searchTerm) {
      result = result.filter(
        (obs) =>
          obs.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          obs.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [observations, scopeFilter, statusFilter, searchTerm, currentUserId]);

  return (
    <div className="community-feed">
      <div className="feed-header">
        <h1>Community Observations</h1>
        <p className="feed-subtitle">Discover wildlife around the world</p>
      </div>

      <div className="feed-controls">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search species..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${scopeFilter === "all" ? "active" : ""}`}
            onClick={() => setScopeFilter("all")}
          >
            All Posts
          </button>
          <button
            className={`filter-btn ${scopeFilter === "mine" ? "active" : ""}`}
            onClick={() => setScopeFilter("mine")}
          >
            My Posts
          </button>
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Visibility
          </button>
          <button
            className={`filter-btn ${statusFilter === "pending" ? "active" : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            Private
          </button>
          <button
            className={`filter-btn ${statusFilter === "done" ? "active" : ""}`}
            onClick={() => setStatusFilter("done")}
          >
            Public
          </button>
        </div>
      </div>

      <div className="feed-grid">
        {filteredObservations.length === 0 ? (
          <div className="empty-state">
            <Award size={48} />
            <h3>No observations yet</h3>
            <p>Be the first to share a wildlife observation!</p>
          </div>
        ) : (
          filteredObservations.map((obs) => (
            <ObservationCard
              key={obs.id}
              observation={obs}
              onClick={() => onSelectObservation(obs)}
              onDelete={obs.userId === currentUserId ? () => onDeleteObservation(obs.id) : null}
              onTogglePublic={onTogglePublic}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ObservationCard({ observation, onClick, onDelete, onTogglePublic, currentUserId }) {
  const [liked, setLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const likeCount = observation.likes || 0;
  const commentCount = observation.comments?.length || 0;
  const isOwner = observation.userId === currentUserId;

  const handleLike = (e) => {
    e.stopPropagation();
    setLiked(!liked);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm("Delete this observation?")) {
      onDelete();
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleTogglePublic = (e) => {
    e.stopPropagation();
    onTogglePublic(observation.id);
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "Recently";
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="observation-card" onClick={onClick}>
      {onDelete && (
        <button
          className="delete-btn"
          onClick={handleDelete}
          aria-label="Delete observation"
        >
          <Trash2 size={18} />
        </button>
      )}
      {observation.photo && (
        <div className="card-image">
          {!imageError ? (
            <img 
              src={observation.photo} 
              alt={observation.species}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="card-image-fallback">
              <Leaf size={48} />
            </div>
          )}
        </div>
      )}

      <div className="card-content">
        <div className="card-header">
          <div className="observer-info">
            <div className="observer-avatar">
              {observation.username?.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="card-title">{observation.species || "Unknown Species"}</h3>
              <p className="observer-name">by {observation.username || "Anonymous"}</p>
            </div>
          </div>
        </div>

        {observation.description && (
          <p className="card-description">
            {observation.description.length > 80
              ? observation.description.slice(0, 80) + "..."
              : observation.description}
          </p>
        )}

        {observation.location && (
          <div className="card-location">
            <MapPin size={14} />
            <span>
              {observation.location.lat.toFixed(4)}, {observation.location.lng.toFixed(4)}
            </span>
          </div>
        )}

        <div className="card-footer">
          <div className="card-interactions">
            <button
              className={`interaction-btn ${liked ? "liked" : ""}`}
              onClick={handleLike}
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
              <span>{liked ? likeCount + 1 : likeCount}</span>
            </button>
            <button className="interaction-btn">
              <MessageCircle size={16} />
              <span>{commentCount}</span>
            </button>
          </div>

          <span className="card-time">
            {getTimeAgo(observation.createdAt)}
          </span>
        </div>

        <div className="card-toggles">
          {isOwner && (
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={observation.isPublic !== false}
                onChange={handleTogglePublic}
              />
              <span>Visible to Community</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
