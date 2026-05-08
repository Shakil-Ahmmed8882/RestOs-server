# API Reference Guide - All 4 Authentication Endpoints

Complete documentation for all authentication endpoints with request/response examples and integration code.

---

## 📋 Quick Navigation

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| [Login](#1-login-api) | POST | No | Authenticate user & get tokens |
| [Sign Up](#2-sign-up-register-api) | POST | No | Create new user account |
| [Forget Password](#3-forget-password-api) | POST | No | Request password reset |
| [Reset Password](#4-reset-password-api) | POST | No | Set new password with token |

---

## 1. Login API

**File:** `LOGIN.md`

### Endpoint
```
POST /api/v1/auths/login
```

### Quick Example
```javascript
// Request
const response = await fetch('/api/v1/auths/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

// Response
{
  "statusCode": 200,
  "success": true,
  "message": "User is logged in successfully!",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Headers
```
Content-Type: application/json
```

### Request Body
| Field | Type | Required |
|-------|------|----------|
| email | String | Yes |
| password | String | Yes |

### Responses
- ✅ **200** - Login successful
- ❌ **400** - Missing fields
- ❌ **404** - User not found or wrong password

### Use For
- User login
- Getting access tokens
- Session management
- Protected route access

📖 **Full Documentation:** See [LOGIN.md](./LOGIN.md)

---

## 2. Sign Up (Register) API

**File:** `SIGNUP.md`

### Endpoint
```
POST /api/v1/auths/register
```

### Quick Example
```javascript
// Request with image
const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('email', 'john@example.com');
formData.append('password', 'password123');
formData.append('photo', imageFile);

const response = await fetch('/api/v1/auths/register', {
  method: 'POST',
  credentials: 'include',
  body: formData
});

// Response
{
  "statusCode": 200,
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "userId": "65f1a2b3...",
      "name": "John Doe",
      "email": "john@example.com",
      "photo": "https://res.cloudinary.com/..."
    }
  }
}
```

### Headers
```
Content-Type: multipart/form-data
```

### Request Body
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | Yes | User's full name |
| email | String | Yes | Must be unique |
| password | String | No | Required for manual signup |
| photo | File | No | JPG/PNG/GIF/WebP, max 10MB |

### Scenarios

**Manual Signup with Password:**
- Include: name, email, password
- Optionally: photo

**OAuth Signup:**
- Include: name, email
- Omit: password
- Optionally: photo

### Responses
- ✅ **200** - Registration successful
- ❌ **400** - User exists or missing fields
- ❌ **500** - Image upload failed

### Use For
- User registration
- Account creation
- Profile image upload
- OAuth integration

📖 **Full Documentation:** See [SIGNUP.md](./SIGNUP.md)

---

## 3. Forget Password API

**File:** `FORGET_PASSWORD.md`

### Endpoint
```
POST /api/v1/auths/forget-password
```

### Quick Example
```javascript
// Request
const response = await fetch('/api/v1/auths/forget-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com'
  })
});

// Response
{
  "statusCode": 200,
  "success": true,
  "message": "Reset link is generated succesfully!",
  "data": null
}

// User receives email with reset link:
// https://your-site.com/reset?id=USER_ID&token=RESET_TOKEN
```

### Headers
```
Content-Type: application/json
```

### Request Body
| Field | Type | Required |
|-------|------|----------|
| email | String | Yes |

### What Happens
1. User requests password reset with email
2. System finds user and generates reset token (10-minute expiration)
3. Email sent with reset link containing token
4. User clicks link and is directed to password reset form
5. User submits new password (see Reset Password API)

### Responses
- ✅ **200** - Email sent successfully
- ❌ **400** - Invalid email format
- ❌ **404** - User not found
- ❌ **403** - User is blocked
- ❌ **500** - Email service error

### Use For
- Password recovery flow
- Forget password requests
- Email-based password reset
- Security verification

📖 **Full Documentation:** See [FORGET_PASSWORD.md](./FORGET_PASSWORD.md)

---

## 4. Reset Password API

**File:** `RESET_PASSWORD.md`

### Endpoint
```
POST /api/v1/auths/reset-password
```

### Quick Example
```javascript
// Request (with token from email)
const response = await fetch('/api/v1/auths/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'eyJhbGciOiJIUzI1NiIs...',  // From email link
    newPassword: 'NewPassword456'
  })
});

// Response
{
  "statusCode": 200,
  "success": true,
  "message": "Password reset successfully!",
  "data": null
}
```

### Headers
```
Content-Type: application/json
```

### Request Body
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| token | String | Yes | Reset token from email link |
| newPassword | String | Yes | New password to set |

### How It Works
1. Receive token and new password
2. Verify and decode token
3. Check token expiration (10-minute window)
4. Extract userId from token
5. Find user in database
6. Hash new password with bcrypt
7. Update password in database
8. Return success response

### Responses
- ✅ **200** - Password reset successfully
- ❌ **400** - Missing token or password
- ❌ **401** - Invalid or expired token
- ❌ **404** - User not found
- ❌ **403** - User is blocked

### Use For
- Password reset completion
- Changing forgotten passwords
- Security credential updates
- Account access recovery

📖 **Full Documentation:** See [RESET_PASSWORD.md](./RESET_PASSWORD.md)

---

## Complete Authentication Flow

### New User Registration & First Login

```
1. User fills signup form
   ↓
2. POST /api/v1/auths/register
   (name, email, password, photo)
   ↓
3. ✅ User created in database
   ✅ Photo uploaded to Cloudinary
   ✅ Tokens returned
   ✅ User auto-logged in
   ↓
4. User can access protected routes
   with accessToken
```

### Password Reset Flow

```
1. User clicks "Forgot Password"
   ↓
2. User enters email
   ↓
3. POST /api/v1/auths/forget-password
   (email)
   ↓
4. ✅ Reset email sent
   ✓ Token generated (10 min valid)
   ↓
5. User receives email
   User clicks reset link
   ↓
6. User enters new password
   ↓
7. POST /api/v1/auths/reset-password
   (token, newPassword)
   ↓
8. ✅ Password updated
   ✓ User can login with new password
```

### Protected Route Access

```
1. After login/signup
   User has: accessToken
   ↓
2. For any protected request:
   Header: Authorization: Bearer {accessToken}
   ↓
3. Server validates token
   ✅ Valid → Allow request
   ❌ Invalid → Return 401
   ❌ Expired → Return 401 (use refresh)
```

---

## Token Management

### Access Token
- **Obtained from:** Login, Register
- **Valid for:** 5 days
- **Used for:** Protected API requests
- **Header:** `Authorization: Bearer {accessToken}`
- **Storage:** localStorage (optional)

### Refresh Token
- **Obtained from:** Login, Register
- **Valid for:** 30 days
- **Used for:** Getting new access token
- **Storage:** httpOnly cookie (automatic)
- **Endpoint:** POST `/api/v1/auths/refresh-token`

### Reset Token
- **Obtained from:** Email after forget-password
- **Valid for:** 10 minutes
- **Used for:** Password reset only
- **Format:** JWT in email link
- **Endpoint:** POST `/api/v1/auths/reset-password`

---

## Error Handling

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request body fields |
| 401 | Unauthorized | Token invalid/expired, login again |
| 403 | Forbidden | User blocked, contact admin |
| 404 | Not Found | User doesn't exist |
| 500 | Server Error | Try again, contact support |

### Error Response Format
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Error message here",
  "errorSources": [
    {
      "path": "field_name",
      "message": "Specific error for this field"
    }
  ]
}
```

---

## Integration Checklist

### Frontend Setup
- [ ] Create login page/component
- [ ] Create signup page/component
- [ ] Create forgot password page/component
- [ ] Create reset password page/component
- [ ] Implement token storage (localStorage/cookie)
- [ ] Add Authorization header to requests
- [ ] Handle 401 errors (redirect to login)
- [ ] Implement token refresh logic

### API Integration
- [ ] POST /login with email & password
- [ ] POST /register with form-data
- [ ] POST /forget-password with email
- [ ] POST /reset-password with token & password
- [ ] POST /refresh-token when access token expires
- [ ] Add auth header to protected routes

### Security
- [ ] Use HTTPS only
- [ ] Store sensitive tokens securely
- [ ] Validate input before sending
- [ ] Handle CORS properly
- [ ] Set secure cookie flags
- [ ] Implement rate limiting (optional)

---

## Environment Configuration

Required `.env` variables:

```bash
# Server
NODE_ENV=development
PORT=3000

# JWT
JWT_ACCESS_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_secret_key
JWT_ACCESS_EXPIRES_IN=5d
JWT_REFRESH_EXPIRES_IN=30d

# Bcrypt
BCRYPT_SALT_ROUND=10

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Reset Password UI
RESET_PASS_UI_LINK=https://your-app.com/reset-password

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Common Code Examples

### React Login Hook
```javascript
const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/auths/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};
```

### Protected Route Wrapper
```javascript
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}
```

### API Request with Token
```javascript
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Usage
const response = await fetchWithAuth('/api/v1/users/profile');
```

---

## Testing Endpoints

### Using Postman
1. Create a new Postman collection
2. Add 4 requests (Login, Register, Forget, Reset)
3. Use variables for baseUrl and tokens
4. Test each endpoint in sequence

### Using cURL
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auths/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Register
curl -X POST http://localhost:3000/api/v1/auths/register \
  -F "name=John" \
  -F "email=john@example.com" \
  -F "password=pass123"

# Forget Password
curl -X POST http://localhost:3000/api/v1/auths/forget-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Reset Password
curl -X POST http://localhost:3000/api/v1/auths/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_HERE","newPassword":"newpass123"}'
```

---

## Support & Help

- **API Issues?** Check error responses and error code table
- **Integration Help?** See individual API documentation files
- **Code Examples?** Each API doc has Fetch, Axios, React, TypeScript examples
- **Security Questions?** See security notes in each API doc

---

## Quick Links

| File | Purpose |
|------|---------|
| [LOGIN.md](./LOGIN.md) | Complete login documentation |
| [SIGNUP.md](./SIGNUP.md) | Complete registration documentation |
| [FORGET_PASSWORD.md](./FORGET_PASSWORD.md) | Password reset request documentation |
| [RESET_PASSWORD.md](./RESET_PASSWORD.md) | Password reset completion documentation |
| [README.md](./README.md) | General auth module overview |

---

**Last Updated:** 2026-05-09
**API Version:** 1.0
**Status:** ✅ Production Ready

For detailed information on each endpoint, refer to individual API documentation files.
