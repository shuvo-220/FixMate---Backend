
const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const verifyCustomer = require("../middleware/verifyCustomer");
const verifyTechnician = require("../middleware/verifyTechnician");

const {
  createBooking,
  getMyBookings,
  getTechnicianBookings,
  updateBookingStatus,
  cancelBooking,
} = require("../controllers/bookingController");

// Customer Routes
router.post("/", verifyToken, verifyCustomer, createBooking);

router.get("/my-bookings", verifyToken, verifyCustomer, getMyBookings);

router.patch("/:id/cancel", verifyToken, verifyCustomer, cancelBooking);

// Technician Routes
router.get(
  "/technician-bookings",
  verifyToken,
  verifyTechnician,
  getTechnicianBookings
);

router.patch(
  "/:id/status",
  verifyToken,
  verifyTechnician,
  updateBookingStatus
);

module.exports = router;
