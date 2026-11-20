const axios = require("axios");

const uploadImage = async (req, res) => {
  try {
    let { image } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid image!",
      });
    }

    if (!process.env.IMGBB_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "ImgBB API key is not configured!",
      });
    }

    // Remove Data URL prefix if present
    image = image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");

    // Remove whitespace
    image = image.replace(/\s/g, "");

    // Validate Base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

    if (
      !base64Regex.test(image) ||
      image.length % 4 === 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid image Base64 format!",
      });
    }

    const formData = new URLSearchParams();
    formData.append("image", image);

    const response = await axios.post(
      "https://api.imgbb.com/1/upload",
      formData,
      {
        params: {
          key: process.env.IMGBB_API_KEY,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 30000,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully!",
      imageUrl: response.data.data.url,
    });
  } catch (error) {
    console.error(
      "Image Upload Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.error?.message ||
        "Image upload failed!",
    });
  }
};

module.exports = { uploadImage };
