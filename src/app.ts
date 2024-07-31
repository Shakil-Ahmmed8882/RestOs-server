import { Request, Response } from "express";
import router from "./route";

const express = require("express");
const cors = require("cors");
const app = express();

// parser
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// application routes
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.send("No No No No");
});

export default app;
