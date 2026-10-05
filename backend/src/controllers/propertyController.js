const prisma = require("../lib/prisma");

// =====================================================
// CREATE PROPERTY
// =====================================================
const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      propertyType,
      price,
      bedrooms,
      bathrooms,
      parking,
      latitude,
      longitude,
      imageUrl,
    } = req.body;

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Property title is required.",
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: "Property location is required.",
      });
    }

    if (
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Property price is required.",
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) {
      return res.status(400).json({
        success: false,
        message: "Property price must be a valid number.",
      });
    }

    // -----------------------------------------
    // OPTIONAL NUMERIC VALUES
    // -----------------------------------------
    const numericBedrooms =
      bedrooms !== undefined &&
      bedrooms !== null &&
      bedrooms !== ""
        ? Number(bedrooms)
        : null;

    const numericBathrooms =
      bathrooms !== undefined &&
      bathrooms !== null &&
      bathrooms !== ""
        ? Number(bathrooms)
        : null;

    const numericParking =
      parking !== undefined &&
      parking !== null &&
      parking !== ""
        ? Number(parking)
        : null;

    const numericLatitude =
      latitude !== undefined &&
      latitude !== null &&
      latitude !== ""
        ? Number(latitude)
        : null;

    const numericLongitude =
      longitude !== undefined &&
      longitude !== null &&
      longitude !== ""
        ? Number(longitude)
        : null;

    // -----------------------------------------
    // NUMBER VALIDATION
    // -----------------------------------------
    if (
      numericBedrooms !== null &&
      !Number.isInteger(numericBedrooms)
    ) {
      return res.status(400).json({
        success: false,
        message: "Bedrooms must be a whole number.",
      });
    }

    if (
      numericBathrooms !== null &&
      !Number.isInteger(numericBathrooms)
    ) {
      return res.status(400).json({
        success: false,
        message: "Bathrooms must be a whole number.",
      });
    }

    if (
      numericParking !== null &&
      !Number.isInteger(numericParking)
    ) {
      return res.status(400).json({
        success: false,
        message: "Parking spaces must be a whole number.",
      });
    }

    if (
      numericLatitude !== null &&
      !Number.isFinite(numericLatitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be a valid number.",
      });
    }

    if (
      numericLongitude !== null &&
      !Number.isFinite(numericLongitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be a valid number.",
      });
    }

    // -----------------------------------------
    // CHECK AUTHENTICATED USER
    // -----------------------------------------
    const ownerId =
      req.user?.id ||
      req.user?.userId;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // -----------------------------------------
    // CREATE PROPERTY
    // -----------------------------------------
    const property = await prisma.property.create({
      data: {
        title: title.trim(),

        description:
          description && description.trim()
            ? description.trim()
            : null,

        location: location.trim(),

        propertyType:
          propertyType && propertyType.trim()
            ? propertyType.trim()
            : null,

        price: numericPrice,

        bedrooms: numericBedrooms,

        bathrooms: numericBathrooms,

        parking: numericParking,

        latitude: numericLatitude,

        longitude: numericLongitude,

        imageUrl:
          imageUrl && imageUrl.trim()
            ? imageUrl.trim()
            : null,

        owner: {
          connect: {
            id: ownerId,
          },
        },
      },

      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },

        images: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Property created successfully.",
      property,
    });
  } catch (error) {
    console.error(
      "CREATE PROPERTY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create property.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// =====================================================
// GET ALL PROPERTIES
// =====================================================
const getProperties = async (req, res) => {
  try {
    const properties =
      await prisma.property.findMany({
        orderBy: {
          createdAt: "desc",
        },

        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },

          images: {
            orderBy: {
              createdAt: "asc",
            },
          },
          videos: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error(
      "GET PROPERTIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch properties.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// =====================================================
// GET SINGLE PROPERTY
// =====================================================
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property =
      await prisma.property.findUnique({
        where: {
          id,
        },

        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },

          images: {
            orderBy: {
              createdAt: "asc",
            },
          },

          videos: {
            orderBy: {
              createdAt: "asc",
            },
          },

          likes: true,

          savedBy: true,

          comments: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    return res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    console.error(
      "GET PROPERTY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch property.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// =====================================================
// UPDATE PROPERTY
// =====================================================
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      location,
      propertyType,
      price,
      bedrooms,
      bathrooms,
      parking,
      latitude,
      longitude,
      imageUrl,
    } = req.body;

    const ownerId =
      req.user?.id ||
      req.user?.userId;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // -----------------------------------------
    // FIND PROPERTY
    // -----------------------------------------
    const existingProperty =
      await prisma.property.findUnique({
        where: {
          id,
        },
      });

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    // -----------------------------------------
    // OWNERSHIP CHECK
    // -----------------------------------------
    if (existingProperty.ownerId !== ownerId) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to update this property.",
      });
    }

    // -----------------------------------------
    // BUILD UPDATE DATA
    // -----------------------------------------
    const updateData = {};

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Property title cannot be empty.",
        });
      }

      updateData.title =
        String(title).trim();
    }

    if (description !== undefined) {
      updateData.description =
        description &&
        String(description).trim()
          ? String(description).trim()
          : null;
    }

    if (location !== undefined) {
      if (!String(location).trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Property location cannot be empty.",
        });
      }

      updateData.location =
        String(location).trim();
    }

    if (propertyType !== undefined) {
      updateData.propertyType =
        propertyType &&
        String(propertyType).trim()
          ? String(propertyType).trim()
          : null;
    }

    if (price !== undefined) {
      if (price === "") {
        return res.status(400).json({
          success: false,
          message: "Property price is required.",
        });
      }

      const numericPrice =
        Number(price);

      if (
        !Number.isFinite(numericPrice)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Property price must be a valid number.",
        });
      }

      updateData.price =
        numericPrice;
    }

    if (bedrooms !== undefined) {
      if (bedrooms === "") {
        updateData.bedrooms = null;
      } else {
        const numericBedrooms =
          Number(bedrooms);

        if (
          !Number.isInteger(
            numericBedrooms
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Bedrooms must be a whole number.",
          });
        }

        updateData.bedrooms =
          numericBedrooms;
      }
    }

    if (bathrooms !== undefined) {
      if (bathrooms === "") {
        updateData.bathrooms = null;
      } else {
        const numericBathrooms =
          Number(bathrooms);

        if (
          !Number.isInteger(
            numericBathrooms
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Bathrooms must be a whole number.",
          });
        }

        updateData.bathrooms =
          numericBathrooms;
      }
    }

    if (parking !== undefined) {
      if (parking === "") {
        updateData.parking = null;
      } else {
        const numericParking =
          Number(parking);

        if (
          !Number.isInteger(
            numericParking
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Parking spaces must be a whole number.",
          });
        }

        updateData.parking =
          numericParking;
      }
    }

    if (latitude !== undefined) {
      if (latitude === "") {
        updateData.latitude = null;
      } else {
        const numericLatitude =
          Number(latitude);

        if (
          !Number.isFinite(
            numericLatitude
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Latitude must be a valid number.",
          });
        }

        updateData.latitude =
          numericLatitude;
      }
    }

    if (longitude !== undefined) {
      if (longitude === "") {
        updateData.longitude = null;
      } else {
        const numericLongitude =
          Number(longitude);

        if (
          !Number.isFinite(
            numericLongitude
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Longitude must be a valid number.",
          });
        }

        updateData.longitude =
          numericLongitude;
      }
    }

    if (imageUrl !== undefined) {
      updateData.imageUrl =
        imageUrl &&
        String(imageUrl).trim()
          ? String(imageUrl).trim()
          : null;
    }

    // -----------------------------------------
    // UPDATE PROPERTY
    // -----------------------------------------
    const property =
      await prisma.property.update({
        where: {
          id,
        },

        data: updateData,

        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },

          images: true,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Property updated successfully.",
      property,
    });
  } catch (error) {
    console.error(
      "UPDATE PROPERTY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update property.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// =====================================================
// DELETE PROPERTY
// =====================================================
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const ownerId =
      req.user?.id ||
      req.user?.userId;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const property =
      await prisma.property.findUnique({
        where: {
          id,
        },
      });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    if (property.ownerId !== ownerId) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to delete this property.",
      });
    }

    await prisma.property.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Property deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE PROPERTY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete property.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// =====================================================
// GET MY PROPERTIES
// =====================================================
const getMyProperties = async (req, res) => {
  try {
    const ownerId =
      req.user?.id ||
      req.user?.userId;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const properties =
      await prisma.property.findMany({
        where: {
          ownerId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          images: {
            orderBy: {
              createdAt: "asc",
            },
          },
          videos: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error(
      "GET MY PROPERTIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your properties.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  getMyProperties,
  updateProperty,
  deleteProperty,
};