import { useEffect, useState } from "react";
import {
  createProperty,
  getProperties,
  getPropertyImages,
  updateProperty,
  deleteProperty,
  uploadPropertyImage,
  deletePropertyImage,
  uploadPropertyVideo,
  getPropertyVideos,
  deletePropertyVideo,
} from "./services/api";
import "./Dashboard.css";

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  window.location.origin;

function getImageUrl(url) {
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_ORIGIN}${url}`;
}

function Dashboard({
  user,
  onLogout,
  onViewProperty,
  onOpenSavedProperties,
  onOpenProfile,
  onOpenPayments,
  onOpenNotifications,
  initialSection = "overview",
}) {
  const [activeSection, setActiveSection] =
    useState(initialSection);

  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] =
    useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // -----------------------------------------
  // ADD PROPERTY FORM
  // -----------------------------------------

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    propertyType: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    latitude: "",
    longitude: "",
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] =
    useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");

  // -----------------------------------------
  // EDIT PROPERTY
  // -----------------------------------------

  const [editingProperty, setEditingProperty] =
    useState(null);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    propertyType: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    latitude: "",
    longitude: "",
  });

  const [updating, setUpdating] = useState(false);

  // -----------------------------------------
  // MANAGE IMAGES
  // -----------------------------------------

  const [managingImagesProperty, setManagingImagesProperty] =
    useState(null);

  const [propertyImages, setPropertyImages] =
    useState([]);

  const [loadingImages, setLoadingImages] =
    useState(false);

  const [uploadingImages, setUploadingImages] =
    useState(false);

  const [deletingImageId, setDeletingImageId] =
    useState(null);

  const [propertyVideos, setPropertyVideos] = useState([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState(null);

  const token = localStorage.getItem("mtaa_token");

  // -----------------------------------------
  // LOAD PROPERTIES
  // -----------------------------------------

  const loadProperties = async () => {
    try {
      setLoadingProperties(true);
      setError("");

      const data = await getProperties();

      const allProperties =
        data.properties || [];

      const myProperties =
        allProperties.filter(
          (property) =>
            property.owner?.id === user?.id ||
            property.ownerId === user?.id
        );

      setProperties(myProperties);
    } catch (err) {
      console.error(
        "Failed to load properties:",
        err
      );

      setError(
        err.message ||
          "Failed to load properties"
      );
    } finally {
      setLoadingProperties(false);
    }
  };

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    loadProperties();
  }, [user?.id]);

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
  // EDIT FORM CHANGE
  // -----------------------------------------

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // -----------------------------------------
  // IMAGE SELECTION
  // -----------------------------------------

  const handleImageChange = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) {
      return;
    }

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const validFiles = files.filter((file) =>
      validTypes.includes(file.type)
    );

    if (
      validFiles.length !==
      files.length
    ) {
      setError(
        "Some files were ignored. Only JPG, PNG, WEBP and GIF images are allowed."
      );
    }

    const tooLarge = validFiles.some(
      (file) =>
        file.size > 5 * 1024 * 1024
    );

    if (tooLarge) {
      setError(
        "Each image must be 5MB or smaller."
      );

      return;
    }

    const imageObjects =
      validFiles.map(
        (file, index) => ({
          id: `${Date.now()}-${index}`,
          file,
          previewUrl:
            URL.createObjectURL(file),
        })
      );

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

  const handleVideoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      setError("Choose an MP4, WEBM or MOV video.");
      event.target.value = "";
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("The video must be 100MB or smaller.");
      event.target.value = "";
      return;
    }

    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
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
      URL.revokeObjectURL(
        image.previewUrl
      );
    }

    setImageFiles((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    setImagePreviews((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );
  };

  // -----------------------------------------
  // RESET ADD FORM
  // -----------------------------------------

  const resetForm = () => {
    imageFiles.forEach((image) => {
      if (image.previewUrl) {
        URL.revokeObjectURL(
          image.previewUrl
        );
      }
    });

    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);

    setForm({
      title: "",
      description: "",
      location: "",
      propertyType: "",
      price: "",
      bedrooms: "",
      bathrooms: "",
      parking: "",
      latitude: "",
      longitude: "",
    });

    setImageFiles([]);
    setImagePreviews([]);
    setVideoFile(null);
    setVideoPreviewUrl("");
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
        throw new Error(
          "Property title is required."
        );
      }

      if (!form.location.trim()) {
        throw new Error(
          "Property location is required."
        );
      }

      if (!form.price) {
        throw new Error(
          "Property price is required."
        );
      }

      const propertyData = {
        title: form.title.trim(),

        description:
          form.description.trim(),

        location:
          form.location.trim(),

        propertyType:
          form.propertyType.trim() ||
          null,

        price: Number(form.price),

        bedrooms:
          form.bedrooms !== ""
            ? Number(form.bedrooms)
            : null,

        bathrooms:
          form.bathrooms !== ""
            ? Number(form.bathrooms)
            : null,

        parking:
          form.parking !== ""
            ? Number(form.parking)
            : null,

        latitude:
          form.latitude !== ""
            ? Number(form.latitude)
            : null,

        longitude:
          form.longitude !== ""
            ? Number(form.longitude)
            : null,
      };

      const created =
        await createProperty(
          propertyData,
          token
        );

      const property =
        created.property;

      if (
        property &&
        imageFiles.length > 0
      ) {
        for (const image of imageFiles) {
          await uploadPropertyImage(
            property.id,
            image.file,
            token
          );
        }
      }

      if (property && videoFile) {
        await uploadPropertyVideo(property.id, videoFile, token);
      }

      setMessage(
        imageFiles.length > 0 || videoFile
          ? "Property and media uploaded successfully!"
          : "Property created successfully!"
      );

      resetForm();

      await loadProperties();

      setActiveSection(
        "properties"
      );
    } catch (err) {
      console.error(
        "CREATE PROPERTY ERROR:",
        err
      );

      setError(
        err.message ||
          "Something went wrong while creating the property."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------------
  // START EDIT
  // -----------------------------------------

  const startEditing = (property) => {
    setMessage("");
    setError("");

    setEditingProperty(property);

    setEditForm({
      title:
        property.title || "",

      description:
        property.description || "",

      location:
        property.location || "",

      propertyType:
        property.propertyType || "",

      price:
        property.price ?? "",

      bedrooms:
        property.bedrooms ?? "",

      bathrooms:
        property.bathrooms ?? "",

      parking:
        property.parking ?? "",

      latitude:
        property.latitude ?? "",

      longitude:
        property.longitude ?? "",
    });

    setActiveSection(
      "edit-property"
    );
  };

  // -----------------------------------------
  // CANCEL EDIT
  // -----------------------------------------

  const cancelEditing = () => {
    setEditingProperty(null);

    setEditForm({
      title: "",
      description: "",
      location: "",
      propertyType: "",
      price: "",
      bedrooms: "",
      bathrooms: "",
      parking: "",
      latitude: "",
      longitude: "",
    });

    setActiveSection(
      "properties"
    );
  };

  // -----------------------------------------
  // UPDATE PROPERTY
  // -----------------------------------------

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingProperty) {
      return;
    }

    setUpdating(true);
    setMessage("");
    setError("");

    try {
      if (!token) {
        throw new Error(
          "You are not logged in. Please login again."
        );
      }

      if (!editForm.title.trim()) {
        throw new Error(
          "Property title is required."
        );
      }

      if (!editForm.location.trim()) {
        throw new Error(
          "Property location is required."
        );
      }

      if (!editForm.price) {
        throw new Error(
          "Property price is required."
        );
      }

      const propertyData = {
        title:
          editForm.title.trim(),

        description:
          editForm.description.trim(),

        location:
          editForm.location.trim(),

        propertyType:
          editForm.propertyType.trim() ||
          null,

        price: Number(
          editForm.price
        ),

        bedrooms:
          editForm.bedrooms !== ""
            ? Number(
                editForm.bedrooms
              )
            : null,

        bathrooms:
          editForm.bathrooms !== ""
            ? Number(
                editForm.bathrooms
              )
            : null,

        parking:
          editForm.parking !== ""
            ? Number(
                editForm.parking
              )
            : null,

        latitude:
          editForm.latitude !== ""
            ? Number(
                editForm.latitude
              )
            : null,

        longitude:
          editForm.longitude !== ""
            ? Number(
                editForm.longitude
              )
            : null,
      };

      const updated =
        await updateProperty(
          editingProperty.id,
          propertyData,
          token
        );

      const updatedProperty =
        updated.property;

      setProperties((previous) =>
        previous.map((property) =>
          property.id ===
          editingProperty.id
            ? {
                ...property,
                ...(updatedProperty ||
                  propertyData),
              }
            : property
        )
      );

      setMessage(
        "Property updated successfully."
      );

      setEditingProperty(null);

      setActiveSection(
        "properties"
      );

      await loadProperties();
    } catch (err) {
      console.error(
        "UPDATE PROPERTY ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to update property."
      );
    } finally {
      setUpdating(false);
    }
  };

  // -----------------------------------------
  // DELETE PROPERTY
  // -----------------------------------------

  const handleDelete = async (
    propertyId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this property? This cannot be undone."
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

      await deleteProperty(
        propertyId,
        token
      );

      setMessage(
        "Property deleted successfully."
      );

      setProperties((previous) =>
        previous.filter(
          (property) =>
            property.id !==
            propertyId
        )
      );

      if (
        managingImagesProperty?.id ===
        propertyId
      ) {
        setManagingImagesProperty(
          null
        );

        setPropertyImages([]);
      }
    } catch (err) {
      console.error(
        "DELETE PROPERTY ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to delete property."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // -----------------------------------------
  // OPEN IMAGE MANAGER
  // -----------------------------------------

  const openImageManager = async (
    property
  ) => {
    setMessage("");
    setError("");

    setManagingImagesProperty(
      property
    );

    setPropertyImages([]);
    setPropertyVideos([]);

    setLoadingImages(true);

    try {
      const [imageData, videoData] = await Promise.all([
        getPropertyImages(property.id),
        getPropertyVideos(property.id),
      ]);

      setPropertyImages(
        imageData.images || []
      );
      setPropertyVideos(
        videoData.videos || []
      );

      setActiveSection(
        "manage-images"
      );
    } catch (err) {
      console.error(
        "LOAD PROPERTY IMAGES ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to load property images."
      );
    } finally {
      setLoadingImages(false);
    }
  };

  // -----------------------------------------
  // UPLOAD MORE IMAGES
  // -----------------------------------------

  const handleAdditionalImages =
    async (event) => {
      const files = Array.from(
        event.target.files || []
      );

      if (
        files.length === 0 ||
        !managingImagesProperty
      ) {
        return;
      }

      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      const validFiles =
        files.filter((file) =>
          validTypes.includes(
            file.type
          )
        );

      if (
        validFiles.length !==
        files.length
      ) {
        setError(
          "Only JPG, PNG, WEBP and GIF images are allowed."
        );

        return;
      }

      const tooLarge =
        validFiles.some(
          (file) =>
            file.size >
            5 * 1024 * 1024
        );

      if (tooLarge) {
        setError(
          "Each image must be 5MB or smaller."
        );

        return;
      }

      try {
        if (!token) {
          throw new Error(
            "You are not logged in. Please login again."
          );
        }

        setUploadingImages(true);
        setError("");
        setMessage("");

        for (const file of validFiles) {
          await uploadPropertyImage(
            managingImagesProperty.id,
            file,
            token
          );
        }

        const data =
          await getPropertyImages(
            managingImagesProperty.id
          );

        setPropertyImages(
          data.images || []
        );

        setMessage(
          `${validFiles.length} image${
            validFiles.length > 1
              ? "s"
              : ""
          } uploaded successfully.`
        );
      } catch (err) {
        console.error(
          "UPLOAD ADDITIONAL IMAGES ERROR:",
          err
        );

        setError(
          err.message ||
            "Failed to upload images."
        );
      } finally {
        setUploadingImages(false);

        event.target.value = "";
      }
    };

  // -----------------------------------------
  // DELETE IMAGE
  // -----------------------------------------

  const handleDeleteImage =
    async (image) => {
      if (
        !managingImagesProperty ||
        !token
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Remove this property photo?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingImageId(
          image.id
        );

        setError("");
        setMessage("");

        await deletePropertyImage(
          managingImagesProperty.id,
          image.id,
          token
        );

        setPropertyImages(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !==
                image.id
            )
        );

        setMessage(
          "Property photo removed."
        );

        await loadProperties();
      } catch (err) {
        console.error(
          "DELETE IMAGE ERROR:",
          err
        );

        setError(
          err.message ||
            "Failed to delete property image."
        );
      } finally {
        setDeletingImageId(
          null
        );
      }
    };

  const handleAdditionalVideo = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !managingImagesProperty) return;

    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      setError("Choose an MP4, WEBM or MOV video.");
      event.target.value = "";
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("The video must be 100MB or smaller.");
      event.target.value = "";
      return;
    }
    if (propertyVideos.length >= 3) {
      setError("A property can have up to 3 videos. Remove one before adding another.");
      event.target.value = "";
      return;
    }

    try {
      if (!token) throw new Error("You are not logged in. Please login again.");
      setUploadingVideo(true);
      setError("");
      const result = await uploadPropertyVideo(managingImagesProperty.id, file, token);
      setPropertyVideos((current) => [...current, result.video]);
      setMessage("Property video uploaded successfully.");
      await loadProperties();
    } catch (err) {
      setError(err.message || "Failed to upload property video.");
    } finally {
      setUploadingVideo(false);
      event.target.value = "";
    }
  };

  const handleDeleteVideo = async (video) => {
    if (!managingImagesProperty || !token) return;
    if (!window.confirm("Remove this property video?")) return;

    try {
      setDeletingVideoId(video.id);
      setError("");
      await deletePropertyVideo(managingImagesProperty.id, video.id, token);
      setPropertyVideos((current) => current.filter((item) => item.id !== video.id));
      setMessage("Property video removed.");
      await loadProperties();
    } catch (err) {
      setError(err.message || "Failed to delete property video.");
    } finally {
      setDeletingVideoId(null);
    }
  };

  // -----------------------------------------
  // NAVIGATION
  // -----------------------------------------

  const handleNavigation = (
    section
  ) => {
    setMessage("");
    setError("");
    setActiveSection(section);
  };

  // -----------------------------------------
  // PROPERTY CARD
  // -----------------------------------------

  const PropertyCard = ({
    property,
  }) => {
    const imageUrl =
      getImageUrl(
        property.imageUrl
      );

    const imageCount =
      property.images?.length ||
      0;

    return (
      <div className="property-card">
        <div className="property-image">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={
                  property.title
                }
              />

              {imageCount > 0 && (
                <span className="cover-badge">
                  📸 {imageCount}
                </span>
              )}
            </>
          ) : (
            <div className="property-no-image">
              <span>🏠</span>
              <p>No image</p>
            </div>
          )}
        </div>

        <div className="property-card-content">
          <h3>
            {property.title}
          </h3>

          <p className="property-location">
            📍 {property.location}
          </p>

          <p className="property-price">
            KSh{" "}
            {Number(
              property.price || 0
            ).toLocaleString()}
            {" / month"}
          </p>

          <div className="property-details">
            <span>
              🏷️{" "}
              {property.propertyType ||
                "Property"}
            </span>

            <span>
              🚗{" "}
              {property.parking ??
                0}{" "}
              Parking
            </span>
          </div>

          <div className="property-details">
            <span>
              🛏️{" "}
              {property.bedrooms ??
                0}{" "}
              Beds
            </span>

            <span>
              🚿{" "}
              {property.bathrooms ??
                0}{" "}
              Baths
            </span>
          </div>

          <div className="property-actions">
            <button
              type="button"
              className="view-property-btn"
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
              View
            </button>

            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                startEditing(
                  property
                )
              }
            >
              ✏️ Edit
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                openImageManager(
                  property
                )
              }
            >
              📸 Photos
            </button>

            <button
              type="button"
              className="delete-property-btn"
              onClick={() =>
                handleDelete(
                  property.id
                )
              }
              disabled={
                deletingId ===
                property.id
              }
            >
              {deletingId ===
              property.id
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

  const roleMeta = {
    OWNER: {
      title: "Property Owner Dashboard",
      summary:
        "Track listings, renew promotions, and review property activity from one place.",
      primaryAction: "+ Post a Property",
      secondaryAction: "Manage my properties",
    },
    AGENT: {
      title: "Agent Workspace",
      summary:
        "Review client inquiries, property matches, and placements across your active listings.",
      primaryAction: "+ Add Listing",
      secondaryAction: "View saved prospects",
    },
    CARETAKER: {
      title: "Caretaker Overview",
      summary:
        "Monitor property readiness, task updates, and maintenance follow-ups for managed spaces.",
      primaryAction: "+ Review properties",
      secondaryAction: "Check notifications",
    },
    ADMIN: {
      title: "Admin Control Center",
      summary:
        "Oversee platform activity, user management, and operational health across MTAA.",
      primaryAction: "Open admin panel",
      secondaryAction: "Review team activity",
    },
    USER: {
      title: "My Overview",
      summary:
        "Keep up with saved homes, profile activity, and your property interests in one place.",
      primaryAction: "Browse properties",
      secondaryAction: "View saved homes",
    },
  };

  const currentRoleMeta =
    roleMeta[user?.role] || roleMeta.USER;

  const renderOverview = () => {
    return (
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h1>
              Welcome, {user?.name || "User"} 👋
            </h1>

            <p>{currentRoleMeta.summary}</p>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">🏠</div>

            <div>
              <span className="stat-label">My Properties</span>

              <strong>{properties.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📸</div>

            <div>
              <span className="stat-label">Listings</span>

              <strong>
                {properties.filter((property) => property.imageUrl).length}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👤</div>

            <div>
              <span className="stat-label">Account</span>

              <strong>{user?.role || "USER"}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-welcome-card">
          <h2>{currentRoleMeta.title}</h2>

          <p>
            {user?.role === "OWNER" &&
              "Add rental properties, manage pricing, and keep your MTAA listings current."}
            {user?.role === "AGENT" &&
              "Track opportunities, coordinate with owners, and respond faster to buyer or tenant requests."}
            {user?.role === "CARETAKER" &&
              "Review property conditions, upkeep tasks, and asset readiness to support a smooth tenant experience."}
            {(!user?.role || user?.role === "USER") &&
              "Manage saved homes, browse listings, and keep your profile and preferences up to date."}
          </p>

          <div className="dashboard-role-actions">
            <button
              type="button"
              onClick={() =>
                user?.role === "OWNER" || user?.role === "AGENT"
                  ? handleNavigation("add-property")
                  : user?.role === "USER"
                    ? (onOpenSavedProperties ? onOpenSavedProperties() : handleNavigation("properties"))
                    : handleNavigation("overview")
              }
            >
              {currentRoleMeta.primaryAction}
            </button>

            <button
              type="button"
              className="secondary-action-btn"
              onClick={() => {
                if (user?.role === "USER" && onOpenSavedProperties) {
                  onOpenSavedProperties();
                  return;
                }

                if (onOpenNotifications) {
                  onOpenNotifications();
                  return;
                }

                handleNavigation("properties");
              }}
            >
              {currentRoleMeta.secondaryAction}
            </button>
          </div>
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
            <h1>
              My Properties
            </h1>

            <p>
              Manage your
              properties posted on
              MTAA.
            </p>
          </div>

          <button
            type="button"
            className="primary-btn"
            onClick={() =>
              handleNavigation(
                "add-property"
              )
            }
          >
            + Add Property
          </button>
        </div>

        {loadingProperties ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>

            <p>
              Loading properties...
            </p>
          </div>
        ) : properties.length ===
          0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              🏠
            </div>

            <h2>
              No properties yet
            </h2>

            <p>
              You have not posted
              any properties.
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                handleNavigation(
                  "add-property"
                )
              }
            >
              Post Your First
              Property
            </button>
          </div>
        ) : (
          <div className="properties-grid">
            {properties.map(
              (property) => (
                <PropertyCard
                  key={
                    property.id
                  }
                  property={
                    property
                  }
                />
              )
            )}
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
            <h1>
              Post a Property
            </h1>

            <p>
              Add your property to
              the MTAA platform.
            </p>
          </div>
        </div>

        <form
          className="property-form"
          onSubmit={
            handleSubmit
          }
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
              onChange={
                handleChange
              }
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
              value={
                form.description
              }
              onChange={
                handleChange
              }
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
              value={
                form.location
              }
              onChange={
                handleChange
              }
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="propertyType">
                Property Type
              </label>

              <select
                id="propertyType"
                name="propertyType"
                value={
                  form.propertyType
                }
                onChange={
                  handleChange
                }
              >
                <option value="">
                  Select property type
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

                <option value="Studio">
                  Studio
                </option>

                <option value="Hostel">
                  Hostel
                </option>

                <option value="Maisonette">
                  Maisonette
                </option>

                <option value="Villa">
                  Villa
                </option>

                <option value="Commercial">
                  Commercial
                </option>
              </select>
            </div>

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
                value={
                  form.price
                }
                onChange={
                  handleChange
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
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
                value={
                  form.bedrooms
                }
                onChange={
                  handleChange
                }
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
                value={
                  form.bathrooms
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="parking">
                Parking Spaces
              </label>

              <input
                id="parking"
                name="parking"
                type="number"
                min="0"
                placeholder="1"
                value={
                  form.parking
                }
                onChange={
                  handleChange
                }
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">
                Latitude
              </label>

              <input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                placeholder="-1.2196"
                value={
                  form.latitude
                }
                onChange={
                  handleChange
                }
              />

              <small>
                Example: -1.2196
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="longitude">
                Longitude
              </label>

              <input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                placeholder="36.8869"
                value={
                  form.longitude
                }
                onChange={
                  handleChange
                }
              />

              <small>
                Example: 36.8869
              </small>
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
              onChange={
                handleImageChange
              }
            />

            <small>
              JPG, PNG, WEBP or GIF.
              Maximum 5MB per
              image.
            </small>
          </div>

          {imagePreviews.length >
            0 && (
            <div className="image-preview-section">
              <h3>
                Selected Images (
                {
                  imagePreviews.length
                }
                )
              </h3>

              <div className="image-preview-grid">
                {imagePreviews.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      className="image-preview-card"
                      key={
                        image.id
                      }
                    >
                      <img
                        src={
                          image.previewUrl
                        }
                        alt={`Property preview ${
                          index + 1
                        }`}
                      />

                      {index ===
                        0 && (
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
                  )
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="property-video">Property Video</label>
            <input
              id="property-video"
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoChange}
            />
            <small>MP4, WEBM or MOV. Maximum 100MB. One video per upload.</small>
          </div>

          {videoPreviewUrl && (
            <div className="property-video-preview">
              <video src={videoPreviewUrl} controls playsInline />
              <div>
                <span>{videoFile?.name}</span>
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => {
                    URL.revokeObjectURL(videoPreviewUrl);
                    setVideoFile(null);
                    setVideoPreviewUrl("");
                  }}
                >
                  Remove video
                </button>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={
                resetForm
              }
              disabled={
                submitting
              }
            >
              Clear
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={
                submitting
              }
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
  // EDIT PROPERTY
  // -----------------------------------------

  const renderEditProperty = () => {
    if (!editingProperty) {
      return null;
    }

    return (
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h1>
              ✏️ Edit Property
            </h1>

            <p>
              Update your property
              information.
            </p>
          </div>

          <button
            type="button"
            className="secondary-btn"
            onClick={
              cancelEditing
            }
          >
            ← Back
          </button>
        </div>

        <form
          className="property-form"
          onSubmit={
            handleUpdate
          }
        >
          <div className="form-group">
            <label htmlFor="edit-title">
              Property Title
            </label>

            <input
              id="edit-title"
              name="title"
              type="text"
              value={
                editForm.title
              }
              onChange={
                handleEditChange
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-description">
              Description
            </label>

            <textarea
              id="edit-description"
              name="description"
              rows="6"
              value={
                editForm.description
              }
              onChange={
                handleEditChange
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-location">
              Location
            </label>

            <input
              id="edit-location"
              name="location"
              type="text"
              value={
                editForm.location
              }
              onChange={
                handleEditChange
              }
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-propertyType">
                Property Type
              </label>

              <select
                id="edit-propertyType"
                name="propertyType"
                value={
                  editForm.propertyType
                }
                onChange={
                  handleEditChange
                }
              >
                <option value="">
                  Select property type
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

                <option value="Studio">
                  Studio
                </option>

                <option value="Hostel">
                  Hostel
                </option>

                <option value="Maisonette">
                  Maisonette
                </option>

                <option value="Villa">
                  Villa
                </option>

                <option value="Commercial">
                  Commercial
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-price">
                Monthly Rent (KSh)
              </label>

              <input
                id="edit-price"
                name="price"
                type="number"
                min="0"
                value={
                  editForm.price
                }
                onChange={
                  handleEditChange
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-bedrooms">
                Bedrooms
              </label>

              <input
                id="edit-bedrooms"
                name="bedrooms"
                type="number"
                min="0"
                value={
                  editForm.bedrooms
                }
                onChange={
                  handleEditChange
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-bathrooms">
                Bathrooms
              </label>

              <input
                id="edit-bathrooms"
                name="bathrooms"
                type="number"
                min="0"
                value={
                  editForm.bathrooms
                }
                onChange={
                  handleEditChange
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-parking">
                Parking Spaces
              </label>

              <input
                id="edit-parking"
                name="parking"
                type="number"
                min="0"
                value={
                  editForm.parking
                }
                onChange={
                  handleEditChange
                }
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-latitude">
                Latitude
              </label>

              <input
                id="edit-latitude"
                name="latitude"
                type="number"
                step="any"
                placeholder="-1.2196"
                value={
                  editForm.latitude
                }
                onChange={
                  handleEditChange
                }
              />

              <small>
                Example: -1.2196
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="edit-longitude">
                Longitude
              </label>

              <input
                id="edit-longitude"
                name="longitude"
                type="number"
                step="any"
                placeholder="36.8869"
                value={
                  editForm.longitude
                }
                onChange={
                  handleEditChange
                }
              />

              <small>
                Example: 36.8869
              </small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={
                cancelEditing
              }
              disabled={
                updating
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={
                updating
              }
            >
              {updating
                ? "Saving Changes..."
                : "💾 Save Changes"}
            </button>
          </div>
        </form>
      </section>
    );
  };

  // -----------------------------------------
  // MANAGE PROPERTY IMAGES
  // -----------------------------------------

  const renderManageImages = () => {
    if (
      !managingImagesProperty
    ) {
      return null;
    }

    return (
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h1>
              📸 Property Photos
            </h1>

            <p>
              {
                managingImagesProperty.title
              }
            </p>
          </div>

          <button
            type="button"
            className="secondary-btn"
            onClick={() =>
              handleNavigation(
                "properties"
              )
            }
          >
            ← Back
          </button>
        </div>

        <div className="image-manager">
          <div className="image-manager-upload">
            <h2>
              Add More Photos
            </h2>

            <p>
              Upload additional
              photos for this
              property.
            </p>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={
                handleAdditionalImages
              }
              disabled={
                uploadingImages
              }
            />

            <small>
              JPG, PNG, WEBP or GIF.
              Maximum 5MB per
              image.
            </small>

            {uploadingImages && (
              <p>
                Uploading images...
              </p>
            )}
          </div>

          <div className="image-manager-gallery">
            <h2>
              Current Photos (
              {propertyImages.length})
            </h2>

            {loadingImages ? (
              <div className="dashboard-loading">
                <div className="loading-spinner"></div>

                <p>
                  Loading photos...
                </p>
              </div>
            ) : propertyImages.length ===
              0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  📷
                </div>

                <h2>
                  No photos
                  uploaded
                </h2>

                <p>
                  Add photos using
                  the uploader above.
                </p>
              </div>
            ) : (
              <div className="image-preview-grid">
                {propertyImages.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      className="image-preview-card"
                      key={
                        image.id
                      }
                    >
                      <img
                        src={getImageUrl(
                          image.url
                        )}
                        alt={`${managingImagesProperty.title} ${
                          index + 1
                        }`}
                      />

                      {index ===
                        0 && (
                        <span className="cover-badge">
                          Cover
                        </span>
                      )}

                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() =>
                          handleDeleteImage(
                            image
                          )
                        }
                        disabled={
                          deletingImageId ===
                          image.id
                        }
                      >
                        {deletingImageId ===
                        image.id
                          ? "..."
                          : "×"}
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <section className="property-video-manager">
          <div>
            <h2>Property Videos ({propertyVideos.length}/3)</h2>
            <p>Upload an MP4, WEBM or MOV tour video. Maximum 100MB per video.</p>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleAdditionalVideo}
              disabled={uploadingVideo || propertyVideos.length >= 3}
            />
            {uploadingVideo && <p>Uploading video...</p>}
          </div>
          {propertyVideos.length > 0 && (
            <div className="property-video-grid">
              {propertyVideos.map((video) => (
                <article className="property-video-card" key={video.id}>
                  <video src={getImageUrl(video.url)} controls playsInline preload="metadata" />
                  <div>
                    <span>{video.originalName}</span>
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => handleDeleteVideo(video)}
                      disabled={deletingVideoId === video.id}
                    >
                      {deletingVideoId === video.id ? "Removing..." : "Remove video"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
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

          <span>
            Property Platform
          </span>
        </div>

        <nav className="dashboard-nav">
          <button
            type="button"
            className={
              activeSection ===
              "overview"
                ? "active"
                : ""
            }
            onClick={() =>
              handleNavigation(
                "overview"
              )
            }
          >
            <span>📊</span>
            Overview
          </button>

          <button
            type="button"
            className={
              activeSection ===
              "properties"
                ? "active"
                : ""
            }
            onClick={() =>
              handleNavigation(
                "properties"
              )
            }
          >
            <span>🏠</span>
            My Properties
          </button>

          <button
            type="button"
            className={
              activeSection ===
              "add-property"
                ? "active"
                : ""
            }
            onClick={() =>
              handleNavigation(
                "add-property"
              )
            }
          >
            <span>➕</span>
            Post Property
          </button>

          <button
            type="button"
            className="saved-properties-link"
            onClick={() => {
              if (onOpenSavedProperties) {
                onOpenSavedProperties();
              }
            }}
          >
            <span>💾</span>
            Saved Properties
          </button>

          <button
            type="button"
            className="profile-link"
            onClick={() => {
              if (onOpenProfile) {
                onOpenProfile();
              }
            }}
          >
            <span>👤</span>
            My Profile
          </button>

          <button
            type="button"
            className="payments-link"
            onClick={() => {
              if (onOpenPayments) {
                onOpenPayments();
              }
            }}
          >
            <span>💳</span>
            Payments
          </button>

          <button
            type="button"
            className="notifications-link"
            onClick={() => {
              if (onOpenNotifications) {
                onOpenNotifications();
              }
            }}
          >
            <span>🔔</span>
            Notifications
          </button>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user">
            <div className="user-avatar">
              {(user?.name ||
                "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.name ||
                  "User"}
              </strong>

              <span>
                {user?.role ||
                  "USER"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={
              onLogout
            }
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span>MTAA</span>

            <strong>
              Dashboard
            </strong>
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

          {activeSection ===
            "overview" &&
            renderOverview()}

          {activeSection ===
            "properties" &&
            renderProperties()}

          {activeSection ===
            "add-property" &&
            renderAddProperty()}

          {activeSection ===
            "edit-property" &&
            renderEditProperty()}

          {activeSection ===
            "manage-images" &&
            renderManageImages()}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;