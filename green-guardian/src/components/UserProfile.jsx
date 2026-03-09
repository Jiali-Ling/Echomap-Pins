import { useRef } from "react";
import { User, Award, MapPin, Camera, Settings, LogOut, Trash2 } from "lucide-react";
import "../styles/UserProfile.css";

export default function UserProfile({ user, observations, onEditProfile, onLogout, onDeleteObservation, onObservationClick, onUpdateAvatar }) {
  const fileInputRef = useRef(null);
  const userObservations = observations.filter((obs) => obs.userId === user.id);
  const speciesCount = new Set(userObservations.map((obs) => obs.species)).size;
  const totalObservations = userObservations.length;

  const recentObservations = userObservations
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 6);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => onUpdateAvatar?.(evt.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div
          className="profile-avatar-large"
          onClick={handleAvatarClick}
          role="button"
          tabIndex={0}
          aria-label="Change profile photo"
          onKeyDown={(e) => e.key === "Enter" && handleAvatarClick()}
        >
          {user.avatar ? (
            <img src={user.avatar} alt="Profile avatar" className="avatar-img" />
          ) : (
            <span className="avatar-initial">
              {user.username?.charAt(0)?.toUpperCase() || "U"}
            </span>
          )}
          <div className="avatar-upload-overlay" aria-hidden="true">
            <Camera size={20} />
            <span>Change</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
          aria-label="Upload profile photo"
        />
        <h1 className="profile-name">{user.username || "Wildlife Observer"}</h1>
        <p className="profile-bio">
          {user.bio || "Exploring and documenting wildlife around the world"}
        </p>
        <div className="profile-actions">
          <button className="btn btn--outline" onClick={onEditProfile}>
            <Settings size={18} />
            Edit Profile
          </button>
          <button className="btn btn--ghost" onClick={onLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Camera className="stat-icon" size={24} />
          <div className="stat-value">{totalObservations}</div>
          <div className="stat-label">Observations</div>
        </div>
        <div className="stat-card">
          <Award className="stat-icon" size={24} />
          <div className="stat-value">{speciesCount}</div>
          <div className="stat-label">Species Found</div>
        </div>
        <div className="stat-card">
          <MapPin className="stat-icon" size={24} />
          <div className="stat-value">
            {userObservations.filter((obs) => obs.location).length}
          </div>
          <div className="stat-label">Locations</div>
        </div>
      </div>

      <div className="profile-section">
        <h2 className="section-title">
          <Camera size={20} />
          Recent Observations
        </h2>
        {recentObservations.length === 0 ? (
          <div className="empty-observations">
            <Award size={48} />
            <p>No observations yet</p>
            <p className="empty-subtitle">Start scanning wildlife to build your collection!</p>
          </div>
        ) : (
          <div className="observations-grid">
            {recentObservations.map((obs) => (
              <div key={obs.id} className="observation-thumb" onClick={() => onObservationClick?.(obs)}>
                {onDeleteObservation && (
                  <button
                    className="thumb-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Delete this observation?")) onDeleteObservation(obs.id);
                    }}
                    aria-label="Delete observation"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {obs.photo ? (
                  <img src={obs.photo} alt={obs.species} />
                ) : (
                  <div className="no-photo">
                    <Camera size={24} />
                  </div>
                )}
                <div className="thumb-overlay">
                  <span className="thumb-species">{obs.species}</span>
                  {obs.confidence && (
                    <span className="thumb-confidence">{obs.confidence}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profile-section">
        <h2 className="section-title">
          <Award size={20} />
          Achievements
        </h2>
        <div className="achievements-grid">
          <div className={`achievement-badge ${totalObservations >= 1 ? "unlocked" : ""}`}>
            <Camera size={24} />
            <span>First Observer</span>
          </div>
          <div className={`achievement-badge ${speciesCount >= 5 ? "unlocked" : ""}`}>
            <Award size={24} />
            <span>Species Explorer</span>
          </div>
          <div className={`achievement-badge ${totalObservations >= 10 ? "unlocked" : ""}`}>
            <Camera size={24} />
            <span>Active Contributor</span>
          </div>
          <div className={`achievement-badge ${speciesCount >= 20 ? "unlocked" : ""}`}>
            <Award size={24} />
            <span>Wildlife Expert</span>
          </div>
        </div>
      </div>
    </div>
  );
}
