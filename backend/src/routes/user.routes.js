const express = require("express");
const router = express.Router();

const prisma = require("../lib/prisma");
const {
  protect,
  requireAdmin,
} = require("../middleware/authMiddleware");

router.put("/me", protect, async (req, res) => {
  try {
    const { name, phone } = req.body || {};

    if (!name && !phone) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update your profile.",
      });
    }

    const dataToUpdate = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      dataToUpdate.name = trimmedName;
    }

    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      dataToUpdate.phone = trimmedPhone || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update current user error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// =====================================================
// GET ALL USERS
// GET /api/users
// ADMIN ONLY
// =====================================================

router.get(
  "/",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      console.error("Get users error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  }
);

// =====================================================
// GET USER BY ID
// GET /api/users/:id
// ADMIN ONLY
// =====================================================

router.get(
  "/:id",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Get user error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch user",
      });
    }
  }
);

// =====================================================
// DELETE USER BY ID
// DELETE /api/users/:id
// ADMIN ONLY
// =====================================================

router.delete(
  "/:id",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: "You cannot delete your own admin account",
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await prisma.user.delete({
        where: {
          id,
        },
      });

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  }
);

module.exports = router;
