const express = require("express");

const {
  createReview,
  getPropertyReviews,
  getUserReviews,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createReview);

router.get("/property/:propertyId", getPropertyReviews);

router.get("/user/:userId", getUserReviews);

router.put("/:id", protect, updateReview);

router.delete("/:id", protect, deleteReview);

module.exports = router;
