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
      await prisma.property.create({
        data: {
          title: title.trim(),

          description:
            description &&
            description.trim()
              ? description.trim()
              : null,

          location: location.trim(),

          propertyType:
            propertyType &&
            propertyType.trim()
              ? propertyType.trim()
              : null,

          price: numericPrice,

          bedrooms: numericBedrooms,

          bathrooms: numericBathrooms,

          parking: numericParking,

          latitude: numericLatitude,

          longitude: numericLongitude,

          imageUrl:
            imageUrl &&
            imageUrl.trim()
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
      error: error.message,
      code: error.code || null,
    });
  }
};

// =====================================================
// GET ALL PROPERTIES
// GET /api/properties
// =====================================================

const getProperties = async (req, res) => {
  try {
    const {
      location,
      propertyType,
      search,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      parking,
      furnished,
    } = req.query;

    const where = {};

    // =================================================
    // GENERAL PROPERTY SEARCH
    // =================================================

    const normalizedSearch = String(search || "").trim();

    if (normalizedSearch !== "") {
      const ignoredWords = new Set(["in", "near", "at", "around", "for", "the", "a", "an", "and", "or", "to", "with"]);

      const searchTerms = normalizedSearch
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term !== "" && !ignoredWords.has(term.toLowerCase()));

      if (searchTerms.length > 0) {
        where.AND = searchTerms.map((term) => ({
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { location: { contains: term, mode: "insensitive" } },
            { propertyType: { contains: term, mode: "insensitive" } },
          ],
        }));
      }
    }

    // =================================================
    // LOCATION FILTER
    // =================================================

    if (
      location !== undefined &&
      String(location).trim() !== ""
    ) {
      where.location = {
        contains: String(location).trim(),
        mode: "insensitive",
      };
    }

    // =================================================
    // PROPERTY TYPE FILTER
    // =================================================

    if (
      propertyType !== undefined &&
      String(propertyType).trim() !== ""
    ) {
      where.propertyType = {
        contains: String(propertyType).trim(),
        mode: "insensitive",
      };
    }

    // =================================================
    // PRICE FILTER
    // =================================================

    const priceFilter = {};

    if (
      minPrice !== undefined &&
      String(minPrice).trim() !== ""
    ) {
      const numericMinPrice = Number(minPrice);

      if (!Number.isFinite(numericMinPrice)) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum price must be a valid number.",
        });
      }

      priceFilter.gte = numericMinPrice;
    }

    if (
      maxPrice !== undefined &&
      String(maxPrice).trim() !== ""
    ) {
      const numericMaxPrice = Number(maxPrice);

      if (!Number.isFinite(numericMaxPrice)) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum price must be a valid number.",
        });
      }

      priceFilter.lte = numericMaxPrice;
    }

    if (
      priceFilter.gte !== undefined &&
      priceFilter.lte !== undefined &&
      priceFilter.gte > priceFilter.lte
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum price cannot be greater than maximum price.",
      });
    }

    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter;
    }

    // =================================================
    // BEDROOM FILTER
    // =================================================

    if (
      bedrooms !== undefined &&
      String(bedrooms).trim() !== ""
    ) {
      const numericBedrooms = Number(bedrooms);

      if (
        !Number.isInteger(numericBedrooms) ||
        numericBedrooms < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Bedrooms must be a valid whole number.",
        });
      }

      where.bedrooms = {
        gte: numericBedrooms,
      };
    }

    // =================================================
    // BATHROOM FILTER
    // =================================================

    if (
      bathrooms !== undefined &&
      String(bathrooms).trim() !== ""
    ) {
      const numericBathrooms = Number(bathrooms);

      if (
        !Number.isInteger(numericBathrooms) ||
        numericBathrooms < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Bathrooms must be a valid whole number.",
        });
      }

      where.bathrooms = {
        gte: numericBathrooms,
      };
    }

    // =================================================
    // PARKING FILTER
    // =================================================

    if (
      parking !== undefined &&
      String(parking).trim() !== ""
    ) {
      const numericParking = Number(parking);

      if (
        !Number.isInteger(numericParking) ||
        numericParking < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Parking must be a valid whole number.",
        });
      }

      where.parking = {
        gte: numericParking,
      };
    }

    // =================================================
    // FURNISHED FILTER
    // =================================================

    if (
      furnished !== undefined &&
      String(furnished).trim() !== ""
    ) {
      const normalizedFurnished = String(furnished)
        .trim()
        .toLowerCase();

      if (normalizedFurnished === "true") {
        where.furnished = true;
      } else if (normalizedFurnished === "false") {
        where.furnished = false;
      } else {
        return res.status(400).json({
          success: false,
          message: "Furnished must be true or false.",
        });
      }
    }

    // =================================================
    // FETCH PROPERTIES
    // =================================================

    const properties =
      await prisma.property.findMany({
        where,

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

      filters: {
        search: search || null,
        location: location || null,
        propertyType: propertyType || null,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        bedrooms: bedrooms || null,
        bathrooms: bathrooms || null,
        parking: parking || null,
        furnished: furnished || null,
      },

      count: properties.length,

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
      error: error.message,
      code: error.code || null,
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
      error: error.message,
      code: error.code || null,
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

    if (existingProperty.ownerId !== ownerId) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to update this property.",
      });
    }

    const updateData = {};

    // =================================================
    // TITLE
    // =================================================

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Property title cannot be empty.",
        });
      }

      updateData.title = String(title).trim();
    }

    // =================================================
    // DESCRIPTION
    // =================================================

    if (description !== undefined) {
      updateData.description =
        description &&
        String(description).trim()
          ? String(description).trim()
          : null;
    }

    // =================================================
    // LOCATION
    // =================================================

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

    // =================================================
    // PROPERTY TYPE
    // =================================================

    if (propertyType !== undefined) {
      updateData.propertyType =
        propertyType &&
        String(propertyType).trim()
          ? String(propertyType).trim()
          : null;
    }

    // =================================================
    // PRICE
    // =================================================

    if (price !== undefined) {
      if (price === "") {
        return res.status(400).json({
          success: false,
          message: "Property price is required.",
        });
      }

      const numericPrice = Number(price);

      if (!Number.isFinite(numericPrice)) {
        return res.status(400).json({
          success: false,
          message:
            "Property price must be a valid number.",
        });
      }

      updateData.price = numericPrice;
    }

    // =================================================
    // BEDROOMS
    // =================================================

    if (bedrooms !== undefined) {
      if (bedrooms === "") {
        updateData.bedrooms = null;
      } else {
        const numericBedrooms = Number(bedrooms);

        if (!Number.isInteger(numericBedrooms)) {
          return res.status(400).json({
            success: false,
            message:
              "Bedrooms must be a whole number.",
          });
        }

        updateData.bedrooms = numericBedrooms;
      }
    }

    // =================================================
    // BATHROOMS
    // =================================================

    if (bathrooms !== undefined) {
      if (bathrooms === "") {
        updateData.bathrooms = null;
      } else {
        const numericBathrooms =
          Number(bathrooms);

        if (!Number.isInteger(numericBathrooms)) {
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

    // =================================================
    // PARKING
    // =================================================

    if (parking !== undefined) {
      if (parking === "") {
        updateData.parking = null;
      } else {
        const numericParking = Number(parking);

        if (!Number.isInteger(numericParking)) {
          return res.status(400).json({
            success: false,
            message:
              "Parking spaces must be a whole number.",
          });
        }

        updateData.parking = numericParking;
      }
    }

    // =================================================
    // LATITUDE
    // =================================================

    if (latitude !== undefined) {
      if (latitude === "") {
        updateData.latitude = null;
      } else {
        const numericLatitude = Number(latitude);

        if (!Number.isFinite(numericLatitude)) {
          return res.status(400).json({
            success: false,
            message:
              "Latitude must be a valid number.",
          });
        }

        updateData.latitude = numericLatitude;
      }
    }

    // =================================================
    // LONGITUDE
    // =================================================

    if (longitude !== undefined) {
      if (longitude === "") {
        updateData.longitude = null;
      } else {
        const numericLongitude =
          Number(longitude);

        if (!Number.isFinite(numericLongitude)) {
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

    // =================================================
    // IMAGE URL
    // =================================================

    if (imageUrl !== undefined) {
      updateData.imageUrl =
        imageUrl &&
        String(imageUrl).trim()
          ? String(imageUrl).trim()
          : null;
    }

    // =================================================
    // UPDATE
    // =================================================

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
      message:
        "Property updated successfully.",
      property,
    });
  } catch (error) {
    console.error(
      "UPDATE PROPERTY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update property.",
      error: error.message,
      code: error.code || null,
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
      message:
        "Property deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE PROPERTY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete property.",
      error: error.message,
      code: error.code || null,
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
      message:
        "Failed to fetch your properties.",
      error: error.message,
      code: error.code || null,
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