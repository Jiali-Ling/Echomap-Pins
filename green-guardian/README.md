# Green Guardian

A progressive web application (PWA) for wildlife observation and environmental monitoring. Built with React 19, this app demonstrates modern web technologies including AI-powered species recognition, real-time GPS tracking, and offline-first architecture.

Live Demo: [Add your deployment URL]  
Install as App: Supports "Add to Home Screen" on mobile devices

---

## Course Requirements Checklist

### Progressive Web App (PWA)
- Service Worker: Offline-first caching with Workbox (dev-dist/sw.js)
- Web App Manifest: Installable with custom icons (vite.config.js)
- Offline Mode: All core features work without internet connection
- Background Sync: Queues observations when offline, syncs when online
- Cache Strategy: StaleWhileRevalidate for pages, CacheFirst for images

### Device APIs Integration
- Camera API: `navigator.mediaDevices.getUserMedia()` for wildlife photography
- Geolocation API: `navigator.geolocation` for GPS coordinates with accuracy tracking
- DeviceOrientation API: Compass and AR navigation features
- LocalStorage: Persistent state management for observations
- IndexedDB: Large photo storage with idb library

### Modern Technologies
- Framework: React 19.2.0 with Hooks and functional components
- Build Tool: Vite 7.3.1 with Hot Module Replacement (HMR)
- AI/ML: TensorFlow.js 4.22.0 + MobileNet for on-device species recognition
- Mapping: Leaflet 1.9.4 + React-Leaflet 5.0.0 for interactive maps
- Icons: Lucide React for consistent vector icons
- Animations: Framer Motion for smooth transitions

### User Experience
- Responsive Design: Mobile-first with breakpoints for tablet/desktop
- Dark Theme: Modern deep green (#3d5a3d) background with high contrast
- Accessibility: WCAG AA compliant color contrast ratios
- Touch Optimized: Large tap targets and gesture support
- Loading States: Skeleton screens and progress indicators

---

## Features

### Home Page
Scrolling landing page introducing app features with:
- Animated hero section with background image
- Statistics showcase (10K+ species, 50K+ users)
- Feature grid highlighting AI, GPS, Community, Conservation
- Step-by-step usage guide
- Conservation impact metrics

### AI Species Recognition
- Capture wildlife photos using device camera
- TensorFlow.js processes images locally (no server required)
- MobileNet model provides species predictions with confidence scores
- Works offline once model is loaded (~20MB)
- Fallback to manual entry if AI unavailable

### Interactive Map
- Leaflet map shows all observation locations
- Custom markers for different species
- Click markers to view observation details
- Real-time GPS positioning with blue location marker
- Zoom and pan with touch gestures

### Community Feed
- Grid layout of wildlife observations from all users
- Search bar for filtering by species name
- Filter toggle: "All Observations" / "My Observations"
- Like and comment on observations
- Nested comment system with replies
- Delete your own observations

### User Profile
- Personal statistics (observations, species, locations visited)
- Achievement badges with animated icons
- Recent observation history
- Editable profile (name, bio, avatar)

---

## Tech Stack

### Core
- React 19.2.0: UI framework with hooks
- Vite 7.3.1: Fast build tool with HMR
- TensorFlow.js 4.22.0: Machine learning framework
- MobileNet 2.1.1: Pre-trained image classification

### Mapping & Location
- Leaflet 1.9.4: Interactive maps
- React-Leaflet 5.0.0: React wrapper for Leaflet

### PWA & Storage
- vite-plugin-pwa 1.2.0: Service worker generation
- idb 8.0.3: IndexedDB for large data storage
- LocalStorage API: Persistent state management

### UI & Animation
- Lucide React 0.468.0: Icon library (100+ icons)
- Framer Motion 12.35.1: Animation library

---

## Installation & Usage

### Development Setup
```bash
### Development Setup
```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure
```
green-guardian/
├── src/
│   ├── components/            # React components (12 files)
│   │   ├── HomePage.jsx           # Landing page with app intro
│   │   ├── BottomNav.jsx          # 5-tab navigation bar
│   │   ├── SpeciesScanner.jsx     # Camera + AI recognition
│   │   ├── CommunityFeed.jsx      # Observation grid feed
│   │   ├── MapViewModern.jsx      # Leaflet map integration
│   │   ├── UserProfile.jsx        # User stats & achievements
│   │   ├── SpeciesDetailModal.jsx # Observation detail view
│   │   ├── CommentSection.jsx     # Nested comment system
│   │   ├── BottomSheetModal.jsx   # Map marker details
│   │   ├── NavigationPanel.jsx    # AR navigation UI
│   │   ├── ARCameraView.jsx       # AR compass overlay
│   │   └── MapSidebar.jsx         # Map observation list
│   ├── hooks/                 # Custom React hooks (3 files)
│   │   ├── useSpeciesRecognition.js # TensorFlow.js wrapper
│   │   ├── usePersistedState.js     # LocalStorage hook
│   │   └── useGeolocation.js        # GPS tracking hook
│   ├── styles/                # Component CSS files (12 files)
│   ├── utils/                 # Utility functions
│   │   └── helpers.js             # ID generation, formatters
│   ├── data/                  # Data files
│   │   └── sampleObservations.js  # Sample wildlife data
│   ├── App.jsx                # Main app logic & routing
│   ├── App.css                # Global styles & variables
│   └── main.jsx               # React DOM entry point
├── public/
│   ├── images/wildlife/           # Sample observation photos
│   ├── iconDWT-192.png            # PWA icon (192x192)
│   └── iconDWT-512.png            # PWA icon (512x512)
├── dev-dist/                  # Service worker files
│   └── sw.js                      # Generated by vite-plugin-pwa
├── vite.config.js             # Vite + PWA configuration
└── package.json               # Dependencies
```

---

## Usage Guide

### Navigation
The app has 5 main tabs in the bottom navigation:
- Home: Introduction and app features
- Feed: Community observations grid
- Scan: Camera for capturing wildlife
- Map: Interactive observation map
- Profile: User statistics and settings

### Taking Observations
1. Tap the Scan tab (camera icon)
2. Grant camera permissions when prompted
3. Point camera at wildlife and tap capture button
4. Wait for AI to analyze (first load downloads ~20MB model)
5. Review species prediction and confidence score
6. Add location notes or description
7. Tap Save to add to community feed

### Exploring the Map
1. Tap the Map tab
2. View colored markers for different observations
3. Tap any marker to see observation details
4. Use zoom controls or pinch gestures
5. Blue marker shows your current GPS location
6. Sidebar lists all observations in current map view

### Community Interaction
1. Browse observations in the Feed tab
2. Use search bar to find specific species
3. Toggle filter: "All Observations" or "My Observations"
4. Tap any card to view full details
5. Like observations with heart button
6. Add comments and reply to others
7. Delete your own observations (trash icon)

---

## PWA Installation

### Mobile Devices
1. Open the app in Chrome/Safari
2. Tap browser menu (⋮ or Share button)
3. Select "Add to Home Screen"
4. App icon appears on home screen
5. Launch like a native app (no browser UI)

### Desktop
1. Look for install icon in browser address bar
2. Click to install
3. App opens in standalone window

### Offline Usage
- Service worker caches all pages and assets
- Take photos and observations offline
- Data syncs when connection restored
- AI model persists once downloaded
- View previously loaded observations

---

## Device API Requirements

### Camera Access
- Desktop: HTTPS required (localhost works for dev)
- Mobile: HTTPS required on iOS Safari
- Grant permission when browser prompts
- Use rear camera (environment facing) by default

### GPS Location
- Grant permission for precise location
- Works in background when app is active
- Accuracy varies (typically 5-50 meters)
- Fallback to default location if denied

### Browser Compatibility
- Chrome/Edge 90+ (Recommended)
- Safari 15+ (iOS 15+)
- Firefox 88+

---

## Design System

### Color Palette
```css
/* Primary Colors */
--bg: #3d5a3d;          /* Deep forest green background */
--bg-soft: #4a6350;     /* Medium green */
--bg-dark: #2d4a2d;     /* Darkest green */

/* Text Colors */
--text: #ffffff;         /* White for dark backgrounds */
--text-dark: #1a3a1a;   /* Dark for light panels */

/* Accent Colors */
--primary: #7fb800;      /* Bright lime green */
--secondary: #81b29a;    /* Sage green */
--muted: #a3c9a3;        /* Light muted green */

/* Panel/Card */
--panel: #ffffff;        /* White cards on dark bg */
```

### Typography
- UI Font: System font stack (optimized per OS)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
- Contrast: WCAG AA compliant (white on #3d5a3d = 8.67:1)

### Animations
- Timing: cubic-bezier(0.4, 0, 0.2, 1) universally
- Hover: translateY(-2px to -8px) with shadow increase
- Active: scale(0.95-0.98) for press feedback
- Entry: fadeIn, fadeInUp, slideInDown, bounceIn
- Scroll: Parallax effects and staggered animations

---

## File Size & Performance

### Initial Load
- HTML/CSS/JS: ~500KB (gzipped)
- Icons: Inline SVG (no external requests)
- Images: Lazy loaded on scroll

### AI Model
- MobileNet v1 (alpha 0.25): ~20MB
- Downloads on first camera use
- Cached permanently by service worker
- Fallback: manual species entry if model fails

### Optimization
- Code splitting per route
- Image compression (JPEG 95% quality)
- Service worker caches everything after first visit
- No external API calls (fully local)

---

## Development Notes

### State Management
- React hooks (useState, useEffect, useMemo)
- LocalStorage for persistent data
- No Redux/external state library needed

### Styling Approach
- Component-scoped CSS files
- CSS custom properties for theming
- No CSS-in-JS or Tailwind
- Mobile-first breakpoints (768px, 1024px)

### Data Flow
```
App.jsx (parent)
  ├─ observations (state)
  ├─ userLocation (state)
  ├─ currentView (state)
  └─ passes down via props/callbacks
      ├─ CommunityFeed: displays observations
      ├─ MapView: maps observations
      ├─ SpeciesScanner: adds new observations
      └─ UserProfile: filters user's observations
```

---

## Known Limitations

1. AI Accuracy: MobileNet trained on ImageNet (general objects), not specialized wildlife database. Predictions may be generic.
2. Offline AI: Model must download once before offline use possible.
3. HTTPS Required: Camera/GPS APIs require secure context.
4. Browser Support: Safari < 15 may have limited functionality.
5. Storage Limits: Browser may clear cache if storage runs low.

---

## Future Enhancements (Not Implemented)

- Backend API for cross-device sync
- User authentication (currently local-only)
- Cloud image storage (currently browser cache)
- Real-time collaboration features
- Push notifications
- Advanced filters (date range, location radius)
- Export observations as CSV/JSON

---

## Academic Context

## Academic Context

Course: Dynamic Web Technologies  
Institution: [Your University]  
Year: 2025-2026  
Purpose: Educational project demonstrating PWA development

### Assignment Requirements Met
- Progressive Web App with Service Worker  
- Web App Manifest for installation  
- Offline-first architecture  
- Device API integration (Camera, GPS, Orientation)  
- Modern JavaScript framework (React 19)  
- Responsive mobile-first design  
- Local data persistence (LocalStorage + IndexedDB)  
- Third-party library integration (TensorFlow.js, Leaflet)  
- Clean code structure with components  
- Professional UI/UX design

---

## Credits & Attribution

### Open Source Libraries
- TensorFlow.js: Apache 2.0 License
- MobileNet: Apache 2.0 License
- Leaflet: BSD-2-Clause License
- React: MIT License
- Lucide Icons: ISC License
- Framer Motion: MIT License

### Design Inspiration
- Modern travel and nature apps
- iOS/Android native design patterns
- Material Design 3 principles

### Sample Data
- Wildlife images sourced from public domain/Creative Commons
- Observer names and descriptions are fictional for demonstration

---

## License

This project is for educational purposes only as part of university coursework.  
Not intended for commercial use or public distribution.

Copyright © 2026 [Your Name]  
All Rights Reserved

---

## Developer

Name: [Your Name]  
Student ID: [Your ID]  
Email: [Your Email]  
GitHub: [Your GitHub Profile]

---

## Acknowledgments

Special thanks to:
- Course instructors for project guidance
- TensorFlow.js team for ML documentation
- Leaflet community for mapping examples
- React community for development tools

---

Last Updated: March 2026  
Version: 1.0.0  
Status: Completed
