require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

const serviceRoutes = require("./routes/serviceRoutes");
const adminRoutes = require("./routes/adminRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const imageRoutes = require("./routes/imageRoutes");

const {
  handleStripeWebhook,
} = require("./controllers/paymentController");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

const startServer = async () => {
  try {
    await connectDB();

    const { createAuth } = await import("./config/auth.mjs");
    const { toNodeHandler } = await import("better-auth/node");

    const auth = createAuth();

    // Better Auth
    app.all("/api/auth/*splat", toNodeHandler(auth));

    // Stripe Webhook - Must be before express.json()
    app.post(
      "/api/payments/webhook",
      express.raw({ type: "application/json" }),
      handleStripeWebhook
    );

    // JSON Middleware
    app.use(express.json());

    // Home Route
    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message: "FixMate API is running!",
      });
    });

    // API Routes
    app.use("/api/services", serviceRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/bookings", bookingRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/profile", profileRoutes);
    app.use("/api/images", imageRoutes);

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`FixMate server running on port ${PORT}`);
      console.log("Better Auth is ready!");
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
