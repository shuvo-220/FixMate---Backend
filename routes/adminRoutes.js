const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");

const {
  getPendingServices,
  approveService,
  rejectService,
} = require("../controllers/adminController");

const {
  getAllPayments,
} = require("../controllers/paymentController");

// All routes require Admin authentication
router.use(verifyToken, verifyAdmin);

// Get Pending Services
router.get("/pending-services", getPendingServices);

// Approve Service
router.patch("/services/:id/approve", approveService);

// Reject Service
router.patch("/services/:id/reject", rejectService);

// Get All Payments (Admin Only)
router.get("/payments", getAllPayments);

module.exports = router;
