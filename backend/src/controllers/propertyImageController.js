const prisma = require("../lib/prisma");
const fs = require("fs");
const path = require("path");

// ===============================
// UPLOAD PROPERTY IMAGE
// ===============================

const uploadPropertyImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    const property = await prisma.property.findUnique({
      where: {
        id,
      },
    });

    if (!property) {
      // Delete uploaded file if property doesn't exist
      fs.unlinkSync(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (property.ownerId !== req.user.id) {
      // Delete uploaded file if user doesn't own property
      fs.unlinkSync(req.file.path);

      return res.status(403).json({
        success: false,
        message: "You can only upload images to your own property",
      });
    }

    const imageUrl = `/uploads/properties/${req.file.filename}`;

    const existingImages = await prisma.propertyImage.count({
      where: {
        propertyId: id,
      },
    });

    const image = await prisma.propertyImage.create({
      data: {
        url: imageUrl,
        isCover: existingImages === 0,
        propertyId: id,
      },
    });

    // Automatically use the first uploaded image as cover
    if (existingImages === 0) {
      await prisma.property.update({
        where: {
          id,
        },
        data: {
          imageUrl,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Property image uploaded successfully",
      image,
    });
  } catch (error) {
    console.error("UPLOAD PROPERTY IMAGE ERROR:", error);

    if (req.file?.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (deleteError) {
        console.error(
          "FAILED TO DELETE UPLOADED FILE:",
          deleteError
        );
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload property image",
      error: error.message,
    });
  }
};

// ===============================
// GET PROPERTY IMAGES
// ===============================

const getPropertyImages = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: {
        id,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const images = await prisma.propertyImage.findMany({
      where: {
        propertyId: id,
      },
      orderBy: [
        {
          isCover: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    res.json({
      success: true,
      count: images.length,
      images,
    });
  } catch (error) {
    console.error("GET PROPERTY IMAGES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get property images",
      error: error.message,
    });
  }
};

// ===============================
// DELETE PROPERTY IMAGE
// ===============================

const deletePropertyImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const property = await prisma.property.findUnique({
      where: {
        id,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (property.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only delete images from your own property",
      });
    }

    const image = await prisma.propertyImage.findFirst({
      where: {
        id: imageId,
        propertyId: id,
      },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Property image not found",
      });
    }

    const filePath = path.join(
      __dirname,
      "../../",
      image.url.replace(/^\/+/, "")
    );

    await prisma.propertyImage.delete({
      where: {
        id: imageId,
      },
    });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // If deleted image was the cover, select another image
    if (image.isCover) {
      const nextImage = await prisma.propertyImage.findFirst({
        where: {
          propertyId: id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (nextImage) {
        await prisma.propertyImage.update({
          where: {
            id: nextImage.id,
          },
          data: {
            isCover: true,
          },
        });

        await prisma.property.update({
          where: {
            id,
          },
          data: {
            imageUrl: nextImage.url,
          },
        });
      } else {
        await prisma.property.update({
          where: {
            id,
          },
          data: {
            imageUrl: null,
          },
        });
      }
    }

    res.json({
      success: true,
      message: "Property image deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PROPERTY IMAGE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete property image",
      error: error.message,
    });
  }
};

module.exports = {
  uploadPropertyImage,
  getPropertyImages,
  deletePropertyImage,
};
