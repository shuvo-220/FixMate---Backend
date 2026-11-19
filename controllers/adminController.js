const mongoose = require("mongoose");

const Service = require("../models/serviceModel");
const Booking = require("../models/bookingModel");

// Better Auth User Collection
const getUserCollection = () => {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB is not connected!");
  }

  return db.collection("user");
};

// Find User by ID (Better Auth)
const getUserIdFilter = (id) => {
  const filters = [{ _id: id }, { id }];

  if (mongoose.Types.ObjectId.isValid(id)) {
    filters.push({
      _id: new mongoose.Types.ObjectId(id),
    });
  }

  return { $or: filters };
};

// 1. Get All Pending Services
const getPendingServices = async (req, res) => {
  try {
    const services = await Service.find({
      approvalStatus: "pending",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: services.length,
      services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Approve Service
const approveService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found!",
      });
    }

    if (service.approvalStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending services can be approved!",
      });
    }

    service.approvalStatus = "approved";

    await service.save();

    res.status(200).json({
      success: true,
      message: "Service approved successfully!",
      service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Reject Service
const rejectService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found!",
      });
    }

    if (service.approvalStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending services can be rejected!",
      });
    }

    service.approvalStatus = "rejected";

    await service.save();

    res.status(200).json({
      success: true,
      message: "Service rejected successfully!",
      service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await getUserCollection()
      .find(
        {},
        {
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
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Update User Role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    const allowedRoles = ["customer", "technician"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be customer or technician!",
      });
    }

    const collection = getUserCollection();

    const user = await collection.findOne(
      getUserIdFilter(id)
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // Prevent Admin from changing own role
    const userId = String(user.id || user._id);
    const adminId = String(req.user.id);

    if (userId === adminId || String(user._id) === adminId) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role!",
      });
    }

    // Prevent changing another Admin's role
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin role cannot be changed!",
      });
    }

    await collection.updateOne(
      getUserIdFilter(id),
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = await collection.findOne(
      getUserIdFilter(id),
      {
        projection: {
          name: 1,
          email: 1,
          role: 1,
          phone: 1,
          area: 1,
          bio: 1,
          image: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "User role updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Get All Bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .sort({ createdAt: -1 });

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

// 7. Get All Services with Search, Filter and Sorting
const getAllServices = async (req, res) => {
  try {
    const {
      search,
      category,
      approvalStatus,
      isAvailable,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};

    // Search
    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { technicianName: searchRegex },
        { technicianEmail: searchRegex },
      ];
    }

    // Category Filter
    if (category) {
      const allowedCategories = [
        "Smartphone",
        "Laptop & PC",
        "AC",
        "Refrigerator",
        "TV",
        "Washing Machine",
        "Electrical",
      ];

      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid service category!",
        });
      }

      filter.category = category;
    }

    // Approval Status Filter
    if (approvalStatus) {
      const allowedStatuses = [
        "pending",
        "approved",
        "rejected",
      ];

      if (!allowedStatuses.includes(approvalStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid approval status!",
        });
      }

      filter.approvalStatus = approvalStatus;
    }

    // Availability Filter
    if (isAvailable !== undefined) {
      if (!["true", "false"].includes(isAvailable)) {
        return res.status(400).json({
          success: false,
          message: "isAvailable must be true or false!",
        });
      }

      filter.isAvailable = isAvailable === "true";
    }

    // Sorting
    const allowedSortFields = [
      "createdAt",
      "basePrice",
      "title",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort field!",
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        success: false,
        message: "Order must be asc or desc!",
      });
    }

    const sortOrder = order === "asc" ? 1 : -1;

    const services = await Service.find(filter).sort({
      [sortBy]: sortOrder,
    });

    res.status(200).json({
      success: true,
      total: services.length,
      services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPendingServices,
  approveService,
  rejectService,
  getAllUsers,
  updateUserRole,
  getAllBookings,
  getAllServices,
};
