const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");

const removeUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const uploadPropertyVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Choose a video to upload." });
    }

    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      select: { id: true, ownerId: true },
    });

    if (!property) {
      removeUploadedFile(req.file.path);
      return res.status(404).json({ success: false, message: "Property not found." });
    }

    if (property.ownerId !== req.user.id) {
      removeUploadedFile(req.file.path);
      return res.status(403).json({ success: false, message: "You can only upload videos to your own property." });
    }

    const videoCount = await prisma.propertyVideo.count({
      where: { propertyId: property.id },
    });
    if (videoCount >= 3) {
      removeUploadedFile(req.file.path);
      return res.status(400).json({ success: false, message: "A property can have up to 3 videos." });
    }

    const video = await prisma.propertyVideo.create({
      data: {
        url: `/uploads/properties/videos/${req.file.filename}`,
        mimeType: req.file.mimetype,
        originalName: path.basename(req.file.originalname).slice(0, 255),
        propertyId: property.id,
      },
    });

    res.status(201).json({ success: true, video });
  } catch (error) {
    console.error("UPLOAD PROPERTY VIDEO ERROR:", error);
    try {
      removeUploadedFile(req.file?.path);
    } catch (cleanupError) {
      console.error("FAILED TO REMOVE VIDEO UPLOAD:", cleanupError);
    }
    res.status(500).json({ success: false, message: "Failed to upload property video." });
  }
};

const getPropertyVideos = async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  });

  if (!property) {
    return res.status(404).json({ success: false, message: "Property not found." });
  }

  const videos = await prisma.propertyVideo.findMany({
    where: { propertyId: property.id },
    orderBy: { createdAt: "asc" },
  });

  res.json({ success: true, videos });
};

const deletePropertyVideo = async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    select: { id: true, ownerId: true },
  });

  if (!property) {
    return res.status(404).json({ success: false, message: "Property not found." });
  }

  if (property.ownerId !== req.user.id) {
    return res.status(403).json({ success: false, message: "You can only delete videos from your own property." });
  }

  const video = await prisma.propertyVideo.findFirst({
    where: { id: req.params.videoId, propertyId: property.id },
  });

  if (!video) {
    return res.status(404).json({ success: false, message: "Property video not found." });
  }

  await prisma.propertyVideo.delete({ where: { id: video.id } });
  removeUploadedFile(path.join(__dirname, "../../", video.url.replace(/^\/+/, "")));
  res.json({ success: true, message: "Property video deleted." });
};

module.exports = {
  uploadPropertyVideo,
  getPropertyVideos,
  deletePropertyVideo,
};