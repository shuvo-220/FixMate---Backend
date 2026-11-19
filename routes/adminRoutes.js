const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");

const {
  getPendingServices,
  approveService,
  rejectService,
  getAllUsers,
  updateUserRole,
} = require("../controllers/adminController");

const {
  getAllPayments,
} = require("../controllers/paymentController");

// All routes require Admin authentication
router.use(verifyToken, verifyAdmin);

// User Management
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);

// Service Management
router.get("/pending-services", getPendingServices);

router.patch("/services/:id/approve", approveService);

router.patch("/services/:id/reject", rejectService);

// Payment Management
router.get("/payments", getAllPayments);

module.exports = router;
