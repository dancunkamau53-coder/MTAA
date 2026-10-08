const express = require("express");

const {
  getServices,
  getMyProviderProfile,
  requestProviderVerification,
  getAdminProviderVerifications,
  decideProviderVerification,
  createProviderProfile,
  updateProviderProfile,
  createOfferedService,
  updateOfferedService,
  createServiceRequest,
  getMyServiceRequests,
  updateServiceRequestStatus,
  submitServiceQuote,
  decideServiceQuote,
  createServiceReview,
  createServiceReport,
  getAdminServiceReports,
  decideServiceReport,
  getServiceMessages,
  sendServiceMessage,
  blockServiceParticipant,
  unblockServiceParticipant,
} = require("../controllers/serviceController");

const {
  protect,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getServices);

router.get(
  "/provider/me",
  protect,
  getMyProviderProfile
);

router.post(
  "/provider/me",
  protect,
  createProviderProfile
);

router.put(
  "/provider/me",
  protect,
  updateProviderProfile
);

router.post(
  "/provider/me/verification",
  protect,
  requestProviderVerification
);

router.post(
  "/provider/me/services",
  protect,
  createOfferedService
);

router.patch(
  "/provider/me/services/:serviceId",
  protect,
  updateOfferedService
);

router.get(
  "/requests/mine",
  protect,
  getMyServiceRequests
);

router.post(
  "/requests",
  protect,
  createServiceRequest
);

router.patch(
  "/requests/:requestId/status",
  protect,
  updateServiceRequestStatus
);

router.patch(
  "/requests/:requestId/quote",
  protect,
  submitServiceQuote
);

router.patch(
  "/requests/:requestId/quote-decision",
  protect,
  decideServiceQuote
);

router.get(
  "/requests/:requestId/messages",
  protect,
  getServiceMessages
);

router.post(
  "/requests/:requestId/messages",
  protect,
  sendServiceMessage
);

router.post(
  "/requests/:requestId/review",
  protect,
  createServiceReview
);

router.post(
  "/requests/:requestId/block",
  protect,
  blockServiceParticipant
);

router.delete(
  "/requests/:requestId/block",
  protect,
  unblockServiceParticipant
);

router.post(
  "/reports",
  protect,
  createServiceReport
);

router.get(
  "/admin/verifications",
  protect,
  requireAdmin,
  getAdminProviderVerifications
);

router.patch(
  "/admin/verifications/:providerId",
  protect,
  requireAdmin,
  decideProviderVerification
);

router.get(
  "/admin/reports",
  protect,
  requireAdmin,
  getAdminServiceReports
);

router.patch(
  "/admin/reports/:reportId",
  protect,
  requireAdmin,
  decideServiceReport
);

module.exports = router;