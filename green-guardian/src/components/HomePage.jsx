import {
  Camera, MapPin, Users, Award, Leaf, Globe, Sparkles, ArrowRight,
  Shield, TrendingUp, Heart, Zap, CheckCircle, Star, TreePine, Eye
} from "lucide-react";
import "../styles/HomePage.css";

export default function HomePage({ onNavigate }) {

  const features = [
    {
      icon: Camera,
      tag: "AI-Powered",
      title: "Instant Species Recognition",
      description: "Point your camera at any animal or plant. Our deep-learning model identifies the species in under 2 seconds with 98% accuracy.",
      gradient: "linear-gradient(135deg, #7fb800, #5a9e00)"
    },
    {
      icon: MapPin,
      tag: "Real-time",
      title: "Interactive Wildlife Map",
      description: "Explore sightings on a live global map with AR navigation. Filter by species, date, and distance from your location.",
      gradient: "linear-gradient(135deg, #667eea, #4a5bbf)"
    },
    {
      icon: Users,
      tag: "Community",
      title: "Global Citizen Scientists",
      description: "Connect with 50,000+ wildlife enthusiasts across 120+ countries. Share discoveries, discuss observations, and learn together.",
      gradient: "linear-gradient(135deg, #e07a5f, #c45a3f)"
    },
    {
      icon: Shield,
      tag: "Conservation",
      title: "Research & Protection",
      description: "Every observation feeds into conservation databases, helping researchers track endangered species and protect critical habitats.",
      gradient: "linear-gradient(135deg, #81b29a, #5a8e78)"
    }
  ];

  const stats = [
    { value: "10K+", label: "Species Identified", icon: Leaf },
    { value: "50K+", label: "Active Users", icon: Users },
    { value: "200K+", label: "Observations", icon: Globe },
    { value: "98%", label: "AI Accuracy", icon: Sparkles }
  ];

  const steps = [
    {
      number: "01",
      title: "Scan Wildlife",
      description: "Open the camera and point it at any animal or plant you encounter — works in real-time, no internet needed for basic recognition.",
      icon: Camera
    },
    {
      number: "02",
      title: "AI Identifies Instantly",
      description: "Our on-device AI model returns the species name, conservation status, habitat info, and behavioral facts within seconds.",
      icon: Zap
    },
    {
      number: "03",
      title: "Share & Protect",
      description: "Pin your observation on the global map, earn conservation badges, and contribute to biodiversity research worldwide.",
      icon: Heart
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Field Biologist",
      text: "Green Guardian changed how I document fieldwork. The AI accuracy rivals professional identification tools.",
      stars: 5
    },
    {
      name: "James K.",
      role: "Nature Photographer",
      text: "I've identified over 300 species in my backyard alone. The community maps are incredible for finding new sightings.",
      stars: 5
    },
    {
      name: "Priya R.",
      role: "Conservation Student",
      text: "The conservation data this app generates is genuinely used by researchers. My observations matter.",
      stars: 5
    }
  ];

  const galleryItems = [
    { src: "/images/wildlife/eagle.jpg", species: "Bald Eagle", location: "Pacific Northwest, USA" },
    { src: "/images/wildlife/fox.jpg", species: "Red Fox", location: "New York, USA" },
    { src: "/images/wildlife/Butterfly.jpg", species: "Monarch Butterfly", location: "Mexico City, Mexico" },
    { src: "/images/wildlife/Goliath_heron_standing_cropped.jpg", species: "Goliath Heron", location: "Kenya, Africa" },
    { src: "/images/wildlife/Hausziege_04.jpg", species: "Mountain Goat", location: "Rocky Mountains, USA" },
    { src: "/images/wildlife/Cedit%20Jack%20Ashton.jpg", species: "Humpback Whale", location: "Hawaii, USA" }
  ];

  return (
    <div className="home-page">

      {/* ── HERO ── */}
      <section className="hero-section" aria-label="Hero">
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-badge">
            <Leaf size={15} aria-hidden="true" />
            <span>Protecting Wildlife Through Technology</span>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-line">Discover & Protect</span>
            <span className="hero-title-highlight hero-title-line">Wildlife Together</span>
          </h1>

          <p className="hero-description">
            Join 50,000+ nature enthusiasts using AI-powered species recognition
            to identify, track, and protect wildlife across 120+ countries.
          </p>

          <div className="hero-actions">
            <button
              className="btn-hero btn-hero-primary"
              onClick={() => onNavigate('scan')}
              aria-label="Start scanning wildlife"
            >
              <Camera size={20} aria-hidden="true" />
              Start Scanning
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button
              className="btn-hero btn-hero-secondary"
              onClick={() => onNavigate('map')}
              aria-label="Explore wildlife map"
            >
              <MapPin size={20} aria-hidden="true" />
              Explore Map
            </button>
          </div>

          <div className="hero-trust">
            <div className="hero-trust-item">
              <CheckCircle size={15} aria-hidden="true" />
              <span>Free to use</span>
            </div>
            <div className="hero-trust-item">
              <Globe size={15} aria-hidden="true" />
              <span>120+ countries</span>
            </div>
            <div className="hero-trust-item">
              <Shield size={15} aria-hidden="true" />
              <span>Privacy first</span>
            </div>
            <div className="hero-trust-item">
              <TreePine size={15} aria-hidden="true" />
              <span>Works offline</span>
            </div>
          </div>
        </div>

        <div className="hero-image" aria-hidden="true">
          <div className="floating-card floating-card-1">
            <img src="/images/wildlife/Butterfly.jpg" alt="Monarch Butterfly" loading="eager" />
            <div className="card-overlay">
              <span className="species-name">Monarch Butterfly</span>
              <span className="species-meta">Danaus plexippus</span>
            </div>
          </div>
          <div className="floating-card floating-card-2">
            <img src="/images/wildlife/fox.jpg" alt="Red Fox" loading="eager" />
            <div className="card-overlay">
              <span className="species-name">Red Fox</span>
              <span className="species-meta">Vulpes vulpes</span>
            </div>
          </div>
          <div className="floating-card floating-card-3">
            <img src="/images/wildlife/eagle.jpg" alt="Bald Eagle" loading="eager" style={{ objectPosition: 'center 25%' }} />
            <div className="card-overlay">
              <span className="species-name">Bald Eagle</span>
              <span className="species-meta">Haliaeetus leucocephalus</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-section" aria-label="Statistics">
        <div className="stats-container">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="stat-item">
                <Icon className="stat-icon" size={28} aria-hidden="true" />
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── WILDLIFE GALLERY ── */}
      <section className="gallery-section" aria-label="Wildlife gallery">
        <div className="section-header">
          <div className="section-eyebrow">
            <Eye size={14} aria-hidden="true" />
            <span>Community Sightings</span>
          </div>
          <h2 className="section-title">Wildlife in Focus</h2>
          <p className="section-subtitle">Real observations submitted by our global community of citizen scientists</p>
        </div>
        <div className="gallery-grid">
          {galleryItems.map((item, i) => (
            <div
              key={i}
              className="gallery-item"
              onClick={() => onNavigate('feed')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate('feed')}
              aria-label={`View ${item.species} observation`}
            >
              <img src={item.src} alt={item.species} loading="lazy" />
              <div className="gallery-label">
                <span className="gallery-species">{item.species}</span>
                <span className="gallery-location">
                  <MapPin size={11} aria-hidden="true" />
                  {item.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section" aria-label="Features">
        <div className="section-header">
          <div className="section-eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            <span>Capabilities</span>
          </div>
          <h2 className="section-title">Built for the Field</h2>
          <p className="section-subtitle">Professional-grade tools designed for every level of wildlife enthusiast</p>
        </div>
        <div className="features-grid">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrap" style={{ background: feature.gradient }} aria-hidden="true">
                  <Icon size={28} />
                </div>
                <span className="feature-tag">{feature.tag}</span>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-it-works-section" aria-label="How it works">
        <div className="section-header">
          <div className="section-eyebrow">
            <Zap size={14} aria-hidden="true" />
            <span>Getting Started</span>
          </div>
          <h2 className="section-title">Three Steps to Discovery</h2>
          <p className="section-subtitle">Start contributing to global wildlife conservation in under a minute</p>
        </div>
        <div className="steps-container">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="step-item">
                <div className="step-number" aria-hidden="true">{step.number}</div>
                <div className="step-icon-wrap">
                  <Icon size={36} aria-hidden="true" />
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                {i < steps.length - 1 && (
                  <div className="step-connector" aria-hidden="true">
                    <ArrowRight size={22} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials-section" aria-label="Testimonials">
        <div className="section-header">
          <div className="section-eyebrow">
            <Star size={14} aria-hidden="true" />
            <span>Community Voice</span>
          </div>
          <h2 className="section-title">Trusted by Naturalists</h2>
          <p className="section-subtitle">Hear from the people making real conservation impact</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-stars" aria-label={`${t.stars} stars`}>
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={14} fill="currentColor" aria-hidden="true" />
                ))}
              </div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" aria-hidden="true">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── IMPACT ── */}
      <section className="impact-section" aria-label="Conservation impact">
        <div className="impact-content">
          <div className="impact-text">
            <div className="impact-badge">
              <Shield size={14} aria-hidden="true" />
              <span>Conservation Impact</span>
            </div>
            <h2 className="impact-title">
              Your Observations
              <br />
              Make a Real Difference
            </h2>
            <p className="impact-description">
              Every species you identify helps researchers track biodiversity,
              monitor endangered species populations, and advocate for the
              protection of natural habitats. Join our community of citizen
              scientists making a verifiable global impact.
            </p>
          </div>
          <div className="impact-visual">
            <div className="impact-stats impact-stats--panel">
              <div className="impact-stat">
                <TrendingUp size={22} aria-hidden="true" />
                <div>
                  <div className="impact-stat-value">15+</div>
                  <div className="impact-stat-label">Species Brought Back from Brink</div>
                </div>
              </div>
              <div className="impact-stat">
                <Globe size={22} aria-hidden="true" />
                <div>
                  <div className="impact-stat-value">120+</div>
                  <div className="impact-stat-label">Countries with Active Research</div>
                </div>
              </div>
              <div className="impact-stat">
                <Award size={22} aria-hidden="true" />
                <div>
                  <div className="impact-stat-value">40+</div>
                  <div className="impact-stat-label">Partner Universities & NGOs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" aria-label="Call to action">
        <div className="cta-bg" aria-hidden="true" />
        <div className="cta-content">
          <div className="cta-eyebrow">
            <Leaf size={14} aria-hidden="true" />
            <span>Join the Movement</span>
          </div>
          <h2 className="cta-title">Ready to Start Your Journey?</h2>
          <p className="cta-description">
            Join 50,000+ citizen scientists and help protect wildlife for future generations.
            Every observation counts.
          </p>
          <div className="cta-actions">
            <button
              className="btn-cta btn-cta-primary"
              onClick={() => onNavigate('scan')}
              aria-label="Start scanning wildlife now"
            >
              <Camera size={20} aria-hidden="true" />
              Start Scanning Now
            </button>
            <button
              className="btn-cta btn-cta-secondary"
              onClick={() => onNavigate('feed')}
              aria-label="Join the community"
            >
              <Users size={20} aria-hidden="true" />
              Join Community
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
