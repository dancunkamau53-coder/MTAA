import { useState, useEffect } from "react";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import PropertyDetails from "./PropertyDetails";
import { getProperties } from "./services/api";
import "./App.css";

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  // ===============================
  // USER
  // ===============================

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("mtaa_user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  // ===============================
  // PROPERTIES
  // ===============================

  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState("");

  // ===============================
  // LOAD PROPERTIES FROM BACKEND
  // ===============================

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoadingProperties(true);
        setPropertyError("");

        const data = await getProperties();

        setProperties(data.properties || []);
      } catch (error) {
        console.error(
          "Failed to load properties:",
          error
        );

        setPropertyError(
          "Unable to load properties."
        );
      } finally {
        setLoadingProperties(false);
      }
    };

    loadProperties();
  }, []);

  // ===============================
  // AUTH
  // ===============================

  const openAuth = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("mtaa_token");
    localStorage.removeItem("mtaa_user");

    setUser(null);
    setShowAuth(false);
    setAuthMode("login");
    setSelectedPropertyId(null);
  };

  // ===============================
  // LOGGED-IN USER
  // ===============================

  if (user) {
    if (selectedPropertyId) {
      return (
        <PropertyDetails
          propertyId={selectedPropertyId}
          onBack={() =>
            setSelectedPropertyId(null)
          }
        />
      );
    }

    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        onViewProperty={(propertyId) => {
          setSelectedPropertyId(propertyId);
        }}
      />
    );
  }

  // ===============================
  // AUTH SCREEN
  // ===============================

  if (showAuth) {
    return (
      <Auth
        onLogin={handleLogin}
        initialMode={authMode}
      />
    );
  }

  // ===============================
  // PUBLIC MTAA HOMEPAGE
  // ===============================

  return (
    <div className="mtaa-app">

      {/* ===============================
          NAVBAR
      =============================== */}

      <header className="navbar">

        <div className="logo">
          <span>MTAA</span>
        </div>

        <nav className="nav-links">
          <a href="#home">
            Home
          </a>

          <a href="#properties">
            Properties
          </a>

          <a href="#hostels">
            Hostels
          </a>

          <a href="#services">
            Services
          </a>
        </nav>

        <div className="nav-actions">

          <button
            className="login-btn"
            onClick={() =>
              openAuth("login")
            }
          >
            Login
          </button>

          <button
            className="signup-btn"
            onClick={() =>
              openAuth("register")
            }
          >
            Create Account
          </button>

        </div>

      </header>

      <main>

        {/* ===============================
            HERO SECTION
        =============================== */}

        <section
          className="hero"
          id="home"
        >

          <div className="hero-content">

            <p className="hero-label">
              WELCOME TO MTAA
            </p>

            <h1>
              Find a place.
              <br />
              Find your{" "}
              <span>
                community.
              </span>
            </h1>

            <p className="hero-description">
              Discover houses, apartments,
              hostels, commercial spaces and
              useful services around you —
              all in one platform.
            </p>

            <div className="search-box">

              <div className="search-field">

                <span className="search-icon">
                  ⌕
                </span>

                <div>

                  <small>
                    WHAT ARE YOU LOOKING FOR?
                  </small>

                  <input
                    type="text"
                    placeholder="Search houses, hostels, apartments..."
                  />

                </div>

              </div>

              <div className="location-field">

                <span>
                  📍
                </span>

                <div>

                  <small>
                    LOCATION
                  </small>

                  <input
                    type="text"
                    placeholder="Kasarani, Nairobi"
                  />

                </div>

              </div>

              <button className="search-btn">
                Search
              </button>

            </div>

          </div>

        </section>

        {/* ===============================
            PROPERTIES SECTION
        =============================== */}

        <section
          className="properties-section"
          id="properties"
        >

          <div className="section-heading">

            <div>

              <p className="section-label">
                AVAILABLE PROPERTIES
              </p>

              <h2>
                Find your next home.
              </h2>

            </div>

            <p>
              Explore real properties
              currently available on MTAA.
            </p>

          </div>

          {/* LOADING */}

          {loadingProperties && (
            <div className="properties-message">
              Loading properties...
            </div>
          )}

          {/* ERROR */}

          {propertyError && (
            <div className="properties-message error">
              {propertyError}
            </div>
          )}

          {/* NO PROPERTIES */}

          {!loadingProperties &&
            !propertyError &&
            properties.length === 0 && (
              <div className="properties-message">
                No properties available yet.
              </div>
            )}

          {/* PROPERTY GRID */}

          <div className="property-grid">

            {properties.map((property) => (

              <div
                className="property-card"
                key={property.id}
              >

                {/* PROPERTY IMAGE */}

                <div className="property-image">

                  {property.imageUrl ? (

                    <img
                      src={property.imageUrl}
                      alt={property.title}
                    />

                  ) : (

                    <div className="property-placeholder">
                      🏠
                    </div>

                  )}

                </div>

                {/* PROPERTY INFORMATION */}

                <div className="property-info">

                  <p className="property-location">
                    📍 {property.location}
                  </p>

                  <h3>
                    {property.title}
                  </h3>

                  <p className="property-description">
                    {property.description ||
                      "No description provided."}
                  </p>

                  {/* DETAILS */}

                  <div className="property-details">

                    <span>
                      🛏️{" "}
                      {property.bedrooms}{" "}
                      bedrooms
                    </span>

                    <span>
                      🚿{" "}
                      {property.bathrooms}{" "}
                      bathrooms
                    </span>

                  </div>

                  {/* PRICE + BUTTON */}

                  <div className="property-bottom">

                    <strong>
                      KSh{" "}
                      {Number(
                        property.price
                      ).toLocaleString()}
                    </strong>

                    <button
                      onClick={() =>
                        setSelectedPropertyId(
                          property.id
                        )
                      }
                    >
                      View Property
                    </button>

                  </div>

                  {/* OWNER */}

                  {property.owner && (
                    <div className="property-owner">

                      <small>
                        Listed by{" "}

                        <strong>
                          {property.owner.name}
                        </strong>

                      </small>

                    </div>
                  )}

                </div>

              </div>

            ))}

          </div>

        </section>

        {/* ===============================
            CATEGORIES
        =============================== */}

        <section
          className="categories"
          id="services"
        >

          <div className="section-heading">

            <div>

              <p className="section-label">
                EXPLORE MTAA
              </p>

              <h2>
                Everything you need,
                <br />
                in one place.
              </h2>

            </div>

            <p>
              MTAA connects people with
              places, properties and services
              in their community.
            </p>

          </div>

          <div className="category-grid">

            {/* HOUSES */}

            <div className="category-card">

              <div className="category-icon">
                🏠
              </div>

              <h3>
                Houses & Apartments
              </h3>

              <p>
                Find your next home from
                verified properties around
                your community.
              </p>

            </div>

            {/* HOSTELS */}

            <div
              className="category-card"
              id="hostels"
            >

              <div className="category-icon">
                🏨
              </div>

              <h3>
                Hostels
              </h3>

              <p>
                Discover hostels and student
                accommodation close to where
                you need.
              </p>

            </div>

            {/* COMMERCIAL */}

            <div className="category-card">

              <div className="category-icon">
                🏢
              </div>

              <h3>
                Commercial Spaces
              </h3>

              <p>
                Find shops, offices,
                businesses and other
                commercial spaces.
              </p>

            </div>

            {/* SERVICES */}

            <div className="category-card">

              <div className="category-icon">
                🛠️
              </div>

              <h3>
                Local Services
              </h3>

              <p>
                Discover useful services
                and businesses around you.
              </p>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;