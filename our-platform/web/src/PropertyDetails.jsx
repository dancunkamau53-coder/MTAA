import { useEffect, useState } from "react";
import { getProperty } from "./services/api";
import "./PropertyDetails.css";

function PropertyDetails({ propertyId, onBack }) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true);

        const data = await getProperty(propertyId);

        setProperty(data.property);
      } catch (err) {
        setError(
          err.message || "Failed to load property."
        );
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  const handleShare = async () => {
    const shareData = {
      title: property?.title || "MTAA Property",
      text:
        property?.description ||
        "Check out this property on MTAA.",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        );

        alert("Property link copied!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        alert("Unable to share property.");
      }
    }
  };

  const handleComment = (event) => {
    event.preventDefault();

    if (!comment.trim()) {
      return;
    }

    alert(
      "Comments will be connected to the MTAA database next."
    );

    setComment("");
  };

  if (loading) {
    return (
      <div className="property-details-loading">
        Loading property...
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="property-details-error">
        <h2>Property unavailable</h2>

        <p>
          {error || "Property could not be found."}
        </p>

        <button onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="property-details-page">

      {/* =====================================
          TOP BAR
          ===================================== */}

      <header className="property-details-topbar">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="property-details-logo">
          MTAA
        </div>

        <div className="property-top-actions">

          <button
            className={liked ? "active-action" : ""}
            onClick={() => setLiked(!liked)}
          >
            {liked ? "❤️" : "♡"} Like
          </button>

          <button
            className={saved ? "active-action" : ""}
            onClick={() => setSaved(!saved)}
          >
            {saved ? "💾" : "🔖"} Save
          </button>

          <button onClick={handleShare}>
            🔗 Share
          </button>

        </div>

      </header>

      <main className="property-details-container">

        {/* =================================
            PROPERTY HEADER
            ================================= */}

        <section className="property-details-header">

          <div>

            <p className="property-details-label">
              MTAA PROPERTY
            </p>

            <h1>
              {property.title}
            </h1>

            <p className="property-details-location">
              📍 {property.location}
            </p>

          </div>

          <div className="property-details-price">

            <strong>
              KSh{" "}
              {Number(
                property.price
              ).toLocaleString()}
            </strong>

            <span>
              per month
            </span>

          </div>

        </section>

        {/* =================================
            MAIN MEDIA
            ================================= */}

        <section className="property-main-media">

          {property.imageUrl ? (

            <img
              src={property.imageUrl}
              alt={property.title}
            />

          ) : (

            <div className="property-no-image">
              🏠
              <span>
                MTAA
              </span>
            </div>

          )}

        </section>

        {/* =================================
            PROPERTY INFO
            ================================= */}

        <section className="property-info-layout">

          <div className="property-primary-content">

            {/* FEATURES */}

            <div className="property-features">

              <div>
                <span>🛏️</span>
                <strong>
                  {property.bedrooms || 0}
                </strong>
                <small>
                  Bedrooms
                </small>
              </div>

              <div>
                <span>🚿</span>
                <strong>
                  {property.bathrooms || 0}
                </strong>
                <small>
                  Bathrooms
                </small>
              </div>

              <div>
                <span>📍</span>
                <strong>
                  Location
                </strong>
                <small>
                  {property.location}
                </small>
              </div>

            </div>

            {/* DESCRIPTION */}

            <section className="property-description-section">

              <p className="property-section-label">
                ABOUT THIS PROPERTY
              </p>

              <h2>
                Property description
              </h2>

              <p>
                {property.description ||
                  "No description has been provided for this property."}
              </p>

            </section>

            {/* MEDIA */}

            <section className="property-gallery-section">

              <div className="property-section-heading">

                <div>

                  <p className="property-section-label">
                    PROPERTY MEDIA
                  </p>

                  <h2>
                    Photos & Videos
                  </h2>

                </div>

                <span>
                  Coming with permanent
                  media storage
                </span>

              </div>

              <div className="property-gallery-placeholder">

                <div>
                  📸
                </div>

                <h3>
                  Property gallery
                </h3>

                <p>
                  Multiple photos and property
                  videos will appear here once
                  permanent media storage is
                  connected.
                </p>

              </div>

            </section>

            {/* COMMENTS */}

            <section className="property-comments">

              <p className="property-section-label">
                COMMUNITY
              </p>

              <h2>
                Comments & questions
              </h2>

              <form
                onSubmit={handleComment}
                className="comment-form"
              >

                <textarea
                  value={comment}
                  onChange={(event) =>
                    setComment(event.target.value)
                  }
                  placeholder="Ask the owner a question..."
                />

                <button type="submit">
                  Post Comment
                </button>

              </form>

            </section>

          </div>

          {/* =================================
              OWNER SIDEBAR
              ================================= */}

          <aside className="owner-card">

            <p className="property-section-label">
              PROPERTY CONTACT
            </p>

            <h2>
              Owner / Agent
            </h2>

            <div className="owner-profile">

              <div className="owner-avatar">
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

            {/* PHONE */}

            {property.owner?.phone && (

              <a
                className="owner-contact-button"
                href={`tel:${property.owner.phone}`}
              >
                📞 Call Owner
              </a>

            )}

            {/* WHATSAPP */}

            {property.owner?.phone && (

              <a
                className="owner-contact-button whatsapp"
                href={`https://wa.me/${property.owner.phone}`}
                target="_blank"
                rel="noreferrer"
              >
                💬 WhatsApp
              </a>

            )}

            {/* EMAIL */}

            {property.owner?.email && (

              <div className="owner-email">
                ✉️ {property.owner.email}
              </div>

            )}

            <div className="owner-note">

              <span>
                🛡️
              </span>

              <p>
                Always verify the property and
                owner details before making any
                payment.
              </p>

            </div>

          </aside>

        </section>

      </main>

    </div>
  );
}

export default PropertyDetails;
