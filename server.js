require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const serviceRoutes = require('./routes/serviceRoutes');

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

    app.use(express.json());


    // Home route
    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message: "FixMate API is running!",
      });
    });

    const PORT = process.env.PORT || 5000;


    app.use("/api/services", serviceRoutes);

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