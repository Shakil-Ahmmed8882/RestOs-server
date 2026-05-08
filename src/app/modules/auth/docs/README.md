# Authentication API Documentation

This folder contains comprehensive documentation for all authentication endpoints in the RestOs backend.

## 📚 Documentation Files

### 1. [REGISTER.md](./REGISTER.md)
**User Registration with Image Upload**

Covers:
- ✅ Manual signup with password and image upload
- ✅ Manual signup without image (default photo)
- ✅ OAuth signup (Google/GitHub - no password)
- 📋 Postman testing guide
- 🔒 Token management after registration
- 📝 Error scenarios and solutions

**Key Points:**
- Images uploaded to Cloudinary
- Automatic login after registration
- Password hashing with bcrypt
- Optional password for OAuth users

---

### 2. [FORGET_PASSWORD.md](./FORGET_PASSWORD.md)
**Request Password Reset Link**

Covers:
- 🔐 Forgot password flow
- 🔑 Reset token generation (10-minute expiration)
- 📧 Email with reset link
- 📋 Postman testing guide
- 🔒 Authorization requirements
- 📝 Error scenarios and solutions

**Key Points:**
- Requires authentication (access token)
- Generates 10-minute reset token
- Sends reset link via email
- User ID extracted from logged-in token

---

### 3. [RESET_PASSWORD.md](./RESET_PASSWORD.md)
**Complete Password Reset**

Covers:
- 🔑 Using reset token from email
- 🔐 Setting new password
- 🔒 Token and user ID validation
- 📋 Postman testing guide
- 🔄 Complete testing flow
- 📝 Error scenarios and solutions

**Key Points:**
- Reset token from email (10-minute window)
- Password hashing before storage
- User ID must match token
- Updates `passwordChangedAt` timestamp

---

## 🔄 Complete Password Reset Workflow

```
1. User logs in
   └─→ Gets access token

2. User requests password reset
   └─→ POST /forget-password (with access token)
   └─→ Receives email with reset link

3. User clicks email link
   └─→ Contains reset token and user ID

4. User enters new password
   └─→ POST /reset-password (with reset token)
   └─→ Password is changed

5. User logs in with new password
   └─→ POST /login (with email and new password)
   └─→ Gets new access and refresh tokens
```

---

## 🧪 Quick Testing Guide

### Prerequisites
- Postman installed
- Backend server running on `http://localhost:3000`
- Valid email service configured (.env)
- Cloudinary credentials configured (.env)

### Test Scenario 1: Register and Reset Password

1. **Register User**
   - `POST /api/auth/register`
   - Upload profile picture
   - Get access token
   - See [REGISTER.md](./REGISTER.md)

2. **Request Password Reset**
   - `POST /api/auth/forget-password`
   - Use access token from step 1
   - Check email for reset link
   - See [FORGET_PASSWORD.md](./FORGET_PASSWORD.md)

3. **Reset Password**
   - Extract reset token from email
   - `POST /api/auth/reset-password`
   - Use reset token in Authorization header
   - See [RESET_PASSWORD.md](./RESET_PASSWORD.md)

4. **Verify New Password**
   - `POST /api/auth/login`
   - Use new password
   - Should succeed

---

## 🔐 Authentication Headers

### Access Token (from login/register)
```
Authorization: Bearer {accessToken}
```
**Used for:** Protected routes, forget-password

### Reset Token (from email)
```
Authorization: Bearer {resetToken}
```
**Used for:** Reset password endpoint

### Refresh Token
```
Stored in httpOnly cookie
```
**Used for:** Getting new access token when expired

---

## 📋 Request/Response Format

### Content-Type
- **Register:** `multipart/form-data` (file upload)
- **Login:** `application/json`
- **Forget Password:** `application/json`
- **Reset Password:** `application/json`

### Success Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Error description"
}
```

---

## ⚙️ Environment Variables

Required in `.env` file:

```bash
# JWT
JWT_ACCESS_SECRET=your_secret_key
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your_secret_key
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Password Reset
RESET_PASS_UI_LINK=http://localhost:3000/reset-password

# Bcrypt
BCRYPT_SALT_ROUNDS=10
```

---

## 🔑 Token Details

### Access Token
- **Expiration:** 1 hour (configurable)
- **Used for:** Authenticated API requests
- **Payload:** userId, name, email, role, photo
- **Storage:** Returned in response, set in httpOnly cookie

### Refresh Token
- **Expiration:** 7 days (configurable)
- **Used for:** Getting new access token
- **Payload:** Same as access token
- **Storage:** httpOnly cookie only

### Reset Token
- **Expiration:** 10 minutes
- **Used for:** Password reset only
- **Payload:** userId, name, email, role, photo
- **Storage:** Sent via email, client sends back in header

---

## 🚀 API Endpoints Summary

| Method | Endpoint | Auth | File | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/register` | ❌ | ✅ | Register with image upload |
| POST | `/auth/login` | ❌ | ❌ | Login with email & password |
| POST | `/auth/refresh-token` | ❌ | ❌ | Get new access token |
| POST | `/auth/forget-password` | ✅ | ❌ | Request password reset |
| POST | `/auth/reset-password` | ✅ | ❌ | Reset password with token |

---

## 🛡️ Security Features

✅ **Password Security**
- Hashed with bcrypt (10 salt rounds)
- Salted and unique per user
- Never stored in plain text

✅ **Token Security**
- JWT signed with secret key
- httpOnly cookies prevent XSS
- Tokens have expiration times
- Token validation on every request

✅ **Image Upload Security**
- File uploaded to Cloudinary (not stored locally)
- File automatically deleted after upload
- Validated file types (JPG, PNG, GIF, WebP)
- Max file size: 10MB

✅ **Email Security**
- Reset links expire in 10 minutes
- Token required for password reset
- User ID validation prevents token reuse

---

## 📞 Support

For issues or questions:
1. Check the specific API documentation file
2. Review "Error Scenarios" section
3. Check "Troubleshooting" section
4. Verify environment variables are set correctly

---

## 📝 Version History

- **v1.0** - Initial documentation
- Covers: Register, Forget Password, Reset Password
- Image upload to Cloudinary
- OAuth support (Google/GitHub)

