import mongoose from "mongoose";
import app from "../src/app";
import config from "../src/app/config";

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
    // Don't throw - allow the app to serve even if DB is not connected
    // This will help with debugging
  }
}

// Initialize database connection
connectDB();

export default app;
