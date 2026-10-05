const prisma = require("../lib/prisma");

const createOwnerNotification = async (
  property,
  actorId,
  notification
) => {
  if (property.ownerId === actorId) {
    return;
  }

  try {
    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        ...notification,
      },
    });
  } catch (error) {
    console.error("Create property notification error:", error);
  }
};

// ==========================================
// LIKE / UNLIKE PROPERTY
// ==========================================

const toggleLike = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check if user already liked the property
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    // ==========================================
    // UNLIKE
    // ==========================================

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      const likesCount = await prisma.like.count({
        where: {
          propertyId,
        },
      });

      return res.json({
        success: true,
        liked: false,
        likesCount,
        message: "Property unliked",
      });
    }

    // ==========================================
    // LIKE
    // ==========================================

    await prisma.like.create({
      data: {
        userId,
        propertyId,
      },
    });

    await createOwnerNotification(property, userId, {
      title: "Your property got a like",
      detail: `Someone liked your listing: ${property.title}.`,
      type: "like",
    });

    const likesCount = await prisma.like.count({
      where: {
        propertyId,
      },
    });

    return res.json({
      success: true,
      liked: true,
      likesCount,
      message: "Property liked",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SAVE / UNSAVE PROPERTY
// ==========================================

const toggleSave = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check if already saved
    const existingSave =
      await prisma.savedProperty.findUnique({
        where: {
          userId_propertyId: {
            userId,
            propertyId,
          },
        },
      });

    // ==========================================
    // UNSAVE
    // ==========================================

    if (existingSave) {
      await prisma.savedProperty.delete({
        where: {
          id: existingSave.id,
        },
      });

      const savesCount =
        await prisma.savedProperty.count({
          where: {
            propertyId,
          },
        });

      return res.json({
        success: true,
        saved: false,
        savesCount,
        message:
          "Property removed from saved properties",
      });
    }

    // ==========================================
    // SAVE
    // ==========================================

    await prisma.savedProperty.create({
      data: {
        userId,
        propertyId,
      },
    });

    await createOwnerNotification(property, userId, {
      title: "Your property was saved",
      detail: `Someone saved your listing: ${property.title}.`,
      type: "saved",
    });

    const savesCount =
      await prisma.savedProperty.count({
        where: {
          propertyId,
        },
      });

    return res.json({
      success: true,
      saved: true,
      savesCount,
      message: "Property saved",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET LIKE / SAVE STATUS
// ==========================================

const getInteractionStatus = async (
  req,
  res,
  next
) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Get all interaction information together
    const [
      like,
      save,
      likesCount,
      savesCount,
    ] = await Promise.all([
      prisma.like.findUnique({
        where: {
          userId_propertyId: {
            userId,
            propertyId,
          },
        },
      }),

      prisma.savedProperty.findUnique({
        where: {
          userId_propertyId: {
            userId,
            propertyId,
          },
        },
      }),

      prisma.like.count({
        where: {
          propertyId,
        },
      }),

      prisma.savedProperty.count({
        where: {
          propertyId,
        },
      }),
    ]);

    return res.json({
      success: true,
      liked: Boolean(like),
      saved: Boolean(save),
      likesCount,
      savesCount,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET SAVED PROPERTIES
// ==========================================

const getSavedProperties = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user.id;

    // Get properties saved by the logged-in user
    const savedProperties =
      await prisma.savedProperty.findMany({
        where: {
          userId,
        },

        include: {
          property: {
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
                  isCover: "desc",
                },
              },
            },
          },
        },

        // Most recently saved first
        orderBy: {
          createdAt: "desc",
        },
      });

    // Return only the property objects
    const properties = savedProperties
      .map((saved) => saved.property)
      .filter(Boolean);

    return res.json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADD COMMENT
// ==========================================

const addComment = async (
  req,
  res,
  next
) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    // Validate comment
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty",
      });
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId,
        propertyId,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await createOwnerNotification(property, userId, {
      title: `New inquiry about ${property.title}`,
      detail: content.trim(),
      type: "inquiry",
    });

    return res.status(201).json({
      success: true,
      message: "Comment added",
      comment,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET PROPERTY COMMENTS
// ==========================================

const getComments = async (
  req,
  res,
  next
) => {
  try {
    const { propertyId } = req.params;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Get comments
    const comments =
      await prisma.comment.findMany({
        where: {
          propertyId,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE OWN COMMENT
// ==========================================

const deleteComment = async (
  req,
  res,
  next
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Find comment
    const comment =
      await prisma.comment.findUnique({
        where: {
          id: commentId,
        },
      });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Make sure the logged-in user owns
    // the comment
    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message:
          "You can only delete your own comment",
      });
    }

    // Delete comment
    await prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    return res.json({
      success: true,
      message: "Comment deleted",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  toggleLike,
  toggleSave,
  getInteractionStatus,
  getSavedProperties,
  addComment,
  getComments,
  deleteComment,
};

