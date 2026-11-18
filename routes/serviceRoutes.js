const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const verifyTechnician = require("../middleware/verifyTechnician");

const {
  createService,
  getApprovedServices,
  getServiceById,
  getMyServices,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

// Public Routes
router.get("/", getApprovedServices);

// Technician Routes
router.get("/my-services", verifyToken, verifyTechnician, getMyServices);

router.post("/", verifyToken, verifyTechnician, createService);

router.patch("/:id", verifyToken, verifyTechnician, updateService);

router.delete("/:id", verifyToken, verifyTechnician, deleteService);

// Single Service Route
router.get("/:id", getServiceById);

module.exports = router;
