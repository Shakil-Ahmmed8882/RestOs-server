# Testing User Registration with Image Upload in Postman

## Overview
The `/register` endpoint now handles image uploads to Cloudinary and automatically logs in the user with a token.

## Testing Scenarios

### 1. **Register with Image Upload (Manual Signup)**

**Endpoint:** `POST /api/auth/register`

**Setup:**
1. Open Postman and create a new POST request
2. Set URL to: `http://localhost:3000/api/auth/register`

**Headers:**
- Leave as default (Postman will set `Content-Type: multipart/form-data` automatically)

**Body:**
1. Select **form-data** tab
2. Add the following fields:

| Key | Type | Value |
|-----|------|-------|
| name | Text | John Doe |
| email | Text | john@example.com |
| password | Text | SecurePass123 |
| photo | File | Select an image file from your computer |

**Expected Response (201/200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "66a1234567890abcdef12345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "photo": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/user-john@example.com-1234567890.jpg"
    }
  }
}
```

---

### 2. **Register without Image (Using Default Photo)**

**Same endpoint & setup, but:**

**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| name | Text | Jane Smith |
| email | Text | jane@example.com |
| password | Text | SecurePass456 |

(Leave out the `photo` field entirely)

**Expected Response:**
- User is created with the `demoProfileUrl` (default photo)
- User gets logged in automatically with tokens

---

### 3. **OAuth Signup (Google/GitHub - No Password)**

**Endpoint:** `POST /api/auth/register`

**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| name | Text | Alex Google |
| email | Text | alex.google@gmail.com |
| photo | File | (Optional) Profile picture from Google |

(No `password` field - it's optional for OAuth users)

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "userId": "...",
      "name": "Alex Google",
      "email": "alex.google@gmail.com",
      "role": "user",
      "photo": "https://res.cloudinary.com/... or https://lh3.googleusercontent.com/..."
    }
  }
}
```

---

## Key Features Implemented

✅ **Image Upload to Cloudinary**
- Images are uploaded to Cloudinary and secure_url is saved
- File is automatically deleted from local server after upload
- Unique image names: `user-{email}-{timestamp}`

✅ **Automatic Login**
- User gets `accessToken` and `refreshToken` immediately after registration
- User can start using the app without logging in again
- Tokens are also set in httpOnly cookies (secure)

✅ **OAuth Support**
- Password is optional
- Works with Google/GitHub profile images
- If no photo provided, defaults to `demoProfileUrl`

✅ **Database Validation**
- Prevents duplicate email registration
- All required fields are validated before upload

---

## How to Use Tokens

### 1. **Access Token**
Use in subsequent requests:
```
Authorization: Bearer {accessToken}
```

### 2. **Refresh Token**
- Automatically set in httpOnly cookie
- Use `/api/auth/refresh-token` endpoint to get a new access token when it expires

---

## Troubleshooting

### Issue: File not found / 400 error
- **Solution:** Make sure you're using form-data, not raw JSON
- Check that photo field type is set to "File", not "Text"

### Issue: Cloudinary upload fails
- **Solution:** Verify Cloudinary credentials in your `.env` file:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### Issue: User already exists error
- **Solution:** Use a unique email address or delete the previous user from database

### Issue: Photo URL shows demoProfileUrl instead of uploaded image
- **Solution:** 
  - Check that file is properly selected
  - Verify Cloudinary credentials are correct
  - Check Cloudinary upload folder in dashboard

---

## Testing Checklist

- [ ] Register with image upload - verify Cloudinary URL in response
- [ ] Register without image - verify default photo URL is used
- [ ] Register with OAuth (no password) - verify user is created
- [ ] Verify tokens are returned and user is logged in
- [ ] Try registering duplicate email - should get error
- [ ] Login with the newly registered user using `/login` endpoint
- [ ] Use access token in Authorization header for protected routes
- [ ] Verify refresh token works by calling `/refresh-token` endpoint

