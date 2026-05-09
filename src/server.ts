import express from "express";
import mongoose from "mongoose";

// Create a fallback app in case the main app fails to load
const fallbackApp = express();

fallbackApp.all("*", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running but full app not loaded yet",
  });
});

let mainApp = fallbackApp;

try {
  console.log("Loading app module...");
  const appModule = require("./app");
  console.log("App module loaded, getting default...");
  const mainModule = appModule.default;
  console.log("App default loaded successfully");

  const configModule = require("./app/config").default;
  console.log("Config loaded successfully");

  mainApp = mainModule;

  const port = process.env.PORT || 5000;
  console.log("Server configured, port:", port);

  // Only connect to MongoDB and listen if not in serverless environment
  if (!process.env.VERCEL) {
    async function main() {
      try {
        if (configModule.database_url) {
          console.log("Connecting to database...");
          await mongoose.connect(configModule.database_url);
          console.log("Database connected");
        }

        mainApp.listen(port, () => {
          console.log(`app is listening on port ${port}`);
        });
      } catch (err) {
        console.log("Error in main():", err);
      }
    }

    main();
  } else {
    console.log("Running in Vercel serverless environment");
  }
} catch (error: any) {
  console.error("Error loading main app:", error?.message);
  console.error("Stack:", error?.stack);
  // Will use fallback app
}

// Export the app for serverless functions
export default mainApp;
