const express = require("express");
const prisma = require("../lib/prisma");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  res.json({ success: true, notifications });
});

router.patch("/read", protect, async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });

  res.json({ success: true, updatedCount: result.count });
});

router.patch("/:id/read", protect, async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: {
      id: req.params.id,
      userId: req.user.id,
      read: false,
    },
    data: { read: true },
  });

  if (result.count === 0) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      select: { id: true },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }
  }

  res.json({ success: true });
});

module.exports = router;