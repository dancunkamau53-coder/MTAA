import { useEffect, useState } from "react";
import { getMyProperties } from "./services/api";
import "./MyProperties.css";

function MyProperties({
  user,
  onBack,
  onOpenProperty,
}) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMyProperties = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("mtaa_token");

        if (!token) {
          throw new Error("Please log in to view your properties.");
        }

        const data = await getMyProperties(token);

        setProperties(
          Array.isArray(data?.properties)
            ? data.properties
            : []
        );
      } catch (err) {
        console.error("MY PROPERTIES ERROR:", err);
        setError(
          err.message ||
            "Failed to load your properties."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMyProperties();
  }, []);

  const getPropertyImage = (property) => {
    if (
      Array.isArray(property?.images) &&
      property.images.length > 0
    ) {
      return (
        property.images[0]?.url ||
        property.images[0]?.imageUrl ||
        property.images[0]?.path ||
        ""
      );
    }

    return "";
  };

  if (loading) {
    return (
      <main className="my-properties-page">
        <div className="my-properties-container">
          <button
            type="button"
            className="my-properties-back"
            onClick={onBack}
          >
            ← Back
          </button>

          <div className="my-properties-header">
            <div>
              <span className="my-properties-eyebrow">
                MTAA
              </span>

              <h1>My Properties</h1>

              <p>
                Manage properties you have listed on MTAA.
              </p>
            </div>
          </div>

          <div className="my-properties-state">
            <div className="my-properties-spinner" />
            <p>Loading your properties...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="my-properties-page">
      <div className="my-properties-container">
        <button
          type="button"
          className="my-properties-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <header className="my-properties-header">
          <div>
            <span className="my-properties-eyebrow">
              MTAA
            </span>

            <h1>My Properties</h1>

            <p>
              Manage properties you have listed on MTAA.
            </p>
          </div>

          <div className="my-properties-count">
            <strong>{properties.length}</strong>
            <span>
              {properties.length === 1
                ? "Property"
                : "Properties"}
            </span>
          </div>
        </header>

        {error && (
          <div className="my-properties-error">
            <strong>Unable to load properties</strong>
            <p>{error}</p>
          </div>
        )}

        {!error && properties.length === 0 && (
          <section className="my-properties-empty">
            <div className="my-properties-empty-icon">
              🏠
            </div>

            <h2>No properties yet</h2>

            <p>
              You have not listed any properties on MTAA yet.
              Your properties will appear here after you add
              them.
            </p>

            <button
              type="button"
              className="my-properties-primary-button"
              onClick={onBack}
            >
              Back to Dashboard
            </button>
          </section>
        )}

        {!error && properties.length > 0 && (
          <section className="my-properties-grid">
            {properties.map((property) => {
              const image = getPropertyImage(property);

              return (
                <article
                  className="my-property-card"
                  key={property.id}
                >
                  <div className="my-property-image">
                    {image ? (
                      <img
                        src={image}
                        alt={
                          property.title ||
                          "MTAA property"
                        }
                      />
                    ) : (
                      <div className="my-property-image-placeholder">
                        🏠
                      </div>
                    )}

                    <span className="my-property-status">
                      {property.status ||
                        "AVAILABLE"}
                    </span>
                  </div>

                  <div className="my-property-content">
                    <h2>
                      {property.title ||
                        property.name ||
                        "Untitled Property"}
                    </h2>

                    <p className="my-property-location">
                      📍{" "}
                      {property.location ||
                        property.address ||
                        "Location not provided"}
                    </p>

                    <div className="my-property-details">
                      {property.price !== undefined &&
                        property.price !== null && (
                          <span>
                            KSh{" "}
                            {Number(
                              property.price
                            ).toLocaleString()}
                          </span>
                        )}

                      {property.propertyType && (
                        <span>
                          {property.propertyType}
                        </span>
                      )}
                    </div>

                    {property.description && (
                      <p className="my-property-description">
                        {property.description}
                      </p>
                    )}

                    <button
                      type="button"
                      className="my-property-view-button"
                      onClick={() => {
                        if (onOpenProperty) {
                          onOpenProperty(property);
                        }
                      }}
                    >
                      View Property
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {user?.name && (
          <p className="my-properties-footer">
            Properties listed by{" "}
            <strong>{user.name}</strong>
          </p>
        )}
      </div>
    </main>
  );
}

export default MyProperties;
