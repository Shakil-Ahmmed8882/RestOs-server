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
      console.log("DATABASE_URL is not set, skipping connection");
      return;
    }

    console.log("Connecting to database...");
    await mongoose.connect(`${config.database_url}`);
    isConnected = true;
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

// Initialize database connection
connectDB().catch((error) => {
  console.error("Failed to initialize database:", error);
});

export default app;
