# Login API Documentation

## Overview
The `/login` endpoint authenticates a user with email and password. It returns access and refresh tokens that can be used for subsequent authenticated requests.

---

## Endpoint Details

### Route
```
POST /api/v1/auths/login
```

### Authentication
```
Not required - Public endpoint
```

### Content-Type
```
application/json
```

---

## Request

### Headers
```
Content-Type: application/json
```

### Body

```json
{
  "email": "user@example.com",
  "password": "YourPassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | String | Yes | User's email address |
| `password` | String | Yes | User's password |

---

## Success Response (200)

```json
{
  "statusCode": 200,
  "success": true,
  "message": "User is logged in successfully!",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZlM2MzMTNkMWFkNzUzMTlkODQwMjIiLCJuYW1lIjoiSmFuIERvZSIsImVtYWlsIjoiamFuQGV4YW1wbGUuY29tIiwicm9sZSI6IlVTRVIiLCJwaG90byI6Imh0dHBzOi8vcmVzLmNsb3VkaW5hcnkuY29tLy4uLiIsImlhdCI6MTc3ODI2OTI0MSwiZXhwIjoxNzc4MjcyODQxfQ.signature",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZlM2MzMTNkMWFkNzUzMTlkODQwMjIiLCJuYW1lIjoiSmFuIERvZSIsImVtYWlsIjoiamFuQGV4YW1wbGUuY29tIiwicm9sZSI6IlVTRVIiLCJwaG90byI6Imh0dHBzOi8vcmVzLmNsb3VkaW5hcnkuY29tLy4uLiIsImlhdCI6MTc3ODI2OTI0MSwiZXhwIjoxNzc4NDgyNDQxfQ.signature"
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
| `data.accessToken` | String | JWT token for authenticated requests (expires in 5 days) |
| `data.refreshToken` | String | JWT token to refresh access token (expires in 30 days) |

---

## Error Responses

### 404 Not Found - User Doesn't Exist
```json
{
  "statusCode": 404,
  "success": false,
  "message": "Password Incorrect!",
  "errorSources": [
    {
      "path": "",
      "message": "Password Incorrect!"
    }
  ],
  "err": {
    "statusCode": 404
  }
}
```

### 404 Not Found - Wrong Password
```json
{
  "statusCode": 404,
  "success": false,
  "message": "Password Incorrect!",
  "errorSources": [
    {
      "path": "",
      "message": "Password Incorrect!"
    }
  ],
  "err": {
    "statusCode": 404
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
      "path": "email",
      "message": "User Email is required."
    }
  ],
  "err": {
    "statusCode": 400
  }
}
```

---

## Testing in Postman

### Step 1: Create Request
1. Create a new `POST` request
2. URL: `http://localhost:3000/api/v1/auths/login`
3. Body type: Select `raw` → `JSON`

### Step 2: Enter Body
```json
{
  "email": "shakil88882@gmail.com",
  "password": "YourPassword123"
}
```

### Step 3: Send Request
Click **Send** button

### Step 4: Copy Access Token
From response, copy the `accessToken` value

### Step 5: Save to Postman Variable
Click on the eye icon next to your request name
- Set: `accessToken` = (paste the token from response)
- Now use `{{accessToken}}` in other authenticated requests

---

## cURL Example

```bash
curl -X POST http://localhost:3000/api/v1/auths/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "YourPassword123"
  }' \
  -c cookies.txt
```

---

## JavaScript/Fetch Example

```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auths/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Login successful');
      console.log('Access Token:', data.data.accessToken);
      console.log('Refresh Token:', data.data.refreshToken);
      
      // Save tokens to localStorage (optional)
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      console.error('❌ Login failed:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage
login('user@example.com', 'YourPassword123');
```

---

## Axios Example

```javascript
import axios from 'axios';

const login = async (email, password) => {
  try {
    const response = await axios.post('/api/v1/auths/login', {
      email,
      password,
    }, {
      withCredentials: true, // Include cookies
    });

    if (response.data.success) {
      console.log('✅ Login successful');
      const { accessToken, refreshToken } = response.data.data;
      
      // Save tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      return response.data.data;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message);
    throw error;
  }
};

// Usage
try {
  const tokens = await login('user@example.com', 'YourPassword123');
} catch (error) {
  // Handle error
}
```

---

## TypeScript Example

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await fetch('/api/v1/auths/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
};

// Usage
try {
  const result = await login('user@example.com', 'password123');
  console.log('Tokens:', result.data);
} catch (error) {
  console.error('Login error:', error);
}
```

---

## React Component Example

```jsx
import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/auths/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Save tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        
        // Redirect
        window.location.href = '/dashboard';
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## Token Usage

### Using Access Token for Authenticated Requests

```javascript
const getProtectedData = async (accessToken) => {
  const response = await fetch('/api/v1/users/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
};

// Usage
const token = localStorage.getItem('accessToken');
getProtectedData(token);
```

---

## Token Expiration & Refresh

### Access Token
- **Expires in:** 5 days
- **Used for:** Authenticated API requests
- **Header:** `Authorization: Bearer {accessToken}`

### Refresh Token
- **Expires in:** 30 days
- **Used for:** Getting new access token
- **Stored in:** httpOnly cookie (automatic)

### When Token Expires
If you get a 401 error:
```javascript
const response = await fetch('/api/v1/auths/refresh-token', {
  method: 'POST',
  credentials: 'include', // Includes refresh token cookie
});

const data = await response.json();
const newAccessToken = data.data.accessToken;
localStorage.setItem('accessToken', newAccessToken);
```

---

## Security Notes

### Password Storage
- Passwords are hashed using bcrypt with 10 salt rounds
- Never stored in plain text
- Never returned in any response

### Token Security
- Access tokens are signed with JWT secret
- httpOnly cookies prevent JavaScript access to refresh token
- Secure flag ensures transmission over HTTPS only
- SameSite=Strict prevents CSRF attacks

### Best Practices
1. Always use HTTPS in production
2. Store access token in memory (not localStorage for sensitive apps)
3. Store refresh token in httpOnly cookie (automatic)
4. Never log tokens
5. Clear tokens on logout

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Password Incorrect!" | Wrong password or user not found | Check email and password |
| "User Email is required." | Missing email field | Include email in request body |
| Login works but requests fail with 401 | Token expired | Get new token via refresh endpoint |
| Cookie not persisting | credentials not included | Use `credentials: 'include'` in fetch |
| CORS error | Cross-origin request issue | Configure CORS on backend |

---

## Complete Flow Example

```javascript
async function completeAuthFlow() {
  try {
    // Step 1: Login
    const loginResponse = await fetch('/api/v1/auths/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123',
      }),
    });

    const loginData = await loginResponse.json();
    const accessToken = loginData.data.accessToken;

    // Step 2: Use access token for authenticated request
    const profileResponse = await fetch('/api/v1/users/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const profileData = await profileResponse.json();
    console.log('User profile:', profileData);

    // Step 3: When access token expires, refresh it
    const refreshResponse = await fetch('/api/v1/auths/refresh-token', {
      method: 'POST',
      credentials: 'include',
    });

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.data.accessToken;

    // Step 4: Use new token for next request
    // ... continue with new token

  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Login successful |
| 400 | Bad Request | Missing or invalid fields |
| 404 | Not Found | User not found or wrong password |
| 500 | Server Error | Unexpected server error |

---

**Last Updated:** 2026-05-09
**API Version:** 1.0
**Status:** ✅ Production Ready
