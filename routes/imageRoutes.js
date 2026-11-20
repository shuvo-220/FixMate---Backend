const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const { uploadImage } = require("../controllers/imageController");

// Only authenticated users can upload images
router.post("/upload", verifyToken, uploadImage);

module.exports = router;
