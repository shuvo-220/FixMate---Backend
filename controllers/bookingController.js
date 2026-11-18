const mongoose = require("mongoose");
const Booking = require("../models/bookingModel");
const Service = require("../models/serviceModel");

// 1. Create Booking (Customer)
const createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      customerPhone,
      address,
      preferredDate,
      problemDescription,
    } = req.body;

    if (
      !serviceId ||
      !customerPhone ||
      !address ||
      !preferredDate ||
      !problemDescription
    ) {
      return res.status(400).json({
        success: false,
        message: "All booking fields are required!",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID!",
      });
    }

    const bookingDate = new Date(preferredDate);

    if (Number.isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid preferred date!",
      });
    }

    // Find approved and available service
    const service = await Service.findOne({
      _id: serviceId,
      approvalStatus: "approved",
      isAvailable: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or unavailable!",
      });
    }

    // Technician cannot book own service
    if (
      service.technicianEmail.toLowerCase() ===
      req.user.email.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot book your own service!",
      });
    }

    // Prevent duplicate active booking for the same service
    const existingBooking = await Booking.findOne({
      serviceId: service._id,
      customerEmail: req.user.email,
      status: { $in: ["requested", "accepted", "in-progress"] },
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "You already have an active booking for this service!",
      });
    }

    const booking = await Booking.create({
      serviceId: service._id,
      serviceTitle: service.title,
      serviceImage: service.image,
      category: service.category,
      basePrice: service.basePrice,
      technicianName: service.technicianName,
      technicianEmail: service.technicianEmail,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone,
      address,
      preferredDate: bookingDate,
      problemDescription,
      status: "requested",
      finalAmount: service.basePrice,
      paymentStatus: "unpaid",
    });

    res.status(201).json({
      success: true,
      message: "Booking request created successfully!",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Get My Bookings (Customer)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customerEmail: req.user.email,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Get Technician Bookings
const getTechnicianBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      technicianEmail: req.user.email,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Update Booking Status (Technician)
const updateBookingStatus = async (req, res) => {
  try {
    const { status, finalAmount } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID!",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      technicianEmail: req.user.email,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found!",
      });
    }

    const allowedTransitions = {
      requested: ["accepted", "rejected"],
      accepted: ["in-progress"],
      "in-progress": ["completed"],
      rejected: [],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change booking status from ${booking.status} to ${status}!`,
      });
    }

    // Final amount must be provided when completing a booking
    if (status === "completed") {
      if (
        finalAmount === undefined ||
        finalAmount === null ||
        finalAmount === "" ||
        !Number.isFinite(Number(finalAmount)) ||
        Number(finalAmount) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid final amount is required to complete booking!",
        });
      }

      booking.finalAmount = Number(finalAmount);
    }

    booking.status = status;

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully!",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Cancel Booking (Customer)
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID!",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      customerEmail: req.user.email,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found!",
      });
    }

    if (booking.status !== "requested") {
      return res.status(400).json({
        success: false,
        message: "You can only cancel requested bookings!",
      });
    }

    booking.status = "cancelled";

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully!",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getTechnicianBookings,
  updateBookingStatus,
  cancelBooking,
};
