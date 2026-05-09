import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";

const port = process.env.PORT || 5000;

// Only connect to MongoDB and listen if not in serverless environment
if (!process.env.VERCEL) {
  async function main() {
    try {
      // await mongoose.connect("mongodb://localhost:27017");
      await mongoose.connect(`${config.database_url}`);

      app.listen(port, () => {
        console.log(`app is listening on port ${port}`);
      });
    } catch (err) {
      console.log(err);
    }
  }

  main();
}

// Export the app for serverless functions
export default app;
