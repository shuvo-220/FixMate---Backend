const mongoose = require("mongoose");

// Better Auth User Collection
const getUserCollection = () => {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB is not connected!");
  }

  return db.collection("user");
};

// Find logged-in user
const getUserIdFilter = (id) => {
  const filters = [{ _id: id }, { id }];

  if (mongoose.Types.ObjectId.isValid(id)) {
    filters.push({
      _id: new mongoose.Types.ObjectId(id),
    });
  }

  return { $or: filters };
};

// Get Own Profile
const getProfile = async (req, res) => {
  try {
    const collection = getUserCollection();
    const userFilter = getUserIdFilter(req.user.id);

    const user = await collection.findOne(userFilter, {
      projection: {
        name: 1,
        email: 1,
        role: 1,
        phone: 1,
        area: 1,
        bio: 1,
        image: 1,
        emailVerified: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Own Profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, area, bio, image } = req.body;

    const allowedFields = {
      name,
      phone,
      area,
      bio,
      image,
    };

    const updateData = {};

    for (const [key, value] of Object.entries(allowedFields)) {
      if (value !== undefined) {
        if (typeof value !== "string") {
          return res.status(400).json({
            success: false,
            message: `${key} must be a string!`,
          });
        }

        updateData[key] = value.trim();
      }
    }

    if (updateData.name !== undefined && !updateData.name) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty!",
      });
    }

    const maxLengths = {
      name: 100,
      phone: 20,
      area: 100,
      bio: 500,
      image: 1000,
    };

    for (const [key, maxLength] of Object.entries(maxLengths)) {
      if (
        updateData[key] !== undefined &&
        updateData[key].length > maxLength
      ) {
        return res.status(400).json({
          success: false,
          message: `${key} cannot exceed ${maxLength} characters!`,
        });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one profile field to update!",
      });
    }

    const collection = getUserCollection();
    const userFilter = getUserIdFilter(req.user.id);

    const user = await collection.findOne(userFilter);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    await collection.updateOne(userFilter, {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    const updatedUser = await collection.findOne(userFilter, {
      projection: {
        name: 1,
        email: 1,
        role: 1,
        phone: 1,
        area: 1,
        bio: 1,
        image: 1,
        emailVerified: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
