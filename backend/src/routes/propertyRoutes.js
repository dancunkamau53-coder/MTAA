const express = require("express");

const {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

const {
  uploadPropertyImage,
  getPropertyImages,
  deletePropertyImage,
} = require("../controllers/propertyImageController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  uploadPropertyImage: uploadImage,
} = require("../middleware/uploadMiddleware");

const router = express.Router();

// ===============================
// PROPERTY ROUTES
// ===============================

// Get all properties
router.get("/", getProperties);

// Get one property
router.get("/:id", getProperty);

// Create property
router.post("/", protect, createProperty);

// Update property
router.put("/:id", protect, updateProperty);

// Delete property
router.delete("/:id", protect, deleteProperty);

// ===============================
// PROPERTY IMAGE ROUTES
// ===============================

// Get all images for a property
router.get(
  "/:id/images",
  getPropertyImages
);

// Upload image to property
router.post(
  "/:id/images",
  protect,
  uploadImage.single("image"),
  uploadPropertyImage
);

// Delete property image
router.delete(
  "/:id/images/:imageId",
  protect,
  deletePropertyImage
);

module.exports = router;
