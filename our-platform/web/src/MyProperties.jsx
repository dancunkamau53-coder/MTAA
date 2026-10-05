import { useEffect, useState } from "react";
import {
  getMyProperties,
  updateProperty,
  deleteProperty,
} from "./services/api";
import "./MyProperties.css";

function MyProperties({
  user,
  onBack,
  onOpenProperty,
}) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingProperty, setEditingProperty] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

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

  const startEditing = (property) => {
    setActionError("");

    setEditingProperty(property);

    setEditForm({
      title: property.title || "",
      description: property.description || "",
      location: property.location || "",
      propertyType: property.propertyType || "",
      price: property.price ?? "",
      bedrooms: property.bedrooms ?? "",
      bathrooms: property.bathrooms ?? "",
      parking: property.parking ?? "",
      latitude: property.latitude ?? "",
      longitude: property.longitude ?? "",
      imageUrl: property.imageUrl || "",
    });
  };

  const cancelEditing = () => {
    if (actionLoading) {
      return;
    }

    setEditingProperty(null);
    setEditForm({});
    setActionError("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingProperty) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");

      const token = localStorage.getItem("mtaa_token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const updatedData = {
        ...editForm,
        price:
          editForm.price === ""
            ? undefined
            : Number(editForm.price),
        bedrooms:
          editForm.bedrooms === ""
            ? undefined
            : Number(editForm.bedrooms),
        bathrooms:
          editForm.bathrooms === ""
            ? undefined
            : Number(editForm.bathrooms),
        parking:
          editForm.parking === ""
            ? undefined
            : Number(editForm.parking),
        latitude:
          editForm.latitude === ""
            ? undefined
            : Number(editForm.latitude),
        longitude:
          editForm.longitude === ""
            ? undefined
            : Number(editForm.longitude),
      };

      const data = await updateProperty(
        editingProperty.id,
        updatedData,
        token
      );

      const updatedProperty =
        data?.property ||
        data?.data ||
        data?.updatedProperty;

      setProperties((current) =>
        current.map((property) =>
          property.id === editingProperty.id
            ? {
                ...property,
                ...(updatedProperty || updatedData),
              }
            : property
        )
      );

      setEditingProperty(null);
      setEditForm({});
      setActionError("");
    } catch (err) {
      console.error("UPDATE PROPERTY ERROR:", err);

      setActionError(
        err.message ||
          "Failed to update this property."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (property) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${property.title || property.name || "this property"}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");

      const token = localStorage.getItem("mtaa_token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      await deleteProperty(property.id, token);

      setProperties((current) =>
        current.filter(
          (item) => item.id !== property.id
        )
      );
    } catch (err) {
      console.error("DELETE PROPERTY ERROR:", err);

      setActionError(
        err.message ||
          "Failed to delete this property."
      );
    } finally {
      setActionLoading(false);
    }
  };

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

        {actionError && (
          <div className="my-properties-action-error">
            <strong>Action failed</strong>
            <p>{actionError}</p>
          </div>
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

                    {editingProperty?.id === property.id && (
                      <form
                        className="my-property-edit-form"
                        onSubmit={handleUpdate}
                      >
                        <h3>Edit Property</h3>

                        <label>
                          Title
                          <input
                            type="text"
                            name="title"
                            value={editForm.title || ""}
                            onChange={handleEditChange}
                            required
                          />
                        </label>

                        <label>
                          Description
                          <textarea
                            name="description"
                            value={editForm.description || ""}
                            onChange={handleEditChange}
                            rows="3"
                          />
                        </label>

                        <label>
                          Location
                          <input
                            type="text"
                            name="location"
                            value={editForm.location || ""}
                            onChange={handleEditChange}
                            required
                          />
                        </label>

                        <label>
                          Property Type
                          <input
                            type="text"
                            name="propertyType"
                            value={editForm.propertyType || ""}
                            onChange={handleEditChange}
                          />
                        </label>

                        <div className="my-property-edit-row">
                          <label>
                            Price
                            <input
                              type="number"
                              name="price"
                              value={editForm.price ?? ""}
                              onChange={handleEditChange}
                              min="0"
                            />
                          </label>

                          <label>
                            Bedrooms
                            <input
                              type="number"
                              name="bedrooms"
                              value={editForm.bedrooms ?? ""}
                              onChange={handleEditChange}
                              min="0"
                            />
                          </label>
                        </div>

                        <div className="my-property-edit-row">
                          <label>
                            Bathrooms
                            <input
                              type="number"
                              name="bathrooms"
                              value={editForm.bathrooms ?? ""}
                              onChange={handleEditChange}
                              min="0"
                            />
                          </label>

                          <label>
                            Parking
                            <input
                              type="number"
                              name="parking"
                              value={editForm.parking ?? ""}
                              onChange={handleEditChange}
                              min="0"
                            />
                          </label>
                        </div>

                        <div className="my-property-edit-actions">
                          <button
                            type="submit"
                            className="my-property-save-button"
                            disabled={actionLoading}
                          >
                            {actionLoading
                              ? "Saving..."
                              : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            className="my-property-cancel-button"
                            onClick={cancelEditing}
                            disabled={actionLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="my-property-actions">
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

                      <button
                        type="button"
                        className="my-property-edit-button"
                        onClick={() => startEditing(property)}
                        disabled={
                          actionLoading ||
                          editingProperty !== null
                        }
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        className="my-property-delete-button"
                        onClick={() => handleDelete(property)}
                        disabled={actionLoading}
                      >
                        🗑️ Delete
                      </button>
                    </div>
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
