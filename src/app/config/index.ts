import { config } from "dotenv";
import path from "path";

// Resolve .env relative to the repo root (this file lives at
// src/app/config/index.ts, so go up three levels). This prevents
// "STORE_ID is undefined" when the process is started from any cwd.
const ENV_PATH = path.resolve(__dirname, "../../../.env");

try {
  const result = config({ path: ENV_PATH });
  if (result.error) {
    console.log("dotenv load error:", result.error.message);
  } else {
    console.log(
      "dotenv loaded from",
      ENV_PATH,
      "— STORE_ID set:",
      !!process.env.STORE_ID
    );
  }
} catch (error) {
  console.log("Could not load .env file:", error);
}
export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,

  database_url: process.env.DATABASE_URL,

  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,

  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,

  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUND,
  reset_pass_ui_link: process.env.RESET_PASS_UI_LINK,

  smtp_host: process.env.SMTP_HOST,
  smtp_port: parseInt(process.env.SMTP_PORT || '587'),
  smtp_user: process.env.SMTP_USER,
  smtp_pass: process.env.SMTP_PASS,

  // is_live: process.env.IS_LIVE,
  // server_url: process.env.SERVER_URL,
  // client_url: process.env.CLIENT_URL,

  demo_admin_email: process.env.DEMO_ADMIN_EMAIL,
  demo_admin_password: process.env.DEMO_ADMIN_PASSWORD,
};
