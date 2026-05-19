// Load .env FIRST, before any module that reads process.env at import time.
import "./app/config";

import express from "express";
import mongoose from "mongoose";

// Create a fallback app in case the main app fails to load
const fallbackApp = express();

let loadError: any = null;
let isConnected = false;

fallbackApp.all("*", (_req, res) => {
  res.status(200).json({
    success: false,
    message: loadError ? `App loading failed: ${loadError.message}` : "Server is running but full app not loaded yet",
    error: loadError?.message,
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
  console.log("DATABASE_URL available:", !!configModule.database_url);

  // Add request timeout middleware for serverless
  if (process.env.VERCEL) {
    mainApp.use((req: any, res: any, next: any) => {
      // Set a 25-second timeout for requests (Vercel's limit is 60 for Pro, 10 for free)
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(504).json({
            success: false,
            message: "Request timeout - database or service is not responding",
          });
        }
      }, 25000);

      res.on("finish", () => clearTimeout(timeout));
      res.on("close", () => clearTimeout(timeout));

      next();
    });
  }

  // Only connect to MongoDB and listen if not in serverless environment
  if (!process.env.VERCEL) {
    async function main() {
      try {
        if (configModule.database_url) {
          console.log("Connecting to database...");
          await mongoose.connect(configModule.database_url, {
            socketTimeoutMS: 5000,
            serverSelectionTimeoutMS: 5000,
          });
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

    // In serverless, cache the connection promise and AWAIT it before every
    // request reaches a route handler. Without this, the first request after
    // a cold start races with mongoose.connect() and writes can hang/fail.
    let dbPromise: Promise<typeof mongoose> | null = null;
    const connect = () => {
      if (!configModule.database_url) {
        return Promise.reject(new Error("DATABASE_URL is not configured"));
      }
      if (!dbPromise) {
        dbPromise = mongoose
          .connect(configModule.database_url, {
            // Higher timeouts than dev — Atlas + Vercel cold paths can be slow.
            socketTimeoutMS: 20000,
            serverSelectionTimeoutMS: 15000,
            // Keep the pool small in serverless — every container is short-lived.
            maxPoolSize: 5,
          })
          .then((m) => {
            console.log("Database connected in serverless");
            isConnected = true;
            return m;
          })
          .catch((err) => {
            // Reset so the NEXT request can retry instead of permanently failing.
            dbPromise = null;
            console.error("Failed to connect to database:", err?.message);
            throw err;
          });
      }
      return dbPromise;
    };

    // Kick off the connection eagerly on module load
    connect().catch(() => {
      /* errors already logged; per-request middleware below will retry */
    });

    // Gate every request on a ready DB connection
    mainApp.use(async (_req: any, res: any, next: any) => {
      if (mongoose.connection.readyState === 1) return next();
      try {
        await connect();
        next();
      } catch (err: any) {
        res.status(503).json({
          success: false,
          message: "Database is warming up, please retry in a moment.",
          error: err?.message,
        });
      }
    });
  }
} catch (error: any) {
  loadError = error;
  console.error("Error loading main app:", error?.message);
  console.error("Stack:", error?.stack);
  // Will use fallback app
}

// Export the app for serverless functions
export default mainApp;
