const Service = require('../models/serviceModel');

// 1. Create Service (Technician)
const createService = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      image,
      basePrice,
      estimatedDuration,
      serviceMode,
      serviceArea,
    } = req.body;

    // Validate technician information from JWT
    if (!req.user || !req.user.name || !req.user.email) {
      return res.status(401).json({
        success: false,
        message: "Technician information is missing. Please login again.",
      });
    }

    const service = await Service.create({
      title,
      category,
      description,
      image,
      basePrice,
      estimatedDuration,
      serviceMode,
      serviceArea,

      // Technician information comes from verified JWT
      technicianName: req.user.name,
      technicianEmail: req.user.email,

      approvalStatus: "pending",
      isAvailable: true,
    });

    res.status(201).json({
      success: true,
      message:
        "Service created successfully. Waiting for admin approval.",
      service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Get All Approved Services (Public)
const getApprovedServices = async (req, res) => {
  try {
    const {
      search,
      category,
      serviceMode,
      serviceArea,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {
      approvalStatus: "approved",
      isAvailable: true,
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (serviceMode) {
      filter.serviceMode = serviceMode;
    }

    if (serviceArea) {
      filter.serviceArea = {
        $regex: serviceArea,
        $options: "i",
      };
    }

    const allowedSortFields = [
      "createdAt",
      "basePrice",
      "title",
    ];

    const selectedSortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sortOrder = order === "asc" ? 1 : -1;

    const services = await Service.find(filter).sort({
      [selectedSortField]: sortOrder,
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

// 3. Get Single Approved Service (Public)
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      approvalStatus: "approved",
      isAvailable: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found!",
      });
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid service ID!",
    });
  }
};

// 4. Get My Services (Technician)
const getMyServices = async (req, res) => {
  try {
    const services = await Service.find({
      technicianEmail: req.user.email,
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

// 5. Update Own Service (Technician)
const updateService = async (req, res) => {
  try {
    const editableFields = [
      "title",
      "category",
      "description",
      "image",
      "basePrice",
      "estimatedDuration",
      "serviceMode",
      "serviceArea",
    ];

    const updateData = {};

    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Availability can be updated separately
    if (req.body.isAvailable !== undefined) {
      updateData.isAvailable = req.body.isAvailable;
    }

    const service = await Service.findOne({
      _id: req.params.id,
      technicianEmail: req.user.email,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or you are not the owner!",
      });
    }

    Object.assign(service, updateData);

    // Only actual service detail edits require admin approval again.
    // Availability-only changes will not reset approval status.
    const hasServiceDetailsChanged = editableFields.some(
      (field) => req.body[field] !== undefined
    );

    if (hasServiceDetailsChanged) {
      service.approvalStatus = "pending";
    }

    await service.save();

    res.status(200).json({
      success: true,
      message: hasServiceDetailsChanged
        ? "Service updated. Waiting for admin approval again."
        : "Service availability updated successfully!",
      service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// 6. Delete Own Service (Technician)
const deleteService = async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      technicianEmail: req.user.email,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or you are not the owner!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service deleted successfully!",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid service ID!",
    });
  }
};

module.exports = {
  createService,
  getApprovedServices,
  getServiceById,
  getMyServices,
  updateService,
  deleteService,
};
