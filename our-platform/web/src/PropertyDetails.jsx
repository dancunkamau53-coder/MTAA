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
  getPropertyReviews,
  createReview,
  updateReview,
  deleteReview,
} from "./services/api";

import PropertyMap from "./PropertyMap";

import "./PropertyDetails.css";

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  window.location.origin;

function PropertyDetails({
  propertyId,
  onBack,
}) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] =
    useState(0);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // =====================================================
  // COMMENTS
  // =====================================================

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] =
    useState(true);
  const [commentSubmitting, setCommentSubmitting] =
    useState(false);
  const [commentError, setCommentError] = useState("");

  // =====================================================
  // REVIEWS & RATINGS
  // =====================================================

  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] =
    useState({
      averageRating: 0,
      totalReviews: 0,
    });

  const [reviewsLoading, setReviewsLoading] =
    useState(true);

  const [reviewError, setReviewError] =
    useState("");

  const [reviewRating, setReviewRating] =
    useState(5);

  const [reviewComment, setReviewComment] =
    useState("");

  const [reviewSubmitting, setReviewSubmitting] =
    useState(false);

  const [editingReviewId, setEditingReviewId] =
    useState(null);

  // =====================================================
  // NEARBY PLACES
  // =====================================================

  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyLoading, setNearbyLoading] =
    useState(false);
  const [nearbyError, setNearbyError] = useState("");

  // =====================================================
  // CURRENT USER
  // =====================================================

  const getCurrentUser = () => {
    try {
      const storedUser =
        localStorage.getItem("mtaa_user");

      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (err) {
      console.error(
        "Failed to read current user:",
        err
      );
    }

    return null;
  };

  const currentUser = getCurrentUser();

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

        if (!loadedProperty) {
          throw new Error(
            "Property could not be found."
          );
        }

        setProperty(loadedProperty);

        setLikeCount(
          Number(
            loadedProperty?.likesCount ||
              loadedProperty?.likeCount ||
              loadedProperty?.likes?.length ||
              0
          )
        );

        setSelectedImage(0);
      } catch (err) {
        console.error(
          "Failed to load property:",
          err
        );

        setError(
          err?.message ||
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
    const loadInteractionStatus = async () => {
      const token =
        localStorage.getItem("mtaa_token");

      if (!token || !propertyId) {
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

        if (count !== undefined) {
          setLikeCount(Number(count));
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
    const loadComments = async () => {
      if (!propertyId) {
        setCommentsLoading(false);
        return;
      }

      try {
        setCommentsLoading(true);
        setCommentError("");

        const data =
          await getPropertyComments(propertyId);

        const loadedComments =
          data?.comments ||
          data?.data?.comments ||
          data?.data ||
          (Array.isArray(data) ? data : []);

        setComments(
          Array.isArray(loadedComments)
            ? loadedComments
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load comments:",
          err
        );

        setCommentError(
          err?.message ||
            "Failed to load comments."
        );
      } finally {
        setCommentsLoading(false);
      }
    };

    loadComments();
  }, [propertyId]);

  // =====================================================
  // LOAD REVIEWS
  // =====================================================

  const loadReviews = async () => {
    if (!propertyId) {
      setReviews([]);
      setReviewSummary({
        averageRating: 0,
        totalReviews: 0,
      });
      setReviewsLoading(false);
      return;
    }

    try {
      setReviewsLoading(true);
      setReviewError("");

      const data =
        await getPropertyReviews(
          propertyId
        );

      const loadedReviews =
        data?.reviews ||
        data?.data?.reviews ||
        (Array.isArray(data)
          ? data
          : []);

      const summary =
        data?.summary ||
        data?.data?.summary ||
        {};

      setReviews(
        Array.isArray(loadedReviews)
          ? loadedReviews
          : []
      );

      setReviewSummary({
        averageRating:
          Number(
            summary?.averageRating || 0
          ),
        totalReviews:
          Number(
            summary?.totalReviews ??
              loadedReviews?.length ??
              0
          ),
      });
    } catch (err) {
      console.error(
        "Failed to load reviews:",
        err
      );

      setReviewError(
        err?.message ||
          "Failed to load reviews."
      );

      setReviews([]);
      setReviewSummary({
        averageRating: 0,
        totalReviews: 0,
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [propertyId]);

  // =====================================================
  // LOAD NEARBY PLACES
  // =====================================================

  useEffect(() => {
    const loadNearbyPlaces = async () => {
      if (!propertyId) {
        setNearbyPlaces([]);
        setNearbyLoading(false);
        return;
      }

      const latitude =
        Number(property?.latitude);

      const longitude =
        Number(property?.longitude);

      const hasValidCoordinates =
        Number.isFinite(latitude) &&
        Number.isFinite(longitude);

      if (!hasValidCoordinates) {
        setNearbyPlaces([]);
        setNearbyError("");
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
          err?.message ||
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

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    const url =
      typeof image === "string"
        ? image
        : image.url || image.imageUrl;

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
  // GALLERY
  // =====================================================

  const propertyImages =
    property?.images?.length
      ? property.images
      : property?.imageUrl
        ? [property.imageUrl]
        : [];

  const galleryItems = [
    ...propertyImages.map((image) => ({
      type: "image",
      media: image,
    })),

    ...(property?.videos || []).map(
      (video) => ({
        type: "video",
        media: video,
      })
    ),
  ];

  if (galleryItems.length === 0) {
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
      localStorage.getItem("mtaa_token");

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

      if (newLiked !== undefined) {
        setLiked(Boolean(newLiked));
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

      if (count !== undefined) {
        setLikeCount(Number(count));
      } else {
        setLikeCount(
          (current) =>
            liked
              ? Math.max(0, current - 1)
              : current + 1
        );
      }
    } catch (err) {
      alert(
        err?.message ||
          "Failed to update like."
      );
    }
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSave = async () => {
    const token =
      localStorage.getItem("mtaa_token");

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

      if (newSaved !== undefined) {
        setSaved(Boolean(newSaved));
      } else {
        setSaved(
          (current) => !current
        );
      }
    } catch (err) {
      alert(
        err?.message ||
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
      if (navigator.share) {
        await navigator.share({
          title:
            property?.title ||
            "MTAA Property",
          text:
            "Check out this property on MTAA.",
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          shareUrl
        );

        alert(
          "Property link copied!"
        );
      } else {
        alert(
          "Sharing is not supported on this browser."
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

  const handleContactOwner = () => {
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

  const handleAddComment = async (
    event
  ) => {
    event.preventDefault();

    const token =
      localStorage.getItem("mtaa_token");

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

    if (trimmedComment.length > 500) {
      setCommentError(
        "Comment cannot exceed 500 characters."
      );
      return;
    }

    try {
      setCommentSubmitting(true);
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
          (Array.isArray(refreshed)
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
        err?.message ||
          "Failed to add comment."
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  // =====================================================
  // DELETE COMMENT
  // =====================================================

  const handleDeleteComment = async (
    commentId
  ) => {
    const token =
      localStorage.getItem("mtaa_token");

    if (!token) {
      alert("Please login first.");
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
        err?.message ||
          "Failed to delete comment."
      );
    }
  };

  // =====================================================
  // REVIEW HELPERS
  // =====================================================

  const getReviewAuthor = (review) =>
    review?.author ||
    review?.user ||
    {};

  const getReviewAuthorName = (
    review
  ) => {
    const author =
      getReviewAuthor(review);

    return (
      author?.name ||
      review?.authorName ||
      review?.userName ||
      "MTAA User"
    );
  };

  const getReviewAuthorRole = (
    review
  ) => {
    const author =
      getReviewAuthor(review);

    return (
      author?.role ||
      review?.authorRole ||
      review?.userRole ||
      "USER"
    );
  };

  const getReviewAuthorId = (
    review
  ) => {
    const author =
      getReviewAuthor(review);

    return (
      review?.authorId ||
      review?.userId ||
      author?.id ||
      author?.userId ||
      null
    );
  };

  const isOwnReview = (review) => {
    if (
      !currentUser ||
      !review
    ) {
      return false;
    }

    const currentUserId =
      currentUser.id ||
      currentUser.userId;

    const reviewAuthorId =
      getReviewAuthorId(review);

    if (
      !currentUserId ||
      !reviewAuthorId
    ) {
      return false;
    }

    return (
      String(currentUserId) ===
      String(reviewAuthorId)
    );
  };

  const formatReviewDate = (
    date
  ) => {
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

  const renderStars = (
    rating,
    interactive = false
  ) => {
    const numericRating =
      Number(rating) || 0;

    return (
      <div
        className={
          interactive
            ? "review-stars review-stars-interactive"
            : "review-stars"
        }
        aria-label={
          `${numericRating} out of 5 stars`
        }
      >
        {[1, 2, 3, 4, 5].map(
          (star) => (
            <button
              key={star}
              type="button"
              className={
                interactive
                  ? "review-star-button " +
                    (star <=
                    numericRating
                      ? "active"
                      : "")
                  : "review-star"
              }
              onClick={
                interactive
                  ? () =>
                      setReviewRating(
                        star
                      )
                  : undefined
              }
              disabled={
                !interactive
              }
              aria-label={
                `Rate ${star} out of 5`
              }
            >
              {star <=
              numericRating
                ? "★"
                : "☆"}
            </button>
          )
        )}
      </div>
    );
  };

  // =====================================================
  // START EDIT REVIEW
  // =====================================================

  const handleStartEditReview = (
    review
  ) => {
    setEditingReviewId(
      review.id
    );

    setReviewRating(
      Number(review.rating) || 5
    );

    setReviewComment(
      review.comment || ""
    );

    setReviewError("");
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancelEditReview =
    () => {
      setEditingReviewId(null);
      setReviewRating(5);
      setReviewComment("");
      setReviewError("");
    };

  // =====================================================
  // SUBMIT REVIEW
  // =====================================================

  const handleSubmitReview = async (
    event
  ) => {
    event.preventDefault();

    const token =
      localStorage.getItem(
        "mtaa_token"
      );

    if (!token) {
      alert(
        "Please login to review this property."
      );
      return;
    }

    const numericRating =
      Number(reviewRating);

    if (
      !Number.isInteger(
        numericRating
      ) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      setReviewError(
        "Please select a rating between 1 and 5 stars."
      );
      return;
    }

    const trimmedReview =
      reviewComment.trim();

    if (
      trimmedReview.length > 500
    ) {
      setReviewError(
        "Review cannot exceed 500 characters."
      );
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");

      if (editingReviewId) {
        await updateReview(
          token,
          editingReviewId,
          {
            rating:
              numericRating,
            comment:
              trimmedReview,
          }
        );
      } else {
        await createReview(
          token,
          {
            rating:
              numericRating,
            comment:
              trimmedReview,
            propertyId,
          }
        );
      }

      handleCancelEditReview();

      await loadReviews();
    } catch (err) {
      console.error(
        "Failed to save review:",
        err
      );

      setReviewError(
        err?.message ||
          "Failed to save review."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  // =====================================================
  // DELETE REVIEW
  // =====================================================

  const handleDeleteReview = async (
    reviewId
  ) => {
    const token =
      localStorage.getItem(
        "mtaa_token"
      );

    if (!token) {
      alert("Please login first.");
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete your review?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setReviewError("");

      await deleteReview(
        token,
        reviewId
      );

      if (
        editingReviewId ===
        reviewId
      ) {
        handleCancelEditReview();
      }

      await loadReviews();
    } catch (err) {
      console.error(
        "Failed to delete review:",
        err
      );

      setReviewError(
        err?.message ||
          "Failed to delete review."
      );
    }
  };

  // =====================================================
  // CHECK WHETHER CURRENT USER ALREADY REVIEWED
  // =====================================================

  const currentUserReview =
    reviews.find(
      (review) =>
        isOwnReview(review)
    );

  const isPropertyOwner =
    currentUser &&
    property?.owner?.id &&
    String(
      currentUser.id ||
        currentUser.userId
    ) ===
      String(property.owner.id);

  // =====================================================
  // COMMENT HELPERS
  // =====================================================

  const getCommentUser = (
    comment
  ) =>
    comment?.user ||
    comment?.author ||
    comment?.createdBy ||
    {};

  const getCommentUserName = (
    comment
  ) => {
    const user =
      getCommentUser(comment);

    return (
      user?.name ||
      comment?.userName ||
      comment?.authorName ||
      "MTAA User"
    );
  };

  const getCommentUserRole = (
    comment
  ) => {
    const user =
      getCommentUser(comment);

    return (
      user?.role ||
      comment?.userRole ||
      "USER"
    );
  };

  const canDeleteComment = (
    comment
  ) => {
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
        String(currentUserId) ===
        String(commentUserId)
      );
    }

    return false;
  };

  const formatCommentDate = (
    date
  ) => {
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
          type="button"
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
  // MAP COORDINATES
  // =====================================================

  const hasCoordinates =
    Number.isFinite(
      Number(property.latitude)
    ) &&
    Number.isFinite(
      Number(property.longitude)
    );

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="property-details-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="property-details-header">

        <button
          type="button"
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

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="property-details-container">

        {/* =================================================
            GALLERY
        ================================================= */}

        <section className="property-gallery">

          <div className="property-main-image">

            {selectedMedia.type ===
            "video" ? (
              <video
                className="property-gallery-video"
                src={getImageUrl(
                  selectedMedia.media?.url
                )}
                controls
                playsInline
                preload="metadata"
                aria-label="Property video tour"
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
                  type="button"
                  className="gallery-arrow gallery-arrow-left"
                  onClick={
                    previousImage
                  }
                  aria-label="Previous image"
                >
                  ‹
                </button>

                <button
                  type="button"
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
                  {
                    galleryItems.length
                  }
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
                    type="button"
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
                        alt={
                          "Property photo " +
                          (index +
                            1)
                        }
                      />
                    )}

                  </button>
                )
              )}

            </div>
          )}

        </section>

        {/* =================================================
            PROPERTY INFORMATION
        ================================================= */}

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
                {property.location ||
                  "Location unavailable"}
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

          {/* =================================================
              FEATURES
          ================================================= */}

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

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <section className="details-section">

            <h2>
              About This Property
            </h2>

            <p>
              {property.description ||
                "No description has been provided for this property yet."}
            </p>

          </section>

          {/* =================================================
              LOCATION
          ================================================= */}

          <section className="details-section">

            <h2>
              📍 Location
            </h2>

            <div className="location-card">

              <strong>
                {property.location ||
                  "Location unavailable"}
              </strong>

              {hasCoordinates && (
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
              PROPERTY MAP
          ================================================= */}

          <section className="details-section">

            <h2>
              🗺️ Property Map
            </h2>

            <p>
              View the property's
              location on the map.
            </p>

            <PropertyMap
              latitude={
                property.latitude
              }
              longitude={
                property.longitude
              }
              title={
                property.title ||
                "MTAA Property"
              }
            />

          </section>

          {/* =================================================
              NEARBY SERVICES
          ================================================= */}

          <section className="details-section">

            <h2>
              🧭 Nearby Services
            </h2>

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
                      Checking real
                      locations around
                      this property
                    </span>

                  </div>

                </div>

              </div>
            )}

            {!nearbyLoading &&
              nearbyError && (
                <div className="nearby-service-card">

                  <div className="nearby-service-icon">
                    ⚠️
                  </div>

                  <div className="nearby-service-body">

                    <strong>
                      Nearby places
                      unavailable
                    </strong>

                    <span>
                      {nearbyError}
                    </span>

                  </div>

                </div>
              )}

            {!nearbyLoading &&
              !nearbyError &&
              nearbyPlaces.length ===
                0 &&
              !hasCoordinates && (
                <div className="nearby-service-card">

                  <div className="nearby-service-icon">
                    📍
                  </div>

                  <div className="nearby-service-body">

                    <strong>
                      No nearby places
                      found
                    </strong>

                    <span>
                      This property
                      does not have
                      valid GPS
                      coordinates yet.
                    </span>

                  </div>

                </div>
              )}

            {!nearbyLoading &&
              !nearbyError &&
              nearbyPlaces.length ===
                0 &&
              hasCoordinates && (
                <div className="nearby-service-card">

                  <div className="nearby-service-icon">
                    📍
                  </div>

                  <div className="nearby-service-body">

                    <strong>
                      No nearby places
                      found
                    </strong>

                    <span>
                      We could not find
                      mapped services
                      around this
                      property right now.
                    </span>

                  </div>

                </div>
              )}

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
                          {place.icon ||
                            "📍"}
                        </div>

                        <div className="nearby-service-body">

                          <strong>
                            {place.name ||
                              "Nearby place"}
                          </strong>

                          <span>
                            {place.detail ||
                              place.label ||
                              place.category ||
                              "Nearby service"}
                          </span>

                        </div>

                        <div className="nearby-service-distance">

                          <strong>
                            {place.value ??
                              place.distanceKm ??
                              "—"}

                            {place.unit ||
                              ""}
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

          {/* =================================================
              OWNER
          ================================================= */}

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

          {/* =================================================
              ACTIONS
          ================================================= */}

          <section className="property-actions">

            <button
              type="button"
              className="contact-button"
              onClick={
                handleContactOwner
              }
            >
              📞 Contact Owner
            </button>

            <button
              type="button"
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
              type="button"
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

              {likeCount > 0 &&
                " (" +
                  likeCount +
                  ")"}
            </button>

            <button
              type="button"
              className="share-button"
              onClick={
                handleShare
              }
            >
              📤 Share
            </button>

          </section>

          {/* =================================================
              REVIEWS & RATINGS
          ================================================= */}

          <section className="details-section reviews-section">

            <div className="reviews-header">

              <div>

                <h2>
                  ⭐ Reviews & Ratings
                </h2>

                <p>
                  See what people think
                  about this property.
                </p>

              </div>

              <div className="review-summary">

                <strong className="review-average">
                  {Number(
                    reviewSummary.averageRating ||
                      0
                  ).toFixed(1)}
                </strong>

                {renderStars(
                  reviewSummary.averageRating
                )}

                <span>
                  {reviewSummary.totalReviews}{" "}
                  {reviewSummary.totalReviews ===
                  1
                    ? "Review"
                    : "Reviews"}
                </span>

              </div>

            </div>

            {/* REVIEW FORM */}

            {currentUser ? (
              isPropertyOwner ? (
                <div className="review-notice">
                  🏠 You cannot review
                  your own property.
                </div>
              ) : currentUserReview &&
                !editingReviewId ? (
                <div className="review-notice">
                  ✅ You have already
                  reviewed this property.
                  You can edit your
                  review below.
                </div>
              ) : (
                <form
                  className="review-form"
                  onSubmit={
                    handleSubmitReview
                  }
                >

                  <div className="review-form-header">

                    <div>

                      <h3>
                        {editingReviewId
                          ? "Edit Your Review"
                          : "Leave a Review"}
                      </h3>

                      <p>
                        Rate this property
                        from 1 to 5 stars.
                      </p>

                    </div>

                    <div className="review-rating-picker">

                      {renderStars(
                        reviewRating,
                        true
                      )}

                    </div>

                  </div>

                  <textarea
                    value={
                      reviewComment
                    }
                    onChange={(
                      event
                    ) =>
                      setReviewComment(
                        event.target
                          .value
                      )
                    }
                    placeholder="Write your review about this property..."
                    maxLength={500}
                    disabled={
                      reviewSubmitting
                    }
                  />

                  <div className="review-form-footer">

                    <span>
                      {
                        reviewComment.length
                      }
                      /500
                    </span>

                    <div className="review-form-actions">

                      {editingReviewId && (
                        <button
                          type="button"
                          className="review-cancel-button"
                          onClick={
                            handleCancelEditReview
                          }
                          disabled={
                            reviewSubmitting
                          }
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        type="submit"
                        className="review-submit-button"
                        disabled={
                          reviewSubmitting
                        }
                      >
                        {reviewSubmitting
                          ? "Saving..."
                          : editingReviewId
                            ? "Update Review"
                            : "Submit Review"}
                      </button>

                    </div>

                  </div>

                </form>
              )
            ) : (
              <div className="review-notice">
                🔐 Please login to rate
                and review this property.
              </div>
            )}

            {reviewError && (
              <div className="review-error">
                {reviewError}
              </div>
            )}

            {/* REVIEWS LIST */}

            <div className="reviews-list">

              {reviewsLoading ? (
                <div className="reviews-loading">
                  Loading reviews...
                </div>
              ) : reviews.length ===
                0 ? (
                <div className="reviews-empty">

                  <div>
                    ⭐
                  </div>

                  <strong>
                    No reviews yet
                  </strong>

                  <p>
                    Be the first person
                    to review this
                    property.
                  </p>

                </div>
              ) : (
                reviews.map(
                  (
                    review,
                    index
                  ) => {
                    const authorName =
                      getReviewAuthorName(
                        review
                      );

                    const authorRole =
                      getReviewAuthorRole(
                        review
                      );

                    const reviewDate =
                      review.createdAt ||
                      review.created_at ||
                      review.date;

                    return (
                      <article
                        className="review-card"
                        key={
                          review.id ||
                          index
                        }
                      >

                        <div className="review-avatar">
                          {authorName
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>

                        <div className="review-content">

                          <div className="review-top">

                            <div className="review-user">

                              <strong>
                                {
                                  authorName
                                }
                              </strong>

                              <span>
                                {
                                  authorRole
                                }
                              </span>

                            </div>

                            <div className="review-card-rating">

                              {renderStars(
                                review.rating
                              )}

                            </div>

                          </div>

                          {review.comment && (
                            <p>
                              {
                                review.comment
                              }
                            </p>
                          )}

                          <div className="review-card-footer">

                            {reviewDate && (
                              <small>
                                {formatReviewDate(
                                  reviewDate
                                )}
                              </small>
                            )}

                            {isOwnReview(
                              review
                            ) && (
                              <div className="review-owner-actions">

                                <button
                                  type="button"
                                  className="edit-review-button"
                                  onClick={() =>
                                    handleStartEditReview(
                                      review
                                    )
                                  }
                                >
                                  ✏️ Edit
                                </button>

                                <button
                                  type="button"
                                  className="delete-review-button"
                                  onClick={() =>
                                    handleDeleteReview(
                                      review.id
                                    )
                                  }
                                >
                                  🗑️ Delete
                                </button>

                              </div>
                            )}

                          </div>

                        </div>

                      </article>
                    );
                  }
                )
              )}

            </div>

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
                  Share your thoughts or
                  ask about this property.
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
                value={commentText}
                onChange={(
                  event
                ) =>
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
                    Be the first person
                    to comment on this
                    property.
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
                                {userName}
                              </strong>

                              <span>
                                {userRole}
                              </span>

                            </div>

                            {canDeleteComment(
                              comment
                            ) && (
                              <button
                                type="button"
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