const Service = require("../models/serviceModel");

// 1. Get All Pending Services (Admin)
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

// 2. Approve Service (Admin)
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

// 3. Reject Service (Admin)
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

module.exports = {
  getPendingServices,
  approveService,
  rejectService,
};
