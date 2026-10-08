const prisma = require("../lib/prisma");

const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rating, comment, propertyId, targetUserId } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: "Rating is required",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number between 1 and 5",
      });
    }

    if (!propertyId && !targetUserId) {
      return res.status(400).json({
        success: false,
        message: "A property or user must be selected for the review",
      });
    }

    if (propertyId && targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Review either a property or a user, not both",
      });
    }

    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Property not found",
        });
      }

      if (property.ownerId === userId) {
        return res.status(403).json({
          success: false,
          message: "You cannot review your own property",
        });
      }

      const existingReview = await prisma.review.findFirst({
        where: {
          authorId: userId,
          propertyId,
        },
      });

      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: "You have already reviewed this property",
          review: existingReview,
        });
      }

      const review = await prisma.review.create({
        data: {
          rating: numericRating,
          comment: comment?.trim() || null,
          authorId: userId,
          propertyId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: "Review added successfully",
        review,
      });
    }

    if (targetUserId) {
      if (targetUserId === userId) {
        return res.status(403).json({
          success: false,
          message: "You cannot review yourself",
        });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const existingReview = await prisma.review.findFirst({
        where: {
          authorId: userId,
          targetUserId,
        },
      });

      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: "You have already reviewed this user",
          review: existingReview,
        });
      }

      const review = await prisma.review.create({
        data: {
          rating: numericRating,
          comment: comment?.trim() || null,
          authorId: userId,
          targetUserId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: "User review added successfully",
        review,
      });
    }
  } catch (error) {
    console.error("CREATE REVIEW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};

const getPropertyReviews = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews
        : 0;

    return res.json({
      success: true,
      reviews,
      summary: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
      },
    });
  } catch (error) {
    console.error("GET PROPERTY REVIEWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load property reviews",
      error: error.message,
    });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { targetUserId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews
        : 0;

    return res.json({
      success: true,
      reviews,
      summary: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
      },
    });
  } catch (error) {
    console.error("GET USER REVIEWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load user reviews",
      error: error.message,
    });
  }
};

const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own reviews",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number between 1 and 5",
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating: numericRating,
        comment: comment?.trim() || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("UPDATE REVIEW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews",
      });
    }

    await prisma.review.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("DELETE REVIEW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

module.exports = {
  createReview,
  getPropertyReviews,
  getUserReviews,
  updateReview,
  deleteReview,
};
