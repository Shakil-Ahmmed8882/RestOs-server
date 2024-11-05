import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";
const port = 5000;

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
