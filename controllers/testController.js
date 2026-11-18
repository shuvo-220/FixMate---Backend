const testProtectedRoute = (req, res) => {
  res.status(200).json({
    success: true,
    message: "JWT verification successful!",
    user: req.user,
  });
};

module.exports = { testProtectedRoute };