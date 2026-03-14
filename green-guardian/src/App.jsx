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
  const [lastInsertedId, setLastInsertedId] = useState(null);

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

  const locateObservation = (observationId, coords) => {
    if (!observationId) return;

    setObservations((prevObservations) =>
      prevObservations.map((obs) => {
        if (obs.id === observationId) {
          return {
            ...obs,
            location: coords,
            updatedAt: Date.now(),
          };
        }
        return obs;
      })
    );

    setSelectedObservation((prev) =>
      prev?.id === observationId
        ? {
            ...prev,
            location: coords,
            updatedAt: Date.now(),
          }
        : prev
    );
  };

  const geoFindMe = (observationId = null) => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by your browser");
      error();
    } else {
      console.log("Locating...");
      navigator.geolocation.getCurrentPosition(
        (position) => success(position, observationId),
        (err) => error(err),
        {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
        }
      );
    }
  };

  const success = (position, observationId = null) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    console.log(`Latitude: ${latitude} ° , Longitude: ${longitude} °`);

    console.log(`Latituded:${latitude}, Longitude:${longitude}`);
    console.log(`Try here: https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`);

    const accuracy = Number(position?.coords?.accuracy);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(accuracy) || accuracy <= 0) {
      return;
    }

    const coords = {
      lat: latitude,
      lng: longitude,
      accuracy,
    };

    setUserLocation(coords);

    const targetId = observationId ?? lastInsertedId;
    if (targetId) {
      locateObservation(targetId, coords);
      setLastInsertedId(null);
    }
  };

  const error = () => {
    console.log("Unable to retrieve your exact location");
  };

  useEffect(() => {
    geoFindMe();
  }, []);

  const addObservation = (speciesData) => {
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
      location: speciesData.location ?? null,
      createdAt: now,
      updatedAt: now,
    };

    setObservations((prev) => [newObservation, ...prev]);
    setSelectedObservation(newObservation);
    setLastInsertedId(newObservation.id);
    geoFindMe(newObservation.id);
  };

  const closeObservationDetail = () => {
    setSelectedObservation(null);
    setCurrentView((prev) => (prev === "map" ? "map" : "feed"));
  };

  const closeMapObservationDetail = () => {
    setSelectedObservation(null);
  };

  const likeObservation = (observationId) => {
    setObservations((prev) =>
      prev.map((obs) =>
        obs.id === observationId ? { ...obs, likes: obs.likes + 1 } : obs
      )
    );
  };

  const addObservationComment = (observationId, commentText, parentId = null) => {
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

  const likeObservationComment = (observationId, commentId) => {
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

  const deleteObservationComment = (observationId, commentId) => {
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

  const editUserProfile = () => {
    const newUsername = prompt("Enter your username:", user.username);
    const newBio = prompt("Enter your bio:", user.bio);

    if (newUsername !== null && newUsername.trim() !== "") {
      setUser({ ...user, username: newUsername.trim(), bio: newBio?.trim() || user.bio });
    }
  };

  const logoutUser = () => {
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

  const updateUserAvatar = (avatarDataUrl) => {
    setUser((prev) => ({ ...prev, avatar: avatarDataUrl }));
  };

  const selectObservation = (observation) => {
    setSelectedObservation(observation);
  };

  const deleteObservation = (observationId) => {
    setObservations((prev) => prev.filter((obs) => obs.id !== observationId));
    if (selectedObservation?.id === observationId) {
      setSelectedObservation(null);
    }
  };

  const toggleObservationVisibility = (observationId) => {
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
            onSelectObservation={selectObservation}
            onDeleteObservation={deleteObservation}
            onTogglePublic={toggleObservationVisibility}
          />
        )}

        {currentView === "scan" && (
          <SpeciesScanner
            onCapture={addObservation}
            onCancel={() => setCurrentView("feed")}
          />
        )}

        {currentView === "map" && (
          <MapViewModern
            observations={observations}
            userLocation={userLocation}
            onObservationClick={selectObservation}
            user={user}
          />
        )}

        {currentView === "profile" && (
          <UserProfile
            user={user}
            observations={observations}
            onEditProfile={editUserProfile}
            onLogout={logoutUser}
            onDeleteObservation={deleteObservation}
            onObservationClick={selectObservation}
            onUpdateAvatar={updateUserAvatar}
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
          onClose={closeMapObservationDetail}
          currentUserId={user.id}
          onTogglePublic={toggleObservationVisibility}
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
            onAddComment={addObservationComment}
            onLikeComment={likeObservationComment}
            onDeleteComment={deleteObservationComment}
          />
        </BottomSheetModal>
      ) : selectedObservation ? (
        <SpeciesDetailModal
          observation={selectedObservation}
          onClose={closeObservationDetail}
          currentUserId={user.id}
          onTogglePublic={toggleObservationVisibility}
        >
          <CommentSection
            observationId={selectedObservation.id}
            comments={selectedObservation.comments || []}
            currentUserId={user.id}
            currentUsername={user.username}
            onAddComment={addObservationComment}
            onLikeComment={likeObservationComment}
            onDeleteComment={deleteObservationComment}
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
