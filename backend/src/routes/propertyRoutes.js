const express = require("express");

const router = express.Router();

// =====================================================
// CONTROLLERS
// =====================================================

const {
  createProperty,
  getProperties,
  getPropertyById,
  getMyProperties,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

const {
  getNearbyPlaces,
} = require("../controllers/nearbyPlacesController");

// =====================================================
// MIDDLEWARE
// =====================================================

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  uploadPropertyImage,
  uploadPropertyVideo,
} = require("../middleware/uploadMiddleware");

// =====================================================
// PROPERTY IMAGE CONTROLLERS
// =====================================================

const {
  uploadPropertyImage: savePropertyImage,
  getPropertyImages,
  deletePropertyImage,
} = require("../controllers/propertyImageController");

// =====================================================
// PROPERTY VIDEO CONTROLLERS
// =====================================================

const {
  uploadPropertyVideo: savePropertyVideo,
  getPropertyVideos,
  deletePropertyVideo,
} = require("../controllers/propertyVideoController");

// =====================================================
// GET ALL PROPERTIES
// GET /api/properties
// =====================================================

router.get(
  "/",
  getProperties
);

// =====================================================
// GET MY PROPERTIES
// GET /api/properties/my-properties
// =====================================================

router.get(
  "/my-properties",
  protect,
  getMyProperties
);

// =====================================================
// GET NEARBY PLACES
// GET /api/properties/:id/nearby-places
// =====================================================

router.get(
  "/:id/nearby-places",
  getNearbyPlaces
);

// =====================================================
// GET SINGLE PROPERTY
// GET /api/properties/:id
// =====================================================

router.get(
  "/:id",
  getPropertyById
);

// =====================================================
// PROPERTY IMAGES
// =====================================================

// GET PROPERTY IMAGES
// GET /api/properties/:id/images

router.get(
  "/:id/images",
  getPropertyImages
);

// UPLOAD PROPERTY IMAGE
// POST /api/properties/:id/images

router.post(
  "/:id/images",
  protect,
  uploadPropertyImage.single("image"),
  savePropertyImage
);

// DELETE PROPERTY IMAGE
// DELETE /api/properties/:id/images/:imageId

router.delete(
  "/:id/images/:imageId",
  protect,
  deletePropertyImage
);

// =====================================================
// PROPERTY VIDEOS
// =====================================================

// GET PROPERTY VIDEOS
// GET /api/properties/:id/videos

router.get(
  "/:id/videos",
  getPropertyVideos
);

// UPLOAD PROPERTY VIDEO
// POST /api/properties/:id/videos

router.post(
  "/:id/videos",
  protect,
  uploadPropertyVideo.single("video"),
  savePropertyVideo
);

// DELETE PROPERTY VIDEO
// DELETE /api/properties/:id/videos/:videoId

router.delete(
  "/:id/videos/:videoId",
  protect,
  deletePropertyVideo
);

// =====================================================
// CREATE PROPERTY
// POST /api/properties
// =====================================================

router.post(
  "/",
  protect,
  createProperty
);

// =====================================================
// UPDATE PROPERTY
// PUT /api/properties/:id
// =====================================================

router.put(
  "/:id",
  protect,
  updateProperty
);

// =====================================================
// DELETE PROPERTY
// DELETE /api/properties/:id
// =====================================================

router.delete(
  "/:id",
  protect,
  deleteProperty
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;