const express = require("express");

const verifyToken = require("../middleware/verifyToken");
const verifyCustomer = require("../middleware/verifyCustomer");
const verifyTechnician = require("../middleware/verifyTechnician");
const verifyAdmin = require("../middleware/verifyAdmin");

const {
  testProtectedRoute,
} = require("../controllers/testController");

const router = express.Router();

// Any authenticated user
router.get("/protected", verifyToken, testProtectedRoute);

// Customer only
router.get(
  "/customer",
  verifyToken,
  verifyCustomer,
  testProtectedRoute
);

// Technician only
router.get(
  "/technician",
  verifyToken,
  verifyTechnician,
  testProtectedRoute
);

// Admin only
router.get(
  "/admin",
  verifyToken,
  verifyAdmin,
  testProtectedRoute
);

module.exports = router;