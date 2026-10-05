const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(
  __dirname,
  "../../uploads/properties"
);
const videoUploadDirectory = path.join(
  uploadDirectory,
  "videos"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

if (!fs.existsSync(videoUploadDirectory)) {
  fs.mkdirSync(videoUploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
      extension;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG, WEBP and GIF images are allowed"
      ),
      false
    );
  }
};

const uploadPropertyImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const videoStorage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, videoUploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, uniqueName);
  },
});

const uploadPropertyVideo = multer({
  storage: videoStorage,
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Only MP4, WEBM and MOV videos are allowed"), false);
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 },
});

module.exports = {
  uploadPropertyImage,
  uploadPropertyVideo,
};
