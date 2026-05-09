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
  const mainModule = require("./app").default;
  const configModule = require("./app/config").default;

  mainApp = mainModule;

  const port = process.env.PORT || 5000;

  // Only connect to MongoDB and listen if not in serverless environment
  if (!process.env.VERCEL) {
    async function main() {
      try {
        if (configModule.database_url) {
          await mongoose.connect(configModule.database_url);
        }

        mainApp.listen(port, () => {
          console.log(`app is listening on port ${port}`);
        });
      } catch (err) {
        console.log(err);
      }
    }

    main();
  }
} catch (error) {
  console.error("Error loading main app:", error);
  // Will use fallback app
}

// Export the app for serverless functions
export default mainApp;
