const verifyTechnician = (req, res, next) => {
  if (req.user.role !== "technician") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Technician access only!",
    });
  }

  next();
};

module.exports = verifyTechnician;