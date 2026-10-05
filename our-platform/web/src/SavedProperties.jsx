import { useEffect, useState } from "react";
import {
  getSavedProperties,
  togglePropertySave,
} from "./services/api";
import "./SavedProperties.css";

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  window.location.origin;

// =====================================================
// IMAGE URL HELPER
// =====================================================

function getImageUrl(url) {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  if (url.startsWith("/")) {
    return API_ORIGIN + url;
  }

  return API_ORIGIN + "/" + url;
}

// =====================================================
// SAVED PROPERTIES
// =====================================================

function SavedProperties({
  onBack,
  onViewProperty,
}) {
  const [savedProperties, setSavedProperties] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [removingId, setRemovingId] =
    useState(null);

  // ===================================================
  // LOAD SAVED PROPERTIES
  // ===================================================

  const loadSavedProperties = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("mtaa_token");

      if (!token) {
        throw new Error(
          "Please log in to view your saved properties."
        );
      }

      // IMPORTANT:
      // Use the dedicated saved-properties endpoint.
      const data =
        await getSavedProperties(token);

      const properties =
        data?.properties ||
        data?.data?.properties ||
        data?.data ||
        (Array.isArray(data)
          ? data
          : []);

      setSavedProperties(
        Array.isArray(properties)
          ? properties
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load saved properties:",
        err
      );

      setError(
        err.message ||
          "Unable to load your saved properties."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadSavedProperties();
  }, []);

  // ===================================================
  // REMOVE SAVED PROPERTY
  // ===================================================

  const handleRemove = async (
    propertyId
  ) => {
    try {
      const token =
        localStorage.getItem("mtaa_token");

      if (!token) {
        throw new Error(
          "Please log in again."
        );
      }

      setRemovingId(propertyId);

      const result =
        await togglePropertySave(
          propertyId,
          token
        );

      if (
        result?.saved === false ||
        result?.data?.saved === false
      ) {
        setSavedProperties(
          (currentProperties) =>
            currentProperties.filter(
              (property) =>
                property.id !== propertyId
            )
        );
      } else {
        // If the backend response format
        // is different, reload the list.
        await loadSavedProperties();
      }
    } catch (err) {
      console.error(
        "Failed to remove saved property:",
        err
      );

      alert(
        err.message ||
          "Unable to remove this property from your saved properties."
      );
    } finally {
      setRemovingId(null);
    }
  };

  // ===================================================
  // FORMAT PRICE
  // ===================================================

  const formatPrice = (price) => {
    const number = Number(price);

    if (Number.isNaN(number)) {
      return "Price unavailable";
    }

    return (
      "KSh " +
      number.toLocaleString("en-KE")
    );
  };

  // ===================================================
  // GET PROPERTY IMAGE
  // ===================================================

  const getPropertyImage = (property) => {
    if (
      property?.images &&
      Array.isArray(property.images) &&
      property.images.length > 0
    ) {
      const coverImage =
        property.images.find(
          (image) => image.isCover
        );

      const firstImage =
        coverImage ||
        property.images[0];

      return getImageUrl(
        firstImage?.url ||
          firstImage?.imageUrl ||
          firstImage?.path
      );
    }

    return getImageUrl(
      property?.imageUrl
    );
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="saved-properties-page">
        <header className="saved-properties-header">
          <button
            type="button"
            className="saved-back-button"
            onClick={onBack}
          >
            ← Back
          </button>

          <div>
            <p className="saved-page-label">
              MTAA
            </p>

            <h1>
              Saved Properties
            </h1>
          </div>
        </header>

        <div className="saved-properties-message">
          <div className="saved-loading-icon">
            ⏳
          </div>

          <h2>
            Loading saved properties...
          </h2>

          <p>
            Please wait while we find
            your saved properties.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error) {
    return (
      <div className="saved-properties-page">
        <header className="saved-properties-header">
          <button
            type="button"
            className="saved-back-button"
            onClick={onBack}
          >
            ← Back
          </button>

          <div>
            <p className="saved-page-label">
              MTAA
            </p>

            <h1>
              Saved Properties
            </h1>
          </div>
        </header>

        <div className="saved-properties-message error">
          <div className="saved-message-icon">
            ⚠️
          </div>

          <h2>
            Something went wrong
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="saved-retry-button"
            onClick={
              loadSavedProperties
            }
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ===================================================
  // EMPTY STATE
  // ===================================================

  if (savedProperties.length === 0) {
    return (
      <div className="saved-properties-page">
        <header className="saved-properties-header">
          <button
            type="button"
            className="saved-back-button"
            onClick={onBack}
          >
            ← Back
          </button>

          <div>
            <p className="saved-page-label">
              MTAA
            </p>

            <h1>
              Saved Properties
            </h1>
          </div>
        </header>

        <div className="saved-properties-message">
          <div className="saved-message-icon">
            🔖
          </div>

          <h2>
            No saved properties yet
          </h2>

          <p>
            Properties you save will
            appear here.
          </p>

          <button
            type="button"
            className="saved-retry-button"
            onClick={onBack}
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN PAGE
  // ===================================================

  return (
    <div className="saved-properties-page">

      {/* ============================================= */}
      {/* HEADER */}
      {/* ============================================= */}

      <header className="saved-properties-header">

        <button
          type="button"
          className="saved-back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="saved-header-content">
          <p className="saved-page-label">
            MTAA
          </p>

          <h1>
            Saved Properties
          </h1>

          <p className="saved-page-subtitle">
            Properties you have saved for
            later.
          </p>
        </div>

        <div className="saved-properties-count">
          {savedProperties.length}{" "}
          {savedProperties.length === 1
            ? "Property"
            : "Properties"}
        </div>

      </header>

      {/* ============================================= */}
      {/* CONTENT */}
      {/* ============================================= */}

      <main className="saved-properties-content">

        <div className="saved-properties-grid">

          {savedProperties.map(
            (property) => {
              const imageUrl =
                getPropertyImage(
                  property
                );

              const propertyType =
                property.propertyType ||
                "Property";

              return (
                <article
                  className="saved-property-card"
                  key={property.id}
                >

                  {/* ================================= */}
                  {/* IMAGE */}
                  {/* ================================= */}

                  <div className="saved-property-image">

                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={
                          property.title ||
                          "Saved property"
                        }
                      />
                    ) : (
                      <div className="saved-property-no-image">
                        🏠
                      </div>
                    )}

                    <div className="saved-property-badge">
                      🔖 Saved
                    </div>

                    <div className="saved-property-type">
                      {propertyType}
                    </div>

                  </div>

                  {/* ================================= */}
                  {/* CARD CONTENT */}
                  {/* ================================= */}

                  <div className="saved-property-content">

                    <h2>
                      {property.title ||
                        "Untitled Property"}
                    </h2>

                    <p className="saved-property-location">
                      📍{" "}
                      {property.location ||
                        "Location unavailable"}
                    </p>

                    {property.description && (
                      <p className="saved-property-description">
                        {property.description}
                      </p>
                    )}

                    {/* =============================== */}
                    {/* DETAILS */}
                    {/* =============================== */}

                    <div className="saved-property-details">

                      {property.bedrooms !==
                        null &&
                        property.bedrooms !==
                          undefined && (
                          <span>
                            🛏️{" "}
                            {property.bedrooms}{" "}
                            Bedroom
                            {property.bedrooms ===
                            1
                              ? ""
                              : "s"}
                          </span>
                        )}

                      {property.bathrooms !==
                        null &&
                        property.bathrooms !==
                          undefined && (
                          <span>
                            🚿{" "}
                            {property.bathrooms}{" "}
                            Bathroom
                            {property.bathrooms ===
                            1
                              ? ""
                              : "s"}
                          </span>
                        )}

                      {property.parking !==
                        null &&
                        property.parking !==
                          undefined && (
                          <span>
                            🚗{" "}
                            {property.parking}{" "}
                            Parking
                          </span>
                        )}

                    </div>

                    {/* =============================== */}
                    {/* PRICE */}
                    {/* =============================== */}

                    <div className="saved-property-price">
                      {formatPrice(
                        property.price
                      )}
                    </div>

                    {/* =============================== */}
                    {/* OWNER */}
                    {/* =============================== */}

                    <div className="saved-property-owner">

                      <div className="saved-owner-avatar">
                        {property.owner?.name
                          ? property.owner.name
                              .charAt(0)
                              .toUpperCase()
                          : "M"}
                      </div>

                      <div className="saved-owner-info">

                        <strong>
                          {property.owner?.name ||
                            "MTAA Property Owner"}
                        </strong>

                        <span>
                          {property.owner?.role ||
                            "PROPERTY OWNER"}
                        </span>

                      </div>

                    </div>

                    {/* =============================== */}
                    {/* ACTIONS */}
                    {/* =============================== */}

                    <div className="saved-property-actions">

                      <button
                        type="button"
                        className="saved-view-button"
                        onClick={() => {
                          if (
                            onViewProperty
                          ) {
                            onViewProperty(
                              property.id
                            );
                          }
                        }}
                      >
                        View Property
                      </button>

                      <button
                        type="button"
                        className="saved-remove-button"
                        disabled={
                          removingId ===
                          property.id
                        }
                        onClick={() =>
                          handleRemove(
                            property.id
                          )
                        }
                      >
                        {removingId ===
                        property.id
                          ? "Removing..."
                          : "Remove"}
                      </button>

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>

      </main>

    </div>
  );
}

export default SavedProperties;
