import { useEffect, useState } from "react";
import {
  createProperty,
  getProperties,
  deleteProperty,
  uploadPropertyImage,
} from "./services/api";
import "./Dashboard.css";

const API_ORIGIN =
  "https://reimagined-trout-wr6pxrr7jp562jx7-5000.app.github.dev";

function getImageUrl(url) {
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_ORIGIN}${url}`;
}

function Dashboard({ user, onLogout, onViewProperty }) {
  const [activeSection, setActiveSection] = useState("overview");

  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const token = localStorage.getItem("token");

  // -----------------------------------------
  // LOAD PROPERTIES
  // -----------------------------------------
  const loadProperties = async () => {
    try {
      setLoadingProperties(true);
      setError("");

      const data = await getProperties();

      setProperties(data.properties || []);
    } catch (err) {
      console.error("Failed to load properties:", err);
      setError(err.message || "Failed to load properties");
    } finally {
      setLoadingProperties(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // -----------------------------------------
  // FORM CHANGE
  // -----------------------------------------
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // -----------------------------------------
  // IMAGE SELECTION
  // -----------------------------------------
  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const validFiles = files.filter((file) => {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      setError(
        "Some files were ignored. Only JPG, PNG, WEBP and GIF images are allowed."
      );
    }

    const tooLarge = validFiles.some(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (tooLarge) {
      setError("Each image must be 5MB or smaller.");
      return;
    }

    const imageObjects = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImageFiles((previous) => [
      ...previous,
      ...imageObjects,
    ]);

    setImagePreviews((previous) => [
      ...previous,
      ...imageObjects,
    ]);

    setError("");
  };

  // -----------------------------------------
  // REMOVE SELECTED IMAGE
  // -----------------------------------------
  const removeSelectedImage = (id) => {
    const image = imageFiles.find(
      (item) => item.id === id
    );

    if (image?.previewUrl) {
      URL.revokeObjectURL(image.previewUrl);
    }

    setImageFiles((previous) =>
      previous.filter((item) => item.id !== id)
    );

    setImagePreviews((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  // -----------------------------------------
  // RESET FORM
  // -----------------------------------------
  const resetForm = () => {
    imageFiles.forEach((image) => {
      if (image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl);
      }
    });

    setForm({
      title: "",
      description: "",
      location: "",
      price: "",
      bedrooms: "",
      bathrooms: "",
    });

    setImageFiles([]);
    setImagePreviews([]);
  };

  // -----------------------------------------
  // CREATE PROPERTY
  // -----------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      if (!token) {
        throw new Error(
          "You are not logged in. Please login again."
        );
      }

      if (!form.title.trim()) {
        throw new Error("Property title is required.");
      }

      if (!form.location.trim()) {
        throw new Error("Property location is required.");
      }

      if (!form.price) {
        throw new Error("Property price is required.");
      }

      const propertyData = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        price: Number(form.price),
        bedrooms: form.bedrooms
          ? Number(form.bedrooms)
          : null,
        bathrooms: form.bathrooms
          ? Number(form.bathrooms)
          : null,
      };

      // Create property first
      const created = await createProperty(
        propertyData,
        token
      );

      const property = created.property;

      // Upload selected images
      if (property && imageFiles.length > 0) {
        for (const image of imageFiles) {
          await uploadPropertyImage(
            property.id,
            image.file,
            token
          );
        }
      }

      setMessage(
        imageFiles.length > 0
          ? "Property and images uploaded successfully!"
          : "Property created successfully!"
      );

      resetForm();

      await loadProperties();

      setActiveSection("properties");
    } catch (err) {
      console.error("CREATE PROPERTY ERROR:", err);

      setError(
        err.message ||
          "Something went wrong while creating the property."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------------
  // DELETE PROPERTY
  // -----------------------------------------
  const handleDelete = async (propertyId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this property?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(propertyId);
      setError("");
      setMessage("");

      if (!token) {
        throw new Error(
          "You are not logged in. Please login again."
        );
      }

      await deleteProperty(propertyId, token);

      setMessage("Property deleted successfully.");

      setProperties((previous) =>
        previous.filter(
          (property) => property.id !== propertyId
        )
      );
    } catch (err) {
      console.error("DELETE PROPERTY ERROR:", err);

      setError(
        err.message || "Failed to delete property."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // -----------------------------------------
  // NAVIGATION
  // -----------------------------------------
  const handleNavigation = (section) => {
    setMessage("");
    setError("");
    setActiveSection(section);
  };

  // -----------------------------------------
  // PROPERTY CARD
  // -----------------------------------------
  const PropertyCard = ({ property }) => {
    const imageUrl = getImageUrl(
      property.imageUrl
    );

    return (
      <div className="property-card">
        <div className="property-image">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={property.title}
            />
          ) : (
            <div className="property-no-image">
              <span>🏠</span>
              <p>No image</p>
            </div>
          )}
        </div>

        <div className="property-card-content">
          <h3>{property.title}</h3>

          <p className="property-location">
            📍 {property.location}
          </p>

          <p className="property-price">
            KSh{" "}
            {Number(property.price || 0).toLocaleString()}
            {" / month"}
          </p>

          <div className="property-details">
            <span>
              🛏️ {property.bedrooms ?? 0} Beds
            </span>

            <span>
              🚿 {property.bathrooms ?? 0} Baths
            </span>
          </div>

          <div className="property-actions">
            <button
              type="button"
              className="view-property-btn"
              onClick={() => {
                if (onViewProperty) {
                  onViewProperty(property.id);
                }
              }}
            >
              View
            </button>

            <button
              type="button"
              className="delete-property-btn"
              onClick={() =>
                handleDelete(property.id)
              }
              disabled={deletingId === property.id}
            >
              {deletingId === property.id
                ? "Deleting..."
                : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------
  // OVERVIEW
  // -----------------------------------------
  const renderOverview = () => {
    return (
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h1>Welcome, {user?.name || "User"} 👋</h1>
            <p>
              Manage your MTAA properties from your
              dashboard.
            </p>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">🏠</div>

            <div>
              <span className="stat-label">
                My Properties
              </span>

              <strong>{properties.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📍</div>

            <div>
              <span className="stat-label">
                Platform
              </span>

              <strong>MTAA</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👤</div>

            <div>
              <span className="stat-label">
                Account
              </span>

              <strong>
                {user?.role || "USER"}
              </strong>
            </div>
          </div>
        </div>

        <div className="dashboard-welcome-card">
          <h2>MTAA Property Management</h2>

          <p>
            Add rental properties, upload property
            images and manage your listings.
          </p>

          <button
            type="button"
            onClick={() =>
              handleNavigation("add-property")
            }
          >
            + Post a Property
          </button>
        </div>
      </section>
    );
  };

  // -----------------------------------------
  // PROPERTIES
  // -----------------------------------------
  const renderProperties = () => {
    return (
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h1>My Properties</h1>

            <p>
              Manage properties posted on MTAA.
            </p>
          </div>

          <button
            type="button"
            className="primary-btn"
            onClick={() =>
              handleNavigation("add-property")
            }
          >
            + Add Property
          </button>
        </div>

        {loadingProperties ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>

            <h2>No properties yet</h2>

            <p>
              You have not posted any properties.
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                handleNavigation("add-property")
              }
            >
              Post Your First Property
            </button>
          </div>
        ) : (
          <div className="properties-grid">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  // -----------------------------------------
  // ADD PROPERTY
  // -----------------------------------------
  const renderAddProperty = () => {
    return (
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h1>Post a Property</h1>

            <p>
              Add your property to the MTAA platform.
            </p>
          </div>
        </div>

        <form
          className="property-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="title">
              Property Title
            </label>

            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Modern 2 Bedroom Apartment"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows="5"
              placeholder="Describe the property..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">
              Location
            </label>

            <input
              id="location"
              name="location"
              type="text"
              placeholder="e.g. Ruiru, Kiambu"
              value={form.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">
                Monthly Rent (KSh)
              </label>

              <input
                id="price"
                name="price"
                type="number"
                min="0"
                placeholder="25000"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="bedrooms">
                Bedrooms
              </label>

              <input
                id="bedrooms"
                name="bedrooms"
                type="number"
                min="0"
                placeholder="2"
                value={form.bedrooms}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bathrooms">
                Bathrooms
              </label>

              <input
                id="bathrooms"
                name="bathrooms"
                type="number"
                min="0"
                placeholder="1"
                value={form.bathrooms}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="property-images">
              Property Images
            </label>

            <input
              id="property-images"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageChange}
            />

            <small>
              JPG, PNG, WEBP or GIF. Maximum 5MB per
              image.
            </small>
          </div>

          {imagePreviews.length > 0 && (
            <div className="image-preview-section">
              <h3>
                Selected Images (
                {imagePreviews.length})
              </h3>

              <div className="image-preview-grid">
                {imagePreviews.map((image, index) => (
                  <div
                    className="image-preview-card"
                    key={image.id}
                  >
                    <img
                      src={image.previewUrl}
                      alt={`Property preview ${
                        index + 1
                      }`}
                    />

                    {index === 0 && (
                      <span className="cover-badge">
                        Cover
                      </span>
                    )}

                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() =>
                        removeSelectedImage(
                          image.id
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={resetForm}
              disabled={submitting}
            >
              Clear
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={submitting}
            >
              {submitting
                ? "Posting Property..."
                : "Post Property"}
            </button>
          </div>
        </form>
      </section>
    );
  };

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <h2>MTAA</h2>
          <span>Property Platform</span>
        </div>

        <nav className="dashboard-nav">
          <button
            type="button"
            className={
              activeSection === "overview"
                ? "active"
                : ""
            }
            onClick={() =>
              handleNavigation("overview")
            }
          >
            <span>📊</span>
            Overview
          </button>

          <button
            type="button"
            className={
              activeSection === "properties"
                ? "active"
                : ""
            }
            onClick={() =>
              handleNavigation("properties")
            }
          >
            <span>🏠</span>
            My Properties
          </button>

          <button
            type="button"
            className={
              activeSection === "add-property"
                ? "active"
                : ""
            }
            onClick={() =>
              handleNavigation("add-property")
            }
          >
            <span>➕</span>
            Post Property
          </button>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user">
            <div className="user-avatar">
              {(user?.name || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                {user?.role || "USER"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={onLogout}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span>MTAA</span>
            <strong>Dashboard</strong>
          </div>

          <div className="topbar-user">
            <span>
              {user?.email || ""}
            </span>
          </div>
        </header>

        <div className="dashboard-content">
          {message && (
            <div className="dashboard-message success">
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="dashboard-message error">
              ❌ {error}
            </div>
          )}

          {activeSection === "overview" &&
            renderOverview()}

          {activeSection === "properties" &&
            renderProperties()}

          {activeSection === "add-property" &&
            renderAddProperty()}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
