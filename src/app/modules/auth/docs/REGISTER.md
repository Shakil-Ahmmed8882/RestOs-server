# User Registration API Documentation

## Overview
The `/register` endpoint handles user registration with optional image upload to Cloudinary. After successful registration, the user is automatically logged in and receives access and refresh tokens.

---

## Endpoint Details

### Route
```
POST /api/auth/register
```

### Content-Type
```
multipart/form-data
```

---

## Request Body

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | User's full name |
| `email` | String | User's email (unique) |

### Optional Fields
| Field | Type | Description |
|-------|------|-------------|
| `password` | String | Password (required for manual signup, optional for OAuth) |
| `photo` | File | User's profile picture (JPG, PNG, GIF, WebP - max 10MB) |

---

## Scenarios

### 1️⃣ Manual Signup with Image Upload

**When to use:** User creates account manually and uploads a profile picture

**Postman Setup:**

1. Create a new `POST` request
2. URL: `http://localhost:3000/api/auth/register`
3. Go to **Body** tab
4. Select **form-data**
5. Add fields:

| Key | Type | Value |
|-----|------|-------|
| name | Text | John Doe |
| email | Text | john.doe@example.com |
| password | Text | SecurePassword123 |
| photo | File | [Select image from your computer] |

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -F "name=John Doe" \
  -F "email=john.doe@example.com" \
  -F "password=SecurePassword123" \
  -F "photo=@/path/to/image.jpg"
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "65f1a2b3c4d5e6f7g8h9i0j",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "photo": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/user-john.doe@example.com-1234567890.jpg"
    }
  }
}
```

**What happens:**
1. ✅ Image uploaded to Cloudinary
2. ✅ Cloudinary URL stored in database
3. ✅ User created with hashed password
4. ✅ Access & refresh tokens generated
5. ✅ Tokens set in httpOnly cookie (secure)
6. ✅ User is logged in automatically

---

### 2️⃣ Manual Signup without Image (Default Photo)

**When to use:** User doesn't want to upload a photo

**Postman Setup:**

Same as above, but **do NOT** add the `photo` field

| Key | Type | Value |
|-----|------|-------|
| name | Text | Jane Smith |
| email | Text | jane.smith@example.com |
| password | Text | AnotherPassword456 |

**Success Response (200):**
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
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "role": "user",
      "photo": "https://example.com/default-profile.jpg"
    }
  }
}
```

**What happens:**
- Image field is skipped
- Default profile photo URL is used
- Rest of the process is the same

---

### 3️⃣ OAuth Signup (Google/GitHub)

**When to use:** User signs up using Google or GitHub

**Postman Setup:**

| Key | Type | Value |
|-----|------|-------|
| name | Text | Alex Johnson |
| email | Text | alex.johnson@gmail.com |
| photo | File | [Optional - Google profile pic] |

**Note:** No password field needed for OAuth users

**Success Response (200):**
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
      "name": "Alex Johnson",
      "email": "alex.johnson@gmail.com",
      "role": "user",
      "photo": "https://res.cloudinary.com/... or https://lh3.googleusercontent.com/..."
    }
  }
}
```

**What happens:**
- Password is NOT required
- Image from OAuth provider is optional
- User created without password (password field is null)
- Can later add password if needed

---

## Error Scenarios

### ❌ Duplicate Email
**Status:** 400 Bad Request
```json
{
  "statusCode": 400,
  "success": false,
  "message": "User already exist using this same email."
}
```

**Solution:** Use a different email address

---

### ❌ Missing Required Field
**Status:** 400 Bad Request
```json
{
  "statusCode": 400,
  "success": false,
  "message": "name is required"
}
```

**Solution:** Ensure all required fields are provided in form-data

---

### ❌ Invalid Email Format
**Status:** 400 Bad Request
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Invalid email format"
}
```

**Solution:** Use a valid email address (format: user@example.com)

---

### ❌ Image Upload Failed
**Status:** 500 Internal Server Error
```json
{
  "statusCode": 500,
  "success": false,
  "message": "Image upload to Cloudinary failed"
}
```

**Solution:** 
- Check Cloudinary credentials in `.env` file
- Verify image file is valid (JPG, PNG, GIF, WebP)
- Check file size (max 10MB)

---

## How to Use Tokens After Registration

### Access Token
Use this token for API requests requiring authentication:

```bash
curl -H "Authorization: Bearer {accessToken}" \
  http://localhost:3000/api/protected-route
```

**Where to add in Postman:**
- Go to **Headers** tab
- Add header: `Authorization: Bearer {accessToken}`

### Refresh Token
- Automatically stored in httpOnly cookie
- Use `/api/auth/refresh-token` endpoint when access token expires

---

## Testing Checklist

- [ ] Register with image - verify Cloudinary URL in photo field
- [ ] Register without image - verify default photo is used
- [ ] Register with OAuth (no password) - verify user is created
- [ ] Verify tokens are returned in response
- [ ] Verify tokens are set in cookies (check Network tab)
- [ ] Try registering with duplicate email - should get error
- [ ] Try registering with invalid email - should get error
- [ ] Use access token for protected route - should work
- [ ] Verify user can login after registration
- [ ] Check database - user photo should have Cloudinary URL

---

## Important Notes

⚠️ **Image Upload:**
- Uploaded file is temporarily stored in `/uploads/` folder
- After Cloudinary upload, local file is automatically deleted
- Only Cloudinary URL is stored in database
- Image names: `user-{email}-{timestamp}`

⚠️ **Password Hashing:**
- Passwords are hashed using bcrypt (10 salt rounds)
- Passwords are NOT stored in plain text
- For OAuth users, password field is NULL

⚠️ **Tokens:**
- Access token expires in 1 hour (default)
- Refresh token expires in 7 days (default)
- Both tokens are set in httpOnly cookies (cannot be accessed by JavaScript)

---

## API Integration Example

### JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('email', 'john@example.com');
formData.append('password', 'SecurePassword123');
formData.append('photo', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log('Access Token:', data.data.accessToken);
console.log('User Photo:', data.data.user.photo);
```

### TypeScript/Axios
```typescript
const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('email', 'john@example.com');
formData.append('password', 'SecurePassword123');
formData.append('photo', file);

const { data } = await axios.post('/api/auth/register', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

const { accessToken, user } = data.data;
```

