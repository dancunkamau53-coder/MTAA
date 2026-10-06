import { useEffect, useState } from "react";

import {
  getProperty,
  getNearbyPlaces,
  togglePropertyLike,
  togglePropertySave,
  getPropertyInteractionStatus,
  getPropertyComments,
  addPropertyComment,
  deletePropertyComment,
} from "./services/api";

import "./PropertyDetails.css";

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  window.location.origin;

function PropertyDetails({
  propertyId,
  onBack,
}) {
  const [property, setProperty] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedImage, setSelectedImage] =
    useState(0);

  const [liked, setLiked] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [likeCount, setLikeCount] =
    useState(0);

  // =====================================================
  // COMMENTS STATE
  // =====================================================

  const [comments, setComments] =
    useState([]);

  const [commentText, setCommentText] =
    useState("");

  const [commentsLoading, setCommentsLoading] =
    useState(true);

  const [commentSubmitting, setCommentSubmitting] =
    useState(false);

  const [commentError, setCommentError] =
    useState("");

  // =====================================================
  // NEARBY PLACES STATE
  // =====================================================

  const [nearbyPlaces, setNearbyPlaces] =
    useState([]);

  const [nearbyLoading, setNearbyLoading] =
    useState(false);

  const [nearbyError, setNearbyError] =
    useState("");

  // =====================================================
  // LOAD PROPERTY
  // =====================================================

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getProperty(propertyId);

        const loadedProperty =
          data?.property ||
          data?.data?.property ||
          data;

        setProperty(
          loadedProperty
        );

        setLikeCount(
          Number(
            loadedProperty?.likesCount ||
              loadedProperty?.likeCount ||
              loadedProperty?.likes?.length ||
              0
          )
        );
      } catch (err) {
        console.error(
          "Failed to load property:",
          err
        );

        setError(
          err.message ||
            "Failed to load property."
        );
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  // =====================================================
  // LOAD INTERACTION STATUS
  // =====================================================

  useEffect(() => {
    const loadInteractionStatus =
      async () => {
        const token =
          localStorage.getItem(
            "mtaa_token"
          );

        if (
          !token ||
          !propertyId
        ) {
          return;
        }

        try {
          const data =
            await getPropertyInteractionStatus(
              propertyId,
              token
            );

          setLiked(
            Boolean(
              data?.liked ||
                data?.isLiked ||
                data?.data?.liked ||
                data?.data?.isLiked
            )
          );

          setSaved(
            Boolean(
              data?.saved ||
                data?.isSaved ||
                data?.data?.saved ||
                data?.data?.isSaved
            )
          );

          const count =
            data?.likesCount ??
            data?.likeCount ??
            data?.data?.likesCount ??
            data?.data?.likeCount;

          if (
            count !== undefined
          ) {
            setLikeCount(
              Number(count)
            );
          }
        } catch (err) {
          console.error(
            "Failed to load interaction status:",
            err
          );
        }
      };

    loadInteractionStatus();
  }, [propertyId]);

  // =====================================================
  // LOAD COMMENTS
  // =====================================================

  useEffect(() => {
    const loadComments =
      async () => {
        if (!propertyId) {
          return;
        }

        try {
          setCommentsLoading(true);
          setCommentError("");

          const data =
            await getPropertyComments(
              propertyId
            );

          const loadedComments =
            data?.comments ||
            data?.data?.comments ||
            data?.data ||
            (Array.isArray(data)
              ? data
              : []);

          setComments(
            Array.isArray(
              loadedComments
            )
              ? loadedComments
              : []
          );
        } catch (err) {
          console.error(
            "Failed to load comments:",
            err
          );

          setCommentError(
            err.message ||
              "Failed to load comments."
          );
        } finally {
          setCommentsLoading(false);
        }
      };

    loadComments();
  }, [propertyId]);

  // =====================================================
  // LOAD NEARBY PLACES
  // =====================================================

  useEffect(() => {
    const loadNearbyPlaces =
      async () => {
        if (
          !propertyId ||
          property?.latitude === null ||
          property?.latitude === undefined ||
          property?.longitude === null ||
          property?.longitude === undefined
        ) {
          setNearbyPlaces([]);
          setNearbyLoading(false);
          return;
        }

        try {
          setNearbyLoading(true);
          setNearbyError("");

          const data =
            await getNearbyPlaces(
              propertyId
            );

          const places =
            data?.places ||
            data?.data?.places ||
            [];

          setNearbyPlaces(
            Array.isArray(places)
              ? places
              : []
          );
        } catch (err) {
          console.error(
            "Failed to load nearby places:",
            err
          );

          setNearbyError(
            err.message ||
              "Failed to load nearby places."
          );

          setNearbyPlaces([]);
        } finally {
          setNearbyLoading(false);
        }
      };

    loadNearbyPlaces();
  }, [
    propertyId,
    property?.latitude,
    property?.longitude,
  ]);

  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (
    image
  ) => {
    if (!image) {
      return "";
    }

    const url =
      typeof image === "string"
        ? image
        : image.url ||
          image.imageUrl;

    if (!url) {
      return "";
    }

    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    return (
      API_ORIGIN +
      (url.startsWith("/")
        ? url
        : "/" + url)
    );
  };

  // =====================================================
  // PROPERTY IMAGES
  // =====================================================

  const propertyImages =
    property?.images?.length
      ? property.images
      : property?.imageUrl
        ? [property.imageUrl]
        : [];

  const galleryItems = [
    ...propertyImages.map(
      (image) => ({
        type: "image",
        media: image,
      })
    ),

    ...(property?.videos || []).map(
      (video) => ({
        type: "video",
        media: video,
      })
    ),
  ];

  if (
    galleryItems.length === 0
  ) {
    galleryItems.push({
      type: "image",
      media:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    });
  }

  const selectedMedia =
    galleryItems[selectedImage] ||
    galleryItems[0];

  // =====================================================
  // IMAGE NAVIGATION
  // =====================================================

  const nextImage = () => {
    setSelectedImage(
      (current) =>
        (current + 1) %
        galleryItems.length
    );
  };

  const previousImage = () => {
    setSelectedImage(
      (current) =>
        (current -
          1 +
          galleryItems.length) %
        galleryItems.length
    );
  };

  // =====================================================
  // LIKE
  // =====================================================

  const handleLike = async () => {
    const token =
      localStorage.getItem(
        "mtaa_token"
      );

    if (!token) {
      alert(
        "Please login to like this property."
      );
      return;
    }

    try {
      const data =
        await togglePropertyLike(
          propertyId,
          token
        );

      const newLiked =
        data?.liked ??
        data?.isLiked ??
        data?.data?.liked ??
        data?.data?.isLiked;

      if (
        newLiked !== undefined
      ) {
        setLiked(
          Boolean(newLiked)
        );
      } else {
        setLiked(
          (current) => !current
        );
      }

      const count =
        data?.likeCount ??
        data?.likesCount ??
        data?.data?.likeCount ??
        data?.data?.likesCount;

      if (
        count !== undefined
      ) {
        setLikeCount(
          Number(count)
        );
      } else {
        setLikeCount(
          (current) =>
            liked
              ? Math.max(
                  0,
                  current - 1
                )
              : current + 1
        );
      }
    } catch (err) {
      alert(
        err.message ||
          "Failed to update like."
      );
    }
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSave = async () => {
    const token =
      localStorage.getItem(
        "mtaa_token"
      );

    if (!token) {
      alert(
        "Please login to save this property."
      );
      return;
    }

    try {
      const data =
        await togglePropertySave(
          propertyId,
          token
        );

      const newSaved =
        data?.saved ??
        data?.isSaved ??
        data?.data?.saved ??
        data?.data?.isSaved;

      if (
        newSaved !== undefined
      ) {
        setSaved(
          Boolean(newSaved)
        );
      } else {
        setSaved(
          (current) => !current
        );
      }
    } catch (err) {
      alert(
        err.message ||
          "Failed to save property."
      );
    }
  };

  // =====================================================
  // SHARE
  // =====================================================

  const handleShare = async () => {
    const shareUrl =
      window.location.href;

    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            property?.title ||
            "MTAA Property",
          text:
            "Check out this property on MTAA.",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          shareUrl
        );

        alert(
          "Property link copied!"
        );
      }
    } catch (err) {
      console.error(
        "Share cancelled or failed:",
        err
      );
    }
  };

  // =====================================================
  // CONTACT OWNER
  // =====================================================

  const handleContactOwner =
    () => {
      const phone =
        property?.owner?.phone;

      if (phone) {
        window.location.href =
          "tel:" + phone;
        return;
      }

      const email =
        property?.owner?.email;

      if (email) {
        window.location.href =
          "mailto:" + email;
        return;
      }

      alert(
        "The property owner has not provided contact details."
      );
    };

  // =====================================================
  // ADD COMMENT
  // =====================================================

  const handleAddComment =
    async (event) => {
      event.preventDefault();

      const token =
        localStorage.getItem(
          "mtaa_token"
        );

      if (!token) {
        alert(
          "Please login to comment on this property."
        );
        return;
      }

      const trimmedComment =
        commentText.trim();

      if (!trimmedComment) {
        setCommentError(
          "Please write a comment before posting."
        );
        return;
      }

      if (
        trimmedComment.length >
        500
      ) {
        setCommentError(
          "Comment cannot exceed 500 characters."
        );
        return;
      }

      try {
        setCommentSubmitting(
          true
        );

        setCommentError("");

        const data =
          await addPropertyComment(
            propertyId,
            trimmedComment,
            token
          );

        const newComment =
          data?.comment ||
          data?.data?.comment ||
          data?.data;

        if (
          newComment &&
          typeof newComment ===
            "object"
        ) {
          setComments(
            (current) => [
              newComment,
              ...current,
            ]
          );
        } else {
          const refreshed =
            await getPropertyComments(
              propertyId
            );

          const refreshedComments =
            refreshed?.comments ||
            refreshed?.data?.comments ||
            refreshed?.data ||
            (Array.isArray(
              refreshed
            )
              ? refreshed
              : []);

          setComments(
            Array.isArray(
              refreshedComments
            )
              ? refreshedComments
              : []
          );
        }

        setCommentText("");
      } catch (err) {
        console.error(
          "Failed to add comment:",
          err
        );

        setCommentError(
          err.message ||
            "Failed to add comment."
        );
      } finally {
        setCommentSubmitting(
          false
        );
      }
    };

  // =====================================================
  // DELETE COMMENT
  // =====================================================

  const handleDeleteComment =
    async (commentId) => {
      const token =
        localStorage.getItem(
          "mtaa_token"
        );

      if (!token) {
        alert(
          "Please login first."
        );
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this comment?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await deletePropertyComment(
          propertyId,
          commentId,
          token
        );

        setComments(
          (current) =>
            current.filter(
              (comment) =>
                comment.id !==
                commentId
            )
        );
      } catch (err) {
        alert(
          err.message ||
            "Failed to delete comment."
        );
      }
    };

  // =====================================================
  // CURRENT USER
  // =====================================================

  let currentUser = null;

  try {
    const storedUser =
      localStorage.getItem(
        "mtaa_user"
      );

    if (storedUser) {
      currentUser =
        JSON.parse(storedUser);
    }
  } catch (err) {
    console.error(
      "Failed to read current user:",
      err
    );
  }

  // =====================================================
  // COMMENT HELPERS
  // =====================================================

  const getCommentUser =
    (comment) =>
      comment?.user ||
      comment?.author ||
      comment?.createdBy ||
      {};

  const getCommentUserName =
    (comment) => {
      const user =
        getCommentUser(comment);

      return (
        user?.name ||
        comment?.userName ||
        comment?.authorName ||
        "MTAA User"
      );
    };

  const getCommentUserRole =
    (comment) => {
      const user =
        getCommentUser(comment);

      return (
        user?.role ||
        comment?.userRole ||
        "USER"
      );
    };

  const canDeleteComment =
    (comment) => {
      if (
        !currentUser ||
        !comment
      ) {
        return false;
      }

      const user =
        getCommentUser(comment);

      const currentUserId =
        currentUser.id ||
        currentUser.userId;

      const commentUserId =
        comment.userId ||
        comment.authorId ||
        user.id ||
        user.userId;

      if (
        currentUserId &&
        commentUserId
      ) {
        return (
          String(
            currentUserId
          ) ===
          String(
            commentUserId
          )
        );
      }

      return false;
    };

  const formatCommentDate =
    (date) => {
      if (!date) {
        return "";
      }

      const parsedDate =
        new Date(date);

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return "";
      }

      return parsedDate.toLocaleString(
        "en-KE",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );
    };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="property-details-loading">

        <div className="loading-spinner"></div>

        <p>
          Loading property...
        </p>

      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (
    error ||
    !property
  ) {
    return (
      <div className="property-details-error">

        <div className="error-icon">
          ⚠️
        </div>

        <h2>
          Property Not Found
        </h2>

        <p>
          {error ||
            "This property could not be loaded."}
        </p>

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Go Back
        </button>

      </div>
    );
  }

  // =====================================================
  // OWNER
  // =====================================================

  const ownerName =
    property.owner?.name ||
    "MTAA Property Owner";

  const ownerRole =
    property.owner?.role ||
    "PROPERTY OWNER";

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="property-details-page">

      {/* HEADER */}

      <header className="property-details-header">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="header-brand">

          <strong>
            MTAA
          </strong>

          <span>
            Property Details
          </span>

        </div>

      </header>

      {/* MAIN */}

      <main className="property-details-container">

        {/* GALLERY */}

        <section className="property-gallery">

          <div className="property-main-image">

            {selectedMedia.type ===
            "video" ? (
              <video
                className="property-gallery-video"
                src={getImageUrl(
                  selectedMedia.media.url
                )}
                controls
                playsInline
                preload="metadata"
                aria-label={`${property.title || "Property"} video tour`}
              />
            ) : (
              <img
                src={getImageUrl(
                  selectedMedia.media
                )}
                alt={
                  property.title ||
                  "Property"
                }
              />
            )}

            <div className="property-image-badge">

              🏠{" "}
              {property.propertyType ||
                "Property"}

            </div>

            {galleryItems.length >
              1 && (
              <>

                <button
                  className="gallery-arrow gallery-arrow-left"
                  onClick={
                    previousImage
                  }
                  aria-label="Previous image"
                >
                  ‹
                </button>

                <button
                  className="gallery-arrow gallery-arrow-right"
                  onClick={
                    nextImage
                  }
                  aria-label="Next image"
                >
                  ›
                </button>

                <div className="property-image-count">

                  {selectedImage +
                    1}{" "}
                  /{" "}
                  {galleryItems.length}

                </div>

              </>
            )}

          </div>

          {galleryItems.length >
            1 && (
            <div className="property-thumbnails">

              {galleryItems.map(
                (
                  item,
                  index
                ) => (
                  <button
                    key={
                      item.media?.id ||
                      index
                    }
                    className={
                      "property-thumbnail " +
                      (selectedImage ===
                      index
                        ? "active"
                        : "")
                    }
                    onClick={() =>
                      setSelectedImage(
                        index
                      )
                    }
                  >

                    {item.type ===
                    "video" ? (
                      <span className="property-video-thumbnail">

                        <strong aria-hidden="true">
                          ▶
                        </strong>

                        <small>
                          Video tour
                        </small>

                      </span>
                    ) : (
                      <img
                        src={getImageUrl(
                          item.media
                        )}
                        alt={`Property photo ${
                          index + 1
                        }`}
                      />
                    )}

                  </button>
                )
              )}

            </div>
          )}

        </section>

        {/* PROPERTY INFORMATION */}

        <section className="property-information">

          <div className="property-title-section">

            <div>

              <span className="property-type-label">

                {property.propertyType ||
                  "PROPERTY"}

              </span>

              <h1>
                {property.title}
              </h1>

              <p className="property-location">

                📍{" "}
                {property.location}

              </p>

            </div>

            <div className="property-price">

              <strong>

                KSh{" "}
                {Number(
                  property.price ||
                    0
                ).toLocaleString()}

              </strong>

              <span>
                per month
              </span>

            </div>

          </div>

          {/* FEATURES */}

          <div className="property-features">

            <div className="feature-box">

              <span>
                🛏️
              </span>

              <strong>
                {property.bedrooms ??
                  "—"}
              </strong>

              <small>
                Bedrooms
              </small>

            </div>

            <div className="feature-box">

              <span>
                🚿
              </span>

              <strong>
                {property.bathrooms ??
                  "—"}
              </strong>

              <small>
                Bathrooms
              </small>

            </div>

            <div className="feature-box">

              <span>
                🚗
              </span>

              <strong>
                {property.parking ??
                  "—"}
              </strong>

              <small>
                Parking
              </small>

            </div>

          </div>

          {/* DESCRIPTION */}

          <section className="details-section">

            <h2>
              About This Property
            </h2>

            <p>

              {property.description ||
                "No description has been provided for this property yet."}

            </p>

          </section>

          {/* LOCATION */}

          <section className="details-section">

            <h2>
              📍 Location
            </h2>

            <div className="location-card">

              <strong>
                {property.location}
              </strong>

              {property.latitude !==
                null &&
                property.latitude !==
                  undefined &&
                property.longitude !==
                  null &&
                property.longitude !==
                  undefined && (
                  <p>

                    Coordinates:{" "}

                    {
                      property.latitude
                    }

                    ,{" "}

                    {
                      property.longitude
                    }

                  </p>
                )}

            </div>

          </section>

          {/* =================================================
              NEARBY SERVICES
          ================================================= */}

          <section className="details-section">

            <h2>
              🧭 Nearby Services
            </h2>

            {/* LOADING */}

            {nearbyLoading && (
              <div className="nearby-services-grid">

                <div className="nearby-service-card">

                  <div className="nearby-service-icon">
                    📍
                  </div>

                  <div className="nearby-service-body">

                    <strong>
                      Finding nearby places...
                    </strong>

                    <span>
                      Checking real locations around this property
                    </span>

                  </div>

                </div>

              </div>
            )}

            {/* ERROR */}

            {!nearbyLoading &&
              nearbyError && (
                <div className="nearby-service-card">

                  <div className="nearby-service-icon">
                    ⚠️
                  </div>

                  <div className="nearby-service-body">

                    <strong>
                      Nearby places unavailable
                    </strong>

                    <span>
                      {nearbyError}
                    </span>

                  </div>

                </div>
              )}

            {/* NO RESULTS */}

            {!nearbyLoading &&
              !nearbyError &&
              nearbyPlaces.length ===
                0 && (
                <div className="nearby-service-card">

                  <div className="nearby-service-icon">
                    📍
                  </div>

                  <div className="nearby-service-body">

                    <strong>
                      No nearby places found
                    </strong>

                    <span>
                      This property may not have GPS coordinates or nearby services have not been mapped yet.
                    </span>

                  </div>

                </div>
              )}

            {/* REAL PLACES */}

            {!nearbyLoading &&
              !nearbyError &&
              nearbyPlaces.length >
                0 && (
                <div className="nearby-services-grid">

                  {nearbyPlaces.map(
                    (place) => (
                      <div
                        className="nearby-service-card"
                        key={place.id}
                      >

                        <div className="nearby-service-icon">
                          {place.icon}
                        </div>

                        <div className="nearby-service-body">

                          <strong>
                            {place.name}
                          </strong>

                          <span>
                            {place.detail}
                          </span>

                        </div>

                        <div className="nearby-service-distance">

                          <strong>
                            {place.value}
                            {place.unit}
                          </strong>

                          <small>
                            away
                          </small>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

          </section>

          {/* OWNER */}

          <section className="details-section">

            <h2>
              Property Owner
            </h2>

            <div className="owner-card">

              <div className="owner-avatar">

                {ownerName
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div className="owner-information">

                <strong>
                  {ownerName}
                </strong>

                <span>
                  {ownerRole}
                </span>

                {property.owner
                  ?.email && (
                  <small>

                    ✉️{" "}
                    {
                      property.owner
                        .email
                    }

                  </small>
                )}

                {property.owner
                  ?.phone && (
                  <small>

                    📞{" "}
                    {
                      property.owner
                        .phone
                    }

                  </small>
                )}

              </div>

            </div>

          </section>

          {/* ACTIONS */}

          <section className="property-actions">

            <button
              className="contact-button"
              onClick={
                handleContactOwner
              }
            >
              📞 Contact Owner
            </button>

            <button
              className={
                "save-button " +
                (saved
                  ? "active"
                  : "")
              }
              onClick={
                handleSave
              }
            >
              {saved
                ? "🔖 Saved"
                : "🔖 Save Property"}
            </button>

            <button
              className={
                "like-button " +
                (liked
                  ? "active"
                  : "")
              }
              onClick={
                handleLike
              }
            >

              {liked
                ? "❤️"
                : "🤍"}{" "}

              Like

              {likeCount >
                0 &&
                " (" +
                  likeCount +
                  ")"}

            </button>

            <button
              className="share-button"
              onClick={
                handleShare
              }
            >
              📤 Share
            </button>

          </section>

          {/* =================================================
              COMMENTS
          ================================================= */}

          <section className="details-section comments-section">

            <div className="comments-header">

              <div>

                <h2>
                  💬 Comments
                </h2>

                <p>
                  Share your thoughts or ask about this property.
                </p>

              </div>

              <span className="comments-count">

                {comments.length}{" "}

                {comments.length ===
                1
                  ? "Comment"
                  : "Comments"}

              </span>

            </div>

            {/* COMMENT FORM */}

            <form
              className="comment-form"
              onSubmit={
                handleAddComment
              }
            >

              <textarea
                value={
                  commentText
                }
                onChange={(event) =>
                  setCommentText(
                    event.target
                      .value
                  )
                }
                placeholder="Write a comment about this property..."
                maxLength={500}
                disabled={
                  commentSubmitting
                }
              />

              <div className="comment-form-footer">

                <span>

                  {
                    commentText.length
                  }
                  /500

                </span>

                <button
                  type="submit"
                  disabled={
                    commentSubmitting ||
                    !commentText.trim()
                  }
                >

                  {commentSubmitting
                    ? "Posting..."
                    : "Post Comment"}

                </button>

              </div>

            </form>

            {commentError && (
              <div className="comment-error">
                {commentError}
              </div>
            )}

            {/* COMMENTS LIST */}

            <div className="comments-list">

              {commentsLoading ? (
                <div className="comments-loading">
                  Loading comments...
                </div>
              ) : comments.length ===
                0 ? (
                <div className="comments-empty">

                  <div>
                    💬
                  </div>

                  <strong>
                    No comments yet
                  </strong>

                  <p>
                    Be the first person to comment on this property.
                  </p>

                </div>
              ) : (
                comments.map(
                  (
                    comment,
                    index
                  ) => {
                    const user =
                      getCommentUser(
                        comment
                      );

                    const userName =
                      getCommentUserName(
                        comment
                      );

                    const userRole =
                      getCommentUserRole(
                        comment
                      );

                    const commentDate =
                      comment.createdAt ||
                      comment.created_at ||
                      comment.date;

                    const commentTextValue =
                      comment.comment ||
                      comment.text ||
                      comment.content ||
                      "";

                    return (
                      <article
                        className="comment-card"
                        key={
                          comment.id ||
                          index
                        }
                      >

                        <div className="comment-avatar">

                          {userName
                            .charAt(
                              0
                            )
                            .toUpperCase()}

                        </div>

                        <div className="comment-content">

                          <div className="comment-top">

                            <div className="comment-user">

                              <strong>
                                {
                                  userName
                                }
                              </strong>

                              <span>
                                {
                                  userRole
                                }
                              </span>

                            </div>

                            {canDeleteComment(
                              comment
                            ) && (
                              <button
                                className="delete-comment-button"
                                onClick={() =>
                                  handleDeleteComment(
                                    comment.id
                                  )
                                }
                              >
                                🗑️ Delete
                              </button>
                            )}

                          </div>

                          <p>
                            {
                              commentTextValue
                            }
                          </p>

                          {commentDate && (
                            <small className="comment-date">

                              {formatCommentDate(
                                commentDate
                              )}

                            </small>
                          )}

                        </div>

                      </article>
                    );
                  }
                )
              )}

            </div>

          </section>

        </section>

      </main>

    </div>
  );
}

export default PropertyDetails;