import { useState, useEffect } from "react";
import { Moon, Sun, WifiOff } from "lucide-react";
import usePersistedState from "./hooks/usePersistedState";
import BottomNav from "./components/BottomNav";
import HomePage from "./components/HomePage";
import SpeciesScanner from "./components/SpeciesScanner";
import CommunityFeed from "./components/CommunityFeed";
import MapViewModern from "./components/MapViewModern";
import UserProfile from "./components/UserProfile";
import SpeciesDetailModal from "./components/SpeciesDetailModal";
import BottomSheetModal from "./components/BottomSheetModal";
import NavigationPanel from "./components/NavigationPanel";
import CommentSection from "./components/CommentSection";
import "./App.css";
import "./styles/BottomNav.css";
import "./styles/HomePage.css";
import "./styles/SpeciesScanner.css";
import "./styles/CommunityFeed.css";
import "./styles/SpeciesDetailModal.css";
import "./styles/BottomSheetModal.css";
import "./styles/NavigationPanel.css";
import "./styles/ARCameraView.css";
import "./styles/UserProfile.css";
import "./styles/CommentSection.css";
import "./styles/MapView.css";
import "leaflet/dist/leaflet.css";

function createId() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const sampleObservations = [
  {
    id: "sample-1",
    species: "Monarch Butterfly",
    confidence: 96,
    photo: "/images/wildlife/Butterfly.jpg",
    description: "Migration season! Hundreds of monarchs passing through",
    location: { lat: 19.4326, lng: -99.1332 },
    userId: "system",
    username: "ForestGuardian",
    userAvatar: null,
    likes: 203,
    comments: [],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: "sample-2",
    species: "Humpback Whale",
    confidence: 91,
    photo: "/images/wildlife/Cedit%20Jack%20Ashton.jpg",
    description: "Breaching whale spotted during boat tour!",
    location: { lat: 21.3099, lng: -157.8581 },
    userId: "system",
    username: "OceanObserver",
    userAvatar: null,
    likes: 276,
    comments: [],
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: "sample-3",
    species: "Great Blue Heron",
    confidence: 87,
    photo: "/images/wildlife/Goliath_heron_standing_cropped.jpg",
    description: "Patient hunter waiting by the pond",
    location: { lat: 34.0522, lng: -118.2437 },
    userId: "system",
    username: "BirdWatcher101",
    userAvatar: null,
    likes: 67,
    comments: [],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: "sample-4",
    species: "Mountain Goat",
    confidence: 93,
    photo: "/images/wildlife/Hausziege_04.jpg",
    description: "Sure-footed climber on the rocky cliff",
    location: { lat: 46.8721, lng: -113.9940 },
    userId: "system",
    username: "MountainHiker",
    userAvatar: null,
    likes: 184,
    comments: [],
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
  },
  {
    id: "sample-5",
    species: "Red Fox",
    confidence: 89,
    photo: "/images/wildlife/fox.jpg",
    description: "Spotted near the forest edge at dawn",
    location: { lat: 40.7128, lng: -74.0060 },
    userId: "system",
    username: "WildlifeWatcher",
    userAvatar: null,
    likes: 142,
    comments: [],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: "sample-6",
    species: "Bald Eagle",
    confidence: 95,
    photo: "/images/wildlife/eagle.jpg",
    description: "Majestic raptor perched on ancient pine",
    location: { lat: 47.6062, lng: -122.3321 },
    userId: "system",
    username: "SkyWatcher",
    userAvatar: null,
    likes: 312,
    comments: [],
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 8,
  },
];

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [isDark, setIsDark] = usePersistedState("gg_dark_mode", false);
  const [isOnline, setIsOnline] = useState(navigator.onLine ?? true);
  const [observations, setObservations] = usePersistedState(
    "green_guardian_observations",
    sampleObservations
  );
  const [user, setUser] = usePersistedState("green_guardian_user", {
    id: createId(),
    username: "Wildlife Observer",
    bio: "Exploring and documenting wildlife around the world",
    avatar: null,
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
      setObservations(sampleObservations);
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
      id: createId(),
      ...speciesData,
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      likes: 0,
      comments: [],
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
      prev.map((obs) => {
        if (obs.id === observationId) {
          const newComment = {
            id: createId(),
            userId: user.id,
            username: user.username,
            userAvatar: user.avatar,
            text: commentText,
            parentId,
            likes: 0,
            createdAt: Date.now(),
          };
          return {
            ...obs,
            comments: [...(obs.comments || []), newComment],
          };
        }
        return obs;
      })
    );
  };

  const handleCommentLike = (observationId, commentId) => {
    setObservations((prev) =>
      prev.map((obs) => {
        if (obs.id === observationId) {
          return {
            ...obs,
            comments: obs.comments.map((comment) =>
              comment.id === commentId
                ? { ...comment, likes: comment.likes + 1 }
                : comment
            ),
          };
        }
        return obs;
      })
    );
  };

  const handleCommentDelete = (observationId, commentId) => {
    setObservations((prev) =>
      prev.map((obs) => {
        if (obs.id === observationId) {
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
            ...obs,
            comments: filterComments(obs.comments || []),
          };
        }
        return obs;
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
        id: createId(),
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
          onNavigate={(obs) => {
            setNavigationTarget(obs);
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
