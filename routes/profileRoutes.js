const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

// Get Own Profile
router.get("/", verifyToken, getProfile);

// Update Own Profile
router.patch("/", verifyToken, updateProfile);

module.exports = router;
