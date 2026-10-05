const express = require("express");

const router = express.Router();

const {
  createProperty,
  getProperties,
  getPropertyById,
  getMyProperties,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

const {
  protect,
} = require("../middleware/authMiddleware");
const { uploadPropertyImage, uploadPropertyVideo } = require("../middleware/uploadMiddleware");
const {
  uploadPropertyImage: savePropertyImage,
  getPropertyImages,
  deletePropertyImage,
} = require("../controllers/propertyImageController");
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
// GET SINGLE PROPERTY
// GET /api/properties/:id
// =====================================================
router.get(
  "/:id",
  getPropertyById
);

router.get("/:id/images", getPropertyImages);
router.post("/:id/images", protect, uploadPropertyImage.single("image"), savePropertyImage);
router.delete("/:id/images/:imageId", protect, deletePropertyImage);

router.get("/:id/videos", getPropertyVideos);
router.post("/:id/videos", protect, uploadPropertyVideo.single("video"), savePropertyVideo);
router.delete("/:id/videos/:videoId", protect, deletePropertyVideo);

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

module.exports = router;