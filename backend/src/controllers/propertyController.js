const prisma = require("../lib/prisma");

// ===============================
// CREATE PROPERTY
// ===============================

const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      price,
      bedrooms,
      bathrooms,
      imageUrl,
    } = req.body;

    if (!title || !location || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title, location and price are required",
      });
    }

    const property = await prisma.property.create({
      data: {
        title,
        description: description || null,
        location,
        price: Number(price),
        bedrooms:
          bedrooms !== undefined && bedrooms !== null
            ? Number(bedrooms)
            : null,
        bathrooms:
          bathrooms !== undefined && bathrooms !== null
            ? Number(bathrooms)
            : null,
        imageUrl: imageUrl || null,
        ownerId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    console.error("CREATE PROPERTY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create property",
      error: error.message,
    });
  }
};

// ===============================
// GET ALL PROPERTIES
// ===============================

const getProperties = async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    res.json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error("GET PROPERTIES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch properties",
      error: error.message,
    });
  }
};

// ===============================
// GET SINGLE PROPERTY
// ===============================

const getProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: {
        id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.json({
      success: true,
      property,
    });
  } catch (error) {
    console.error("GET PROPERTY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch property",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE PROPERTY
// ===============================

const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProperty = await prisma.property.findUnique({
      where: {
        id,
      },
    });

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (existingProperty.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own property",
      });
    }

    const {
      title,
      description,
      location,
      price,
      bedrooms,
      bathrooms,
      imageUrl,
    } = req.body;

    const property = await prisma.property.update({
      where: {
        id,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(price !== undefined && { price: Number(price) }),
        ...(bedrooms !== undefined && {
          bedrooms:
            bedrooms === null ? null : Number(bedrooms),
        }),
        ...(bathrooms !== undefined && {
          bathrooms:
            bathrooms === null ? null : Number(bathrooms),
        }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    res.json({
      success: true,
      message: "Property updated successfully",
      property,
    });
  } catch (error) {
    console.error("UPDATE PROPERTY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update property",
      error: error.message,
    });
  }
};

// ===============================
// DELETE PROPERTY
// ===============================

const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProperty = await prisma.property.findUnique({
      where: {
        id,
      },
    });

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (existingProperty.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own property",
      });
    }

    await prisma.property.delete({
      where: {
        id,
      },
    });

    res.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PROPERTY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete property",
      error: error.message,
    });
  }
};

module.exports = {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
};
