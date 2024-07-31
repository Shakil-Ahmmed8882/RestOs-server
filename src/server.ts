import mongoose from "mongoose";
import app from "./app";
const port = 5000;

async function main() {
  try {
    
    // await mongoose.connect("mongodb://localhost:27017");
    await mongoose.connect("mongodb+srv://RestaurantManagementSystem:VvORLvvbBbIXOxvo@cluster0.sk8jxpx.mongodb.net/RestOS?retryWrites=true&w=majority");
    app.listen(port, () => {
      console.log(`app is listening on port ${port}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
