import { useEffect, useState } from "react";
import {
  getSavedProperties,
  togglePropertySave,
} from "./services/api";
import "./SavedProperties.css";

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || window.location.origin;

function getImageUrl(url) {
  if (!url) return null;

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

function formatPrice(price) {
  if (price === null || price === undefined || price === "") {
    return "Price on request";
  }

  const number = Number(price);

  if (Number.isNaN(number)) {
    return String(price);
  }

  return "KSh " + number.toLocaleString();
}

function getPropertyImage(property) {
  if (!property) return null;

  const images = Array.isArray(property.images)
    ? property.images
    : [];

  const firstImage = images.length > 0 ? images[0] : null;

  if (typeof firstImage === "string") {
    return getImageUrl(firstImage);
  }

  if (firstImage?.url) {
    return getImageUrl(firstImage.url);
  }

  if (property.image) {
    return getImageUrl(property.image);
  }

  if (property.coverImage) {
    return getImageUrl(property.coverImage);
  }

  return null;
}

export default function SavedProperties({
  user,
  onBack,
  onViewProperty,
  onRequireAuth,
}) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("mtaa_token");

  useEffect(() => {
    let active = true;

    async function loadSavedProperties() {
      if (!token) {
        if (active) {
          setProperties([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getSavedProperties(token);

        if (!active) return;

        const saved =
          response?.properties ||
          response?.savedProperties ||
          response?.data ||
          [];

        setProperties(Array.isArray(saved) ? saved : []);
      } catch (err) {
        if (!active) return;

        setError(
          err?.message ||
            "Unable to load your saved properties."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSavedProperties();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleRemove(propertyId) {
    if (!token || !propertyId) return;

    try {
      setRemovingId(propertyId);
      setError("");

      await togglePropertySave(propertyId, token);

      setProperties((current) =>
        current.filter(
          (property) =>
            String(property.id) !== String(propertyId)
        )
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to remove this property from saved properties."
      );
    } finally {
      setRemovingId("");
    }
  }

  function handleView(property) {
    if (onViewProperty) {
      onViewProperty(property);
    }
  }

  if (!user && onRequireAuth) {
    return (
      <section className="saved-properties-page">
        <div className="saved-properties-empty">
          <h2>Sign in to see your saved properties</h2>

          <p>
            Save homes you like and find them again anytime.
          </p>

          <button
            type="button"
            onClick={onRequireAuth}
            className="saved-properties-primary-button"
          >
            Sign in
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="saved-properties-page">
      <div className="saved-properties-header">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="saved-properties-back-button"
          >
            ← Back
          </button>

          <p className="saved-properties-eyebrow">
            MTAA
          </p>

          <h1>Saved Properties</h1>

          <p>
            Properties you saved for later.
          </p>
        </div>

        <div className="saved-properties-count">
          {properties.length} saved
        </div>
      </div>

      {error ? (
        <div className="saved-properties-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="saved-properties-empty">
          <h2>Loading saved properties...</h2>
        </div>
      ) : properties.length === 0 ? (
        <div className="saved-properties-empty">
          <div className="saved-properties-empty-icon">
            ♡
          </div>

          <h2>No saved properties yet</h2>

          <p>
            When you save a property, it will appear here.
          </p>

          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="saved-properties-primary-button"
            >
              Browse properties
            </button>
          ) : null}
        </div>
      ) : (
        <div className="saved-properties-grid">
          {properties.map((property) => {
            const image = getPropertyImage(property);

            return (
              <article
                key={property.id}
                className="saved-property-card"
              >
                <div className="saved-property-image">
                  {image ? (
                    <img
                      src={image}
                      alt={
                        property.title ||
                        "Saved property"
                      }
                    />
                  ) : (
                    <div className="saved-property-image-placeholder">
                      MTAA
                    </div>
                  )}

                  <button
                    type="button"
                    className="saved-property-remove"
                    onClick={() =>
                      handleRemove(property.id)
                    }
                    disabled={
                      removingId === String(property.id)
                    }
                  >
                    {removingId === String(property.id)
                      ? "Removing..."
                      : "♥ Saved"}
                  </button>
                </div>

                <div className="saved-property-content">
                  <div className="saved-property-top">
                    <span className="saved-property-type">
                      {property.propertyType ||
                        "Property"}
                    </span>

                    <strong>
                      {formatPrice(property.price)}
                    </strong>
                  </div>

                  <h2>
                    {property.title ||
                      "MTAA Property"}
                  </h2>

                  <p className="saved-property-location">
                    {property.location ||
                      "Location not specified"}
                  </p>

                  <div className="saved-property-details">
                    {property.bedrooms !== null &&
                    property.bedrooms !== undefined ? (
                      <span>
                        🛏 {property.bedrooms} beds
                      </span>
                    ) : null}

                    {property.bathrooms !== null &&
                    property.bathrooms !== undefined ? (
                      <span>
                        🛁 {property.bathrooms} baths
                      </span>
                    ) : null}

                    {property.parking !== null &&
                    property.parking !== undefined ? (
                      <span>
                        🚗 {property.parking} parking
                      </span>
                    ) : null}
                  </div>

                  <div className="saved-property-owner">
                    <div className="saved-property-owner-avatar">
                      {property.owner?.name
                        ? property.owner.name
                            .charAt(0)
                            .toUpperCase()
                        : "M"}
                    </div>

                    <div>
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

                  <button
                    type="button"
                    className="saved-properties-view-button"
                    onClick={() =>
                      handleView(property)
                    }
                  >
                    View property
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}