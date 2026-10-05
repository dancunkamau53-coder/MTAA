const express = require("express");

const {
  toggleLike,
  toggleSave,
  getInteractionStatus,
  getSavedProperties,
  addComment,
  getComments,
  deleteComment,
} = require("../controllers/propertyInteractionController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET SAVED PROPERTIES
// ==========================================
// IMPORTANT:
// This route must come BEFORE /:propertyId routes.
// Otherwise "saved" could be treated as a propertyId.

router.get(
  "/saved",
  protect,
  getSavedProperties
);

// ==========================================
// LIKE / UNLIKE
// ==========================================

router.post(
  "/:propertyId/like",
  protect,
  toggleLike
);

// ==========================================
// SAVE / UNSAVE
// ==========================================

router.post(
  "/:propertyId/save",
  protect,
  toggleSave
);

// ==========================================
// LIKE / SAVE STATUS
// ==========================================

router.get(
  "/:propertyId/interaction-status",
  protect,
  getInteractionStatus
);

// ==========================================
// COMMENTS
// ==========================================

// Get comments
router.get(
  "/:propertyId/comments",
  getComments
);

// Add comment
router.post(
  "/:propertyId/comments",
  protect,
  addComment
);

// Delete own comment
router.delete(
  "/comments/:commentId",
  protect,
  deleteComment
);

module.exports = router;

