import mongoose from "mongoose";
import app from "../src/app";
import config from "../src/app/config";
import { Request, Response, NextFunction } from "express";

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log("Database is already connected");
    return;
  }

  try {
    console.log("Attempting to connect to database...");
    console.log("DATABASE_URL exists:", !!config.database_url);

    if (!config.database_url) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    await mongoose.connect(`${config.database_url}`);
    isConnected = true;
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

// Wrap the app with error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Initialize database connection
connectDB().catch((error) => {
  console.error("Failed to initialize database:", error);
});

export default app;
