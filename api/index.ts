import mongoose from "mongoose";
import app from "../src/app";
import config from "../src/app/config";

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    if (!config.database_url) {
      console.log("DATABASE_URL is not set");
      return;
    }

    console.log("Connecting to database...");
    await mongoose.connect(config.database_url);
    isConnected = true;
    console.log("Database connected successfully");
  } catch (error: any) {
    console.error("Database connection error:", error?.message);
  }
}

// Start database connection in background
connectDB();

// Export the app
export default app;
