const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Smartphone",
        "Laptop & PC",
        "AC",
        "Refrigerator",
        "TV",
        "Washing Machine",
        "Electrical",
      ],
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    basePrice: {
      type: Number,
      required: true,
      min: 1,
    },

    estimatedDuration: {
      type: String,
      required: true,
    },

    serviceMode: {
      type: String,
      required: true,
      enum: ["Home Visit", "Shop Drop-off"],
    },

    serviceArea: {
      type: String,
      required: true,
      trim: true,
    },

    technicianName: {
      type: String,
      required: true,
      trim: true,
    },

    technicianEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
