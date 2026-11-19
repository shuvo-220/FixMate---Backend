const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const verifyCustomer = require("../middleware/verifyCustomer");

const {
  createCheckoutSession,
} = require("../controllers/paymentController");

// Customer Payment Route
router.post(
  "/create-checkout-session",
  verifyToken,
  verifyCustomer,
  createCheckoutSession
);

module.exports = router;
