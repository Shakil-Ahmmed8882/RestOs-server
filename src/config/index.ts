import { config } from "dotenv";

config();
export default {
  database_url: process.env.Database_URL,
};
