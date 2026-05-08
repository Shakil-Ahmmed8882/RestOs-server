# Sign Up (Register) API Documentation

## Overview
The `/register` endpoint allows users to create a new account. It supports three scenarios:
1. Manual signup with password and image
2. Manual signup with password without image
3. OAuth signup (Google/GitHub) without password

Users are automatically logged in after registration and receive access tokens.

---

## Endpoint Details

### Route
```
POST /api/v1/auths/register
```

### Authentication
```
Not required - Public endpoint
```

### Content-Type
```
multipart/form-data
```

---

## Request

### Headers
```
Content-Type: multipart/form-data
```

### Body

#### Scenario 1: Manual Signup WITH Image

```
name: John Doe
email: john@example.com
password: SecurePassword123
photo: [file]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | User's full name |
| `email` | String | Yes | User's email address (must be unique) |
| `password` | String | Yes | User's password (for manual signup) |
| `photo` | File | No | User's profile picture (JPG, PNG, GIF, WebP - max 10MB) |

#### Scenario 2: Manual Signup WITHOUT Image

```
name: Jane Doe
email: jane@example.com
password: SecurePassword456
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | User's full name |
| `email` | String | Yes | User's email address (must be unique) |
| `password` | String | Yes | User's password |

#### Scenario 3: OAuth Signup (Google/GitHub)

```
name: John Google
email: john.google@gmail.com
password: (skip - not provided)
photo: [file] (optional)
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | User's full name |
| `email` | String | Yes | User's email from OAuth provider |
| `password` | String | No | Not needed for OAuth users |
| `photo` | File | No | Optional profile picture |

---

## Success Response (200)

```json
{
  "statusCode": 200,
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZlM2MzMTNkMWFkNzUzMTlkODQwMjIiLCJuYW1lIjoiSmFuIERvZSIsImVtYWlsIjoiamFuZUBleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIiwicGhvdG8iOiJodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kbWczY3JpNi9pbWFnZS91cGxvYWQvdjE3NzgyNjkyMzIvdXNlci1qYW5lQGV4YW1wbGUuY29tLWNsb3VkaW5hcnktdXJsLnBuZyIsImlhdCI6MTc3ODI2OTI0MSwiZXhwIjoxNzc4MjcyODQxfQ.signature",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZlM2MzMTNkMWFkNzUzMTlkODQwMjIiLCJuYW1lIjoiSmFuIERvZSIsImVtYWlsIjoiamFuZUBleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIiwicGhvdG8iOiJodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kbWczY3JpNi9pbWFnZS91cGxvYWQvdjE3NzgyNjkyMzIvdXNlci1qYW5lQGV4YW1wbGUuY29tLWNsb3VkaW5hcnktdXJsLnBuZyIsImlhdCI6MTc3ODI2OTI0MSwiZXhwIjoxNzc4NDgyNDQxfQ.signature",
    "user": {
      "userId": "69fe3c313d1ad75319d84022",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "USER",
      "photo": "https://res.cloudinary.com/dmg3ltri6/image/upload/v1778269232/user-jane@example.com-cloudinary-url.png"
    }
  }
}
```

### Response Headers
```
Set-Cookie: refreshToken={refreshToken}; HttpOnly; Path=/; Secure; SameSite=Strict
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `statusCode` | Number | HTTP status code (200) |
| `success` | Boolean | Operation status (true) |
| `message` | String | Success message |
| `data.accessToken` | String | JWT token for authenticated requests |
| `data.refreshToken` | String | JWT token to refresh access token |
| `data.user.userId` | String | Unique user ID |
| `data.user.name` | String | User's name |
| `data.user.email` | String | User's email |
| `data.user.role` | String | User role (USER by default) |
| `data.user.photo` | String | User's photo URL (Cloudinary or default) |

---

## Error Responses

### 400 Bad Request - User Already Exists
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation failed",
  "errorSources": [
    {
      "path": "email",
      "message": "User already exist using this same email."
    }
  ],
  "err": {
    "statusCode": 400
  }
}
```

### 400 Bad Request - Missing Fields
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation failed",
  "errorSources": [
    {
      "path": "name",
      "message": "Name is required."
    },
    {
      "path": "email",
      "message": "Valid email is required."
    }
  ],
  "err": {
    "statusCode": 400
  }
}
```

### 400 Bad Request - Invalid Email Format
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation failed",
  "errorSources": [
    {
      "path": "email",
      "message": "Invalid email format"
    }
  ],
  "err": {
    "statusCode": 400
  }
}
```

### 500 Server Error - Image Upload Failed
```json
{
  "statusCode": 500,
  "success": false,
  "message": "Failed to upload image to Cloudinary",
  "errorSources": [
    {
      "path": "photo",
      "message": "Image upload failed. Please try again."
    }
  ],
  "err": {
    "statusCode": 500
  }
}
```

---

## Testing in Postman

### Step 1: Create Request
1. Create a new `POST` request
2. URL: `http://localhost:3000/api/v1/auths/register`
3. Body type: Select `form-data`

### Step 2: Add Form Fields

| Key | Type | Value |
|-----|------|-------|
| name | text | John Doe |
| email | text | john@example.com |
| password | text | SecurePassword123 |
| photo | file | [select your image file] |

### Step 3: Send Request
Click **Send** button

### Step 3: Copy Tokens
From response:
- Copy `accessToken` for authenticated requests
- `refreshToken` is automatically saved in httpOnly cookie

### Step 4: Verify User Created
- Check database for new user
- Verify photo URL in Cloudinary account
- Test login with new credentials

---

## cURL Example

### With Image Upload
```bash
curl -X POST http://localhost:3000/api/v1/auths/register \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "password=SecurePassword123" \
  -F "photo=@/path/to/image.jpg"
```

### Without Image
```bash
curl -X POST http://localhost:3000/api/v1/auths/register \
  -F "name=Jane Doe" \
  -F "email=jane@example.com" \
  -F "password=SecurePassword456"
```

### OAuth (No Password)
```bash
curl -X POST http://localhost:3000/api/v1/auths/register \
  -F "name=John Google" \
  -F "email=john.google@gmail.com"
```

---

## JavaScript/Fetch Example

### With Image Upload
```javascript
const registerWithImage = async (name, email, password, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('photo', imageFile);

    const response = await fetch('http://localhost:3000/api/v1/auths/register', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Registration successful');
      console.log('User:', data.data.user);
      console.log('Access Token:', data.data.accessToken);
      
      // Save tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      console.error('❌ Registration failed:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage
const fileInput = document.getElementById('photoInput');
registerWithImage(
  'John Doe',
  'john@example.com',
  'SecurePassword123',
  fileInput.files[0]
);
```

### Without Image
```javascript
const registerWithoutImage = async (name, email, password) => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);

    const response = await fetch('http://localhost:3000/api/v1/auths/register', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Registration successful');
      // User gets default photo if none provided
      console.log('Photo:', data.data.user.photo);
      
      // Save tokens and redirect
      localStorage.setItem('accessToken', data.data.accessToken);
      window.location.href = '/dashboard';
    } else {
      console.error('❌ Registration failed:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage
registerWithoutImage('Jane Doe', 'jane@example.com', 'SecurePassword456');
```

---

## Axios Example

### With Image Upload
```javascript
import axios from 'axios';

const registerWithImage = async (name, email, password, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('photo', imageFile);

    const response = await axios.post(
      '/api/v1/auths/register',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      }
    );

    if (response.data.success) {
      console.log('✅ Registration successful');
      const { accessToken, user } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      return user;
    }
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data?.message);
    throw error;
  }
};

// Usage
try {
  const user = await registerWithImage(
    'John Doe',
    'john@example.com',
    'password123',
    fileInput.files[0]
  );
  console.log('User:', user);
} catch (error) {
  // Handle error
}
```

---

## TypeScript Example

```typescript
interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
  photo?: File;
}

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  photo: string;
}

interface RegisterResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

const register = async (
  name: string,
  email: string,
  password: string,
  photo?: File
): Promise<RegisterResponse> => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('password', password);
  if (photo) {
    formData.append('photo', photo);
  }

  const response = await fetch('/api/v1/auths/register', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
};

// Usage
try {
  const result = await register(
    'John Doe',
    'john@example.com',
    'password123',
    photoFile
  );
  console.log('Registered user:', result.data.user);
} catch (error) {
  console.error('Registration error:', error);
}
```

---

## React Component Example

```jsx
import { useState } from 'react';

export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    photo: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      photo: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('email', formData.email);
      form.append('password', formData.password);
      if (formData.photo) {
        form.append('photo', formData.photo);
      }

      const response = await fetch('/api/v1/auths/register', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });

      const data = await response.json();

      if (data.success) {
        // Save tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Full Name"
        value={formData.name}
        onChange={handleInputChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleInputChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleInputChange}
        required
      />
      <input
        type="file"
        name="photo"
        accept="image/*"
        onChange={handleFileChange}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

---

## Image Upload Details

### Supported Formats
- JPG / JPEG
- PNG
- GIF
- WebP

### Size Limits
- Maximum file size: 10MB
- Recommended size: 2-5MB

### Storage
- Images uploaded to Cloudinary (secure cloud storage)
- Secure HTTPS URLs stored in database
- Local files automatically deleted after upload
- No local storage of images

### Default Photo
If no image provided:
- User gets default profile photo
- Default photo URL stored in database
- Can be changed later

---

## Security Notes

### Password Security
- Passwords must be at least 8 characters (recommended)
- Hashed using bcrypt with 10 salt rounds
- Never stored in plain text
- Never returned in any response

### OAuth Users
- Password is optional for OAuth signups
- Email must be unique (even for OAuth users)
- Account is immediately active

### Image Security
- File type validation (only images)
- File size validation (max 10MB)
- Uploaded to secure Cloudinary servers
- HTTPS URLs only

### Account Security
- Email verification recommended (optional feature)
- Account is active immediately after registration
- Users can login right after signup

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "User already exist using this same email" | Email already registered | Use different email or login |
| "Name is required" | Missing name field | Provide user's full name |
| "Valid email is required" | Invalid email format | Check email format (user@domain.com) |
| Image not uploading | File too large or invalid type | Use JPG/PNG under 10MB |
| "Failed to upload image" | Cloudinary connection issue | Check .env Cloudinary credentials |
| User created but no photo | No image provided | Photo set to default, update later |
| Can't login after signup | Token not saved | Check localStorage for token |

---

## Complete Registration Flow

```javascript
async function completeSignupFlow(name, email, password, photoFile) {
  try {
    // Step 1: Register user
    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    form.append('password', password);
    if (photoFile) form.append('photo', photoFile);

    const registerResponse = await fetch('/api/v1/auths/register', {
      method: 'POST',
      credentials: 'include',
      body: form,
    });

    const registerData = await registerResponse.json();

    if (!registerData.success) {
      throw new Error(registerData.message);
    }

    // Step 2: Save tokens
    const { accessToken, user } = registerData.data;
    localStorage.setItem('accessToken', accessToken);

    console.log('✅ User registered:', user);
    console.log('Photo URL:', user.photo);

    // Step 3: Ready to make authenticated requests
    return user;

  } catch (error) {
    console.error('Registration failed:', error.message);
    throw error;
  }
}
```

---

## Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Registration successful |
| 400 | Bad Request | Missing fields or user already exists |
| 500 | Server Error | Image upload or database error |

---

**Last Updated:** 2026-05-09
**API Version:** 1.0
**Status:** ✅ Production Ready
