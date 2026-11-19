const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const verifyCustomer = require("../middleware/verifyCustomer");

const {
  createCheckoutSession,
  getMyPayments,
} = require("../controllers/paymentController");

// Customer Checkout Session
router.post(
  "/create-checkout-session",
  verifyToken,
  verifyCustomer,
  createCheckoutSession
);

// Customer Payment History
router.get(
  "/my-payments",
  verifyToken,
  verifyCustomer,
  getMyPayments
);

module.exports = router;