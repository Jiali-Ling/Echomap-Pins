import { Home, Camera, MapPin, User, Sparkles, Leaf, Moon, Sun } from "lucide-react";
import "../styles/BottomNav.css";

export default function BottomNav({ currentView, onNavigate, isDark, onToggleDark }) {
  const navItems = [
    { id: "home", icon: Sparkles, label: "Home" },
    { id: "feed", icon: Home, label: "Feed" },
    { id: "scan", icon: Camera, label: "Scan" },
    { id: "map", icon: MapPin, label: "Map" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="nav-brand" aria-hidden="true">
        <Leaf size={20} />
        <span>Green Guardian</span>
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? "nav-item--active" : ""}`}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}

      {onToggleDark && (
        <button
          className="nav-item nav-dark-toggle"
          onClick={onToggleDark}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={22} /> : <Moon size={22} />}
          <span className="nav-label">{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>
      )}
    </nav>
  );
}
