import { useState, useEffect, useMemo } from "react";

import Auth from "./Auth";
import Dashboard from "./Dashboard";
import PropertyDetails from "./PropertyDetails";
import SavedProperties from "./SavedProperties";
import Payments from "./Payments";
import Notifications from "./Notifications";
import AdminDashboard from "./AdminDashboard";
import Services from "./Services";
import MyProperties from "./MyProperties";
import Profile from "./Profile";

import {
  getProperties,
  getCurrentUser,
} from "./services/api";

import "./App.css";

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authInitialRole, setAuthInitialRole] = useState("USER");
  const [pendingServiceId, setPendingServiceId] = useState("");

  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [currentView, setCurrentView] = useState("dashboard");
  const [dashboardSection, setDashboardSection] = useState("overview");
  const [returnView, setReturnView] = useState("dashboard");

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("mtaa_user");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Failed to load saved user:", error);

      localStorage.removeItem("mtaa_user");
      localStorage.removeItem("mtaa_token");

      return null;
    }
  });

  const [authChecking, setAuthChecking] = useState(() => {
    return Boolean(localStorage.getItem("mtaa_token"));
  });

  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState("");
  const [propertyLoadAttempt, setPropertyLoadAttempt] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [minBathrooms, setMinBathrooms] = useState("");
  const [minParking, setMinParking] = useState("");
  const [furnishedFilter, setFurnishedFilter] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("mtaa_token");

    if (!token) {
      setAuthChecking(false);
      return;
    }

    let mounted = true;

    const restoreSession = async () => {
      try {
        const data = await getCurrentUser(token);

        if (!mounted) {
          return;
        }

        if (!data?.user) {
          throw new Error("Invalid session");
        }

        setUser(data.user);

        localStorage.setItem(
          "mtaa_user",
          JSON.stringify(data.user)
        );
      } catch (error) {
        console.error("Session validation failed:", error);

        if (!mounted) {
          return;
        }

        localStorage.removeItem("mtaa_token");
        localStorage.removeItem("mtaa_user");

        setUser(null);
      } finally {
        if (mounted) {
          setAuthChecking(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoadingProperties(true);
        setPropertyError("");

        const filters = {};

        /*
         * GENERAL PROPERTY SEARCH
         * Sends searches such as:
         * - House in Kasarani
         * - Apartment in Ruiru
         * - Hostel near KU
         */
        if (searchQuery.trim() !== "") {
          filters.search = searchQuery.trim();
        }

        if (locationQuery.trim() !== "") {
          filters.location = locationQuery.trim();
        }

        if (propertyTypeFilter !== "") {
          filters.propertyType = propertyTypeFilter;
        }

        if (minPrice !== "") {
          filters.minPrice = minPrice;
        }

        if (maxPrice !== "") {
          filters.maxPrice = maxPrice;
        }

        if (minBedrooms !== "") {
          filters.bedrooms = minBedrooms;
        }

        if (minBathrooms !== "") {
          filters.bathrooms = minBathrooms;
        }

        if (minParking !== "") {
          filters.parking = minParking;
        }

        if (furnishedFilter !== "") {
          filters.furnished = furnishedFilter;
        }

        console.log("MTAA property filters:", filters);

        const data = await getProperties(filters);

        setProperties(
          Array.isArray(data?.properties)
            ? data.properties
            : []
        );
      } catch (error) {
        console.error("Failed to load properties:", error);

        setPropertyError(
          error?.message ||
            "We couldn't load listings. The service may be temporarily unavailable."
        );
      } finally {
        setLoadingProperties(false);
      }
    };

    loadProperties();
  }, [
    propertyLoadAttempt,
    searchQuery,
    locationQuery,
    propertyTypeFilter,
    minPrice,
    maxPrice,
    minBedrooms,
    minBathrooms,
    minParking,
    furnishedFilter,
  ]);

  /*
   * Search is now handled by the backend.
   *
   * We intentionally do not run the old local phrase
   * filtering here because a search such as:
   *
   * "House in Kasarani"
   *
   * should be interpreted as multiple search terms
   * by the backend rather than requiring the complete
   * phrase to exist inside one property field.
   */
  const filteredProperties = useMemo(() => {
    return properties;
  }, [properties]);

  const clearFilters = () => {
    setSearchQuery("");
    setLocationQuery("");
    setPropertyTypeFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMinBedrooms("");
    setMinBathrooms("");
    setMinParking("");
    setFurnishedFilter("");
  };

  const handleCategoryJump = (category) => {
    if (category === "Houses & Apartments") {
      setPropertyTypeFilter("House");
    }

    if (category === "Hostels") {
      setPropertyTypeFilter("Hostel");
    }

    if (category === "Commercial Spaces") {
      setPropertyTypeFilter("Commercial");
    }

    if (category === "Local Services") {
      setCurrentView("services");
      return;
    }

    setTimeout(() => {
      document
        .getElementById("properties")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 80);
  };

  const nearbyServiceCards = useMemo(() => {
    const baseLocation = locationQuery.trim() || "Nairobi";

    return [
      {
        icon: "🏥",
        title: "Hospitals",
        description:
          "Urgent care and clinics close to your target area.",
        distance:
          baseLocation === "Nairobi"
            ? "1.2 km"
            : "2.4 km",
      },
      {
        icon: "🏫",
        title: "Schools",
        description:
          "Nearby campuses and learning centers for families.",
        distance:
          baseLocation === "Nairobi"
            ? "850 m"
            : "1.7 km",
      },
      {
        icon: "🛒",
        title: "Shopping",
        description:
          "Groceries, essentials, and local markets in reach.",
        distance:
          baseLocation === "Nairobi"
            ? "600 m"
            : "1.1 km",
      },
      {
        icon: "🚌",
        title: "Transit",
        description:
          "Public transport and commuter routes nearby.",
        distance:
          baseLocation === "Nairobi"
            ? "400 m"
            : "900 m",
      },
    ];
  }, [locationQuery]);

  const neighborhoodHighlights = useMemo(
    () => [
      {
        name: "Kasarani",
        vibe:
          "Fast-growing, close to transport and retail",
        price: "KSh 18k - 32k",
      },
      {
        name: "Westlands",
        vibe:
          "Upscale homes and strong lifestyle access",
        price: "KSh 35k - 65k",
      },
      {
        name: "Ruiru",
        vibe:
          "Family-friendly apartments and community spaces",
        price: "KSh 15k - 28k",
      },
      {
        name: "Nairobi CBD",
        vibe:
          "Walkable urban living with strong business access",
        price: "KSh 22k - 45k",
      },
    ],
    []
  );

  const openAuth = (mode, role = "USER") => {
    setAuthMode(mode);
    setAuthInitialRole(role);
    setShowAuth(true);
  };

  const startPropertyListing = () => {
    setDashboardSection("add-property");
    openAuth("register");
  };

  const handleServiceAuth = (serviceId) => {
    if (serviceId) {
      setPendingServiceId(serviceId);
      setCurrentView("services");
      openAuth("login");
      return;
    }

    setCurrentView("serviceProvider");
    openAuth("register", "SERVICE_PROVIDER");
  };

  const handleServiceLogin = () => {
    setCurrentView("services");
    openAuth("login");
  };

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setShowAuth(false);
    setAuthChecking(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("mtaa_token");
    localStorage.removeItem("mtaa_user");

    setUser(null);
    setShowAuth(false);
    setAuthMode("login");
    setSelectedPropertyId(null);
    setCurrentView("dashboard");
    setDashboardSection("overview");
    setReturnView("dashboard");
    setPendingServiceId("");
    setAuthChecking(false);
  };

  const openProperty = (
    propertyId,
    fromView = "dashboard"
  ) => {
    setSelectedPropertyId(propertyId);
    setReturnView(fromView);
  };

  if (authChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f8f6",
          padding: "24px",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "32px",
              fontWeight: "800",
              marginBottom: "12px",
            }}
          >
            MTAA
          </div>

          <p>
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    if (selectedPropertyId) {
      return (
        <PropertyDetails
          propertyId={selectedPropertyId}
          onBack={() => {
            setSelectedPropertyId(null);
            setCurrentView(returnView);
          }}
        />
      );
    }

    if (user.role === "ADMIN") {
      return (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
        />
      );
    }

    if (
      currentView === "services" ||
      currentView === "serviceProvider"
    ) {
      return (
        <Services
          user={user}
          initialTab={
            currentView === "serviceProvider"
              ? "provider"
              : "directory"
          }
          initialServiceId={pendingServiceId}
          onBack={() => {
            setPendingServiceId("");
            setCurrentView("dashboard");
          }}
          onRequireAuth={handleServiceAuth}
          onRequireLogin={handleServiceLogin}
        />
      );
    }

    if (currentView === "myProperties") {
      return (
        <MyProperties
          user={user}
          onBack={() => {
            setCurrentView("profile");
          }}
          onOpenProperty={(propertyId) => {
            openProperty(
              propertyId,
              "myProperties"
            );
          }}
        />
      );
    }

    if (currentView === "savedProperties") {
      return (
        <SavedProperties
          onBack={() => {
            setCurrentView("dashboard");
          }}
          onViewProperty={(propertyId) => {
            openProperty(
              propertyId,
              "savedProperties"
            );
          }}
        />
      );
    }

    if (currentView === "profile") {
      return (
        <Profile
          user={user}
          onBack={() => {
            setCurrentView("dashboard");
            setDashboardSection("overview");
          }}
          onOpenSavedProperties={() => {
            setCurrentView("savedProperties");
          }}
          onOpenMyProperties={() => {
            setCurrentView("myProperties");
          }}
          onOpenPayments={() => {
            setCurrentView("payments");
          }}
          onOpenNotifications={() => {
            setCurrentView("notifications");
          }}
        />
      );
    }

    if (currentView === "payments") {
      return (
        <Payments
          user={user}
          onBack={() => {
            setCurrentView("dashboard");
            setDashboardSection("overview");
          }}
          onOpenProfile={() => {
            setCurrentView("profile");
          }}
        />
      );
    }

    if (currentView === "notifications") {
      return (
        <Notifications
          user={user}
          onBack={() => {
            setCurrentView("dashboard");
            setDashboardSection("overview");
          }}
          onOpenProfile={() => {
            setCurrentView("profile");
          }}
        />
      );
    }

    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialSection={dashboardSection}
        onViewProperty={(propertyId) => {
          openProperty(
            propertyId,
            "dashboard"
          );
        }}
        onOpenSavedProperties={() => {
          setCurrentView("savedProperties");
        }}
        onOpenProfile={() => {
          setCurrentView("profile");
        }}
        onOpenPayments={() => {
          setCurrentView("payments");
        }}
        onOpenNotifications={() => {
          setCurrentView("notifications");
        }}
      />
    );
  }

  if (showAuth) {
    return (
      <Auth
        onLogin={handleLogin}
        initialMode={authMode}
        initialRole={authInitialRole}
      />
    );
  }

  if (currentView === "services") {
    return (
      <Services
        user={null}
        onBack={() => {
          setCurrentView("dashboard");
        }}
        onRequireAuth={handleServiceAuth}
        onRequireLogin={handleServiceLogin}
      />
    );
  }

  return (
    <div className="mtaa-app">
      <header className="navbar">
        <div className="logo">
          <span>MTAA</span>
        </div>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#properties">Properties</a>
          <a href="#hostels">Hostels</a>
          <a href="#services">Services</a>
        </nav>

        <div className="nav-actions">
          <button
            className="list-property-btn"
            onClick={startPropertyListing}
          >
            List your property
          </button>

          <button
            className="login-btn"
            onClick={() => {
              openAuth("login");
            }}
          >
            Login
          </button>

          <button
            className="signup-btn"
            onClick={() => {
              openAuth("register");
            }}
          >
            Create Account
          </button>
        </div>
      </header>

      <main>
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
              <span>community.</span>
            </h1>

            <p className="hero-description">
              Discover houses, apartments,
              hostels, commercial spaces and
              useful services around you —
              all in one platform.
            </p>

            <form
              className="search-box"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
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
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(
                        event.target.value
                      );
                    }}
                    placeholder="Search houses, hostels, apartments..."
                  />
                </div>
              </div>

              <div className="location-field">
                <span>📍</span>

                <div>
                  <small>LOCATION</small>

                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(event) => {
                      setLocationQuery(
                        event.target.value
                      );
                    }}
                    placeholder="Kasarani, Nairobi"
                  />
                </div>
              </div>

              <button
                type="button"
                className="search-btn"
                onClick={() => {
                  document
                    .getElementById("properties")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }}
              >
                Search
              </button>
            </form>

            <button
              type="button"
              className="hero-list-property-btn"
              onClick={startPropertyListing}
            >
              List your property{" "}
              <span aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </section>

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

          <div className="filter-panel">
            <div className="filter-group">
              <label>Property Type</label>

              <select
                value={propertyTypeFilter}
                onChange={(event) => {
                  setPropertyTypeFilter(
                    event.target.value
                  );
                }}
              >
                <option value="">
                  Any type
                </option>

                <option value="Apartment">
                  Apartment
                </option>

                <option value="House">
                  House
                </option>

                <option value="Bedsitter">
                  Bedsitter
                </option>

                <option value="Hostel">
                  Hostel
                </option>

                <option value="Studio">
                  Studio
                </option>

                <option value="Commercial">
                  Commercial
                </option>
              </select>
            </div>

            <div className="filter-group">
              <label>Min Price</label>

              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => {
                  setMinPrice(
                    event.target.value
                  );
                }}
                placeholder="KSh"
              />
            </div>

            <div className="filter-group">
              <label>Max Price</label>

              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => {
                  setMaxPrice(
                    event.target.value
                  );
                }}
                placeholder="KSh"
              />
            </div>

            <div className="filter-group">
              <label>Bedrooms</label>

              <input
                type="number"
                min="0"
                value={minBedrooms}
                onChange={(event) => {
                  setMinBedrooms(
                    event.target.value
                  );
                }}
                placeholder="2+"
              />
            </div>

            <div className="filter-group">
              <label>Bathrooms</label>

              <input
                type="number"
                min="0"
                value={minBathrooms}
                onChange={(event) => {
                  setMinBathrooms(
                    event.target.value
                  );
                }}
                placeholder="1+"
              />
            </div>

            <div className="filter-group">
              <label>Parking</label>

              <input
                type="number"
                min="0"
                value={minParking}
                onChange={(event) => {
                  setMinParking(
                    event.target.value
                  );
                }}
                placeholder="1+"
              />
            </div>

            <div className="filter-group">
              <label>Furnished</label>

              <select
                value={furnishedFilter}
                onChange={(event) => {
                  setFurnishedFilter(event.target.value);
                }}
              >
                <option value="">Any</option>
                <option value="true">Furnished</option>
                <option value="false">Unfurnished</option>
              </select>
            </div>

            <div className="filter-actions">
              <button
                type="button"
                className="filter-clear-btn"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          </div>

          {loadingProperties && (
            <div className="properties-message">
              Loading properties...
            </div>
          )}

          {propertyError && (
            <div className="properties-message error">
              <p>{propertyError}</p>

              <button
                type="button"
                className="property-retry-btn"
                onClick={() => {
                  setPropertyLoadAttempt(
                    (attempt) => attempt + 1
                  );
                }}
              >
                Try again
              </button>
            </div>
          )}

          {!loadingProperties &&
            !propertyError &&
            filteredProperties.length > 0 && (
              <div className="properties-result-count">
                Showing{" "}
                {filteredProperties.length}{" "}
                properties
              </div>
            )}

          {!loadingProperties &&
            !propertyError &&
            filteredProperties.length === 0 && (
              <div className="properties-message">
                No properties match your
                search filters.
              </div>
            )}

          <div className="property-grid">
            {filteredProperties.map(
              (property) => (
                <div
                  className="property-card"
                  key={property.id}
                >
                  <div className="property-image">
                    {property.imageUrl ? (
                      <img
                        src={property.imageUrl}
                        alt={
                          property.title ||
                          "Property"
                        }
                      />
                    ) : (
                      <div className="property-placeholder">
                        🏠
                      </div>
                    )}
                  </div>

                  <div className="property-info">
                    <p className="property-location">
                      📍{" "}
                      {property.location ||
                        "Location unavailable"}
                    </p>

                    <h3>
                      {property.title ||
                        "Untitled Property"}
                    </h3>

                    <p className="property-description">
                      {property.description ||
                        "No description provided."}
                    </p>

                    <div className="property-details">
                      <span>
                        🛏️{" "}
                        {property.bedrooms ?? 0}{" "}
                        bedrooms
                      </span>

                      <span>
                        🚿{" "}
                        {property.bathrooms ?? 0}{" "}
                        bathrooms
                      </span>

                      <span>
                        🚗{" "}
                        {property.parking ?? 0}{" "}
                        parking
                      </span>
                    </div>

                    <div className="property-bottom">
                      <strong>
                        KSh{" "}
                        {Number(
                          property.price || 0
                        ).toLocaleString()}
                      </strong>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPropertyId(
                            property.id
                          );
                        }}
                      >
                        View Property
                      </button>
                    </div>

                    {property.owner && (
                      <div className="property-owner">
                        <small>
                          Listed by{" "}
                          <strong>
                            {
                              property.owner
                                .name
                            }
                          </strong>
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section className="nearby-services-section">
          <div className="section-heading">
            <div>
              <p className="section-label">
                NEARBY SERVICES
              </p>

              <h2>
                Live around your selected area.
              </h2>
            </div>

            <p>
              Understand what is nearby
              before you book a viewing
              or move in.
            </p>
          </div>

          <div className="nearby-services-grid">
            {nearbyServiceCards.map(
              (service) => (
                <div
                  key={service.title}
                  className="nearby-service-item"
                >
                  <div className="nearby-service-icon">
                    {service.icon}
                  </div>

                  <div className="nearby-service-copy">
                    <h3>
                      {service.title}
                    </h3>

                    <p>
                      {service.description}
                    </p>
                  </div>

                  <div className="nearby-service-distance">
                    <strong>
                      {service.distance}
                    </strong>

                    <span>away</span>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section className="neighborhood-section">
          <div className="section-heading">
            <div>
              <p className="section-label">
                POPULAR AREAS
              </p>

              <h2>
                Neighborhood picks
                for your next move.
              </h2>
            </div>

            <p>
              Quick market snapshots
              to help you compare the
              right area for your budget
              and lifestyle.
            </p>
          </div>

          <div className="neighborhood-grid">
            {neighborhoodHighlights.map(
              (area) => (
                <article
                  key={area.name}
                  className="neighborhood-card"
                >
                  <div className="neighborhood-badge">
                    {area.name}
                  </div>

                  <h3>{area.vibe}</h3>

                  <p>{area.price}</p>
                </article>
              )
            )}
          </div>
        </section>

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
              places, properties and
              services in their community.
              List your home or space and
              reach buyers, renters and
              local customers.
            </p>
          </div>

          <div className="category-grid">
            <div
              className="category-card"
              role="button"
              tabIndex={0}
              onClick={() => {
                handleCategoryJump(
                  "Houses & Apartments"
                );
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();

                  handleCategoryJump(
                    "Houses & Apartments"
                  );
                }
              }}
            >
              <div className="category-icon">
                🏠
              </div>

              <h3>
                Houses & Apartments
              </h3>

              <p>
                Find your next home
                from verified properties
                around your community.
              </p>
            </div>

            <div
              className="category-card"
              id="hostels"
              role="button"
              tabIndex={0}
              onClick={() => {
                handleCategoryJump(
                  "Hostels"
                );
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();

                  handleCategoryJump(
                    "Hostels"
                  );
                }
              }}
            >
              <div className="category-icon">
                🏨
              </div>

              <h3>Hostels</h3>

              <p>
                Discover hostels and
                student accommodation
                close to where you need.
              </p>
            </div>

            <div
              className="category-card"
              role="button"
              tabIndex={0}
              onClick={() => {
                handleCategoryJump(
                  "Commercial Spaces"
                );
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();

                  handleCategoryJump(
                    "Commercial Spaces"
                  );
                }
              }}
            >
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

            <div
              className="category-card"
              role="button"
              tabIndex={0}
              onClick={() => {
                handleCategoryJump(
                  "Local Services"
                );
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();

                  handleCategoryJump(
                    "Local Services"
                  );
                }
              }}
            >
              <div className="category-icon">
                🛠️
              </div>

              <h3>Local Services</h3>

              <p>
                Discover useful
                services and businesses
                around you.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;