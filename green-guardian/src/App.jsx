import { useState, useEffect } from "react";
import { Moon, Sun, WifiOff } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { nanoid } from "nanoid";
import { sampleObservations, defaultUser } from "./data/sampleObservations";
import BottomNav from "./components/BottomNav";
import BottomSheetModal from "./components/BottomSheetModal";
import CommentSection from "./components/CommentSection";
import CommunityFeed from "./components/CommunityFeed";
import HomePage from "./components/HomePage";
import MapViewModern from "./components/MapViewModern";
import NavigationPanel from "./components/NavigationPanel";
import SpeciesDetailModal from "./components/SpeciesDetailModal";
import SpeciesScanner from "./components/SpeciesScanner";
import UserProfile from "./components/UserProfile";
import "./App.css";
import "./styles/BottomNav.css";
import "./styles/BottomSheetModal.css";
import "./styles/CommentSection.css";
import "./styles/CommunityFeed.css";
import "./styles/HomePage.css";
import "./styles/MapView.css";
import "./styles/NavigationPanel.css";
import "./styles/SpeciesDetailModal.css";
import "./styles/SpeciesScanner.css";
import "./styles/UserProfile.css";

function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {}
  }, [key, state]);

  return [state, setState];
}

const normalizeObservation = (observation) => ({
  ...observation,
  comments: Array.isArray(observation?.comments) ? observation.comments : [],
  isPublic: observation?.isPublic !== false,
});

const normalizeObservations = (observations) => {
  if (!Array.isArray(observations)) {
    return sampleObservations.map(normalizeObservation);
  }
  return observations.map(normalizeObservation);
};

const needsObservationNormalization = (observations) =>
  Array.isArray(observations) && observations.some(
    (observation) =>
      !Array.isArray(observation?.comments) ||
      observation?.isPublic === undefined
  );

export default function App({ initialObservations }) {
  const [currentView, setCurrentView] = useState("home");
  const [isDark, setIsDark] = usePersistedState("gg_dark_mode", false);
  const [isOnline, setIsOnline] = useState(navigator.onLine ?? true);
  const [observations, setObservations] = usePersistedState(
    "green_guardian_observations",
    normalizeObservations(initialObservations ?? sampleObservations)
  );
  const [user, setUser] = usePersistedState("green_guardian_user", {
    ...defaultUser,
    id: nanoid(),
  });
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [navigationTarget, setNavigationTarget] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (observations.length === 0) {
      setObservations(normalizeObservations(initialObservations ?? sampleObservations));
      return;
    }

    if (needsObservationNormalization(observations)) {
      setObservations((prev) => normalizeObservations(prev));
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        setUserLocation({
          lat: 40.7128,
          lng: -74.0060,
          accuracy: 0,
        });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const handleCapture = (speciesData) => {
    const now = Date.now();
    const newObservation = {
      id: nanoid(),
      ...speciesData,
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      likes: 0,
      comments: [],
      isPublic: true,
      createdAt: now,
      updatedAt: now,
    };

    setObservations((prev) => [newObservation, ...prev]);
    setSelectedObservation(newObservation);
  };

  const handleCloseDetail = () => {
    setSelectedObservation(null);
    setCurrentView("feed");
  };

  const handleLike = (observationId) => {
    setObservations((prev) =>
      prev.map((obs) =>
        obs.id === observationId ? { ...obs, likes: obs.likes + 1 } : obs
      )
    );
  };

  const handleComment = (observationId, commentText, parentId = null) => {
    setObservations((prev) =>
      prev.map((observation) => {
        if (observation.id === observationId) {
          const newComment = {
            id: nanoid(),
            userId: user.id,
            username: user.username,
            userAvatar: user.avatar,
            text: commentText,
            parentId,
            likes: 0,
            createdAt: Date.now(),
          };
          return {
            ...observation,
            comments: [...(observation.comments || []), newComment],
          };
        }
        return observation;
      })
    );
  };

  const handleCommentLike = (observationId, commentId) => {
    setObservations((prev) =>
      prev.map((observation) => {
        if (observation.id === observationId) {
          return {
            ...observation,
            comments: observation.comments.map((comment) =>
              comment.id === commentId
                ? { ...comment, likes: comment.likes + 1 }
                : comment
            ),
          };
        }
        return observation;
      })
    );
  };

  const handleCommentDelete = (observationId, commentId) => {
    setObservations((prev) =>
      prev.map((observation) => {
        if (observation.id === observationId) {
          const filterComments = (comments) =>
            comments
              .filter((comment) => comment.id !== commentId)
              .map((comment) => {
                if (comment.replies) {
                  return { ...comment, replies: filterComments(comment.replies) };
                }
                return comment;
              });

          return {
            ...observation,
            comments: filterComments(observation.comments || []),
          };
        }
        return observation;
      })
    );
  };

  const handleEditProfile = () => {
    const newUsername = prompt("Enter your username:", user.username);
    const newBio = prompt("Enter your bio:", user.bio);

    if (newUsername !== null && newUsername.trim() !== "") {
      setUser({ ...user, username: newUsername.trim(), bio: newBio?.trim() || user.bio });
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      setUser({
        id: nanoid(),
        username: "Wildlife Observer",
        bio: "Exploring and documenting wildlife around the world",
        avatar: null,
      });
      setObservations([]);
      setCurrentView("feed");
    }
  };

  const handleUpdateAvatar = (avatarDataUrl) => {
    setUser((prev) => ({ ...prev, avatar: avatarDataUrl }));
  };

  const handleObservationClick = (observation) => {
    setSelectedObservation(observation);
  };

  const handleDeleteObservation = (observationId) => {
    setObservations((prev) => prev.filter((obs) => obs.id !== observationId));
    if (selectedObservation?.id === observationId) {
      setSelectedObservation(null);
    }
  };

  const handleTogglePublic = (observationId) => {
    setObservations((prev) =>
      prev.map((observation) =>
        observation.id === observationId ? { ...observation, isPublic: !observation.isPublic } : observation
      )
    );
  };

  return (
    <div className="app-container">
      {!isOnline && (
        <div className="offline-banner" role="alert">
          <WifiOff size={16} />
          <span>You're offline — changes will sync when reconnected</span>
        </div>
      )}
      <div className="view-container">
        {currentView === "home" && (
          <HomePage onNavigate={setCurrentView} />
        )}

        {currentView === "feed" && (
          <CommunityFeed
            observations={observations}
            currentUserId={user.id}
            onSelectObservation={handleObservationClick}
            onDeleteObservation={handleDeleteObservation}
            onTogglePublic={handleTogglePublic}
          />
        )}

        {currentView === "scan" && (
          <SpeciesScanner
            onCapture={handleCapture}
            onCancel={() => setCurrentView("feed")}
          />
        )}

        {currentView === "map" && (
          <MapViewModern
            observations={observations}
            userLocation={userLocation}
            onObservationClick={handleObservationClick}
            user={user}
          />
        )}

        {currentView === "profile" && (
          <UserProfile
            user={user}
            observations={observations}
            onEditProfile={handleEditProfile}
            onLogout={handleLogout}
            onDeleteObservation={handleDeleteObservation}
            onObservationClick={handleObservationClick}
            onUpdateAvatar={handleUpdateAvatar}
          />
        )}
      </div>

      <BottomNav
        currentView={currentView}
        onNavigate={setCurrentView}
        isDark={isDark}
        onToggleDark={() => setIsDark(d => !d)}
      />
      <button
        className="mobile-dark-toggle"
        onClick={() => setIsDark(d => !d)}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {selectedObservation && currentView === "map" ? (
        <BottomSheetModal
          observation={selectedObservation}
          onClose={handleCloseDetail}
          currentUserId={user.id}
          onTogglePublic={handleTogglePublic}
          onNavigate={(observation) => {
            setNavigationTarget(observation);
            setSelectedObservation(null);
          }}
        >
          <CommentSection
            observationId={selectedObservation.id}
            comments={selectedObservation.comments || []}
            currentUserId={user.id}
            currentUsername={user.username}
            onAddComment={handleComment}
            onLikeComment={handleCommentLike}
            onDeleteComment={handleCommentDelete}
          />
        </BottomSheetModal>
      ) : selectedObservation ? (
        <SpeciesDetailModal
          observation={selectedObservation}
          onClose={handleCloseDetail}
          currentUserId={user.id}
          onTogglePublic={handleTogglePublic}
        >
          <CommentSection
            observationId={selectedObservation.id}
            comments={selectedObservation.comments || []}
            currentUserId={user.id}
            currentUsername={user.username}
            onAddComment={handleComment}
            onLikeComment={handleCommentLike}
            onDeleteComment={handleCommentDelete}
          />
        </SpeciesDetailModal>
      ) : null}

      {navigationTarget && (
        <NavigationPanel
          observation={navigationTarget}
          onClose={() => setNavigationTarget(null)}
        />
      )}
    </div>
  );
}
