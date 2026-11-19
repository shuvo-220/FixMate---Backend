const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  updateProfile,
} = require("../controllers/profileController");

// Update Own Profile
router.patch("/", verifyToken, updateProfile);

module.exports = router;