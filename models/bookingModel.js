const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    serviceTitle: {
      type: String,
      required: true,
    },

    serviceImage: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    basePrice: {
      type: Number,
      required: true,
    },

    technicianName: {
      type: String,
      required: true,
    },

    technicianEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    preferredDate: {
      type: Date,
      required: true,
    },

    problemDescription: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "rejected",
        "in-progress",
        "completed",
        "cancelled",
      ],
      default: "requested",
    },

    finalAmount: {
      type: Number,
      default: function () {
        return this.basePrice;
      },
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
