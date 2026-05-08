# Forget Password API Documentation

## Overview
The `/forget-password` endpoint allows users to request a password reset. It sends a reset link to the user's email containing a token. The user can then use this token to set a new password.

---

## Endpoint Details

### Route
```
POST /api/v1/auths/forget-password
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
  "email": "user@example.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | String | Yes | User's email address |

---

## Success Response (200)

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Reset link is generated succesfully!",
  "data": null
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `statusCode` | Number | HTTP status code (200) |
| `success` | Boolean | Operation status (true) |
| `message` | String | Success message |
| `data` | null | No data returned (check email) |

---

## What Happens After Request

### Email Received
User receives an email with:
- Professional HTML formatted message
- Reset password button
- Backup reset link (copy-paste option)
- Security warning about token expiration
- Information about the 10-minute window

### Email Link Format
```
https://your-reset-password-url.com?id={userId}&token={resetToken}
```

### Reset Token Details
- **Valid for:** 10 minutes
- **Format:** JWT token
- **Contains:** userId, user info, expiration time
- **Can be used:** Once to reset password

---

## Error Responses

### 404 Not Found - User Doesn't Exist
```json
{
  "statusCode": 404,
  "success": false,
  "message": "This user is not found !",
  "errorSources": [
    {
      "path": "",
      "message": "This user is not found !"
    }
  ],
  "err": {
    "statusCode": 404
  }
}
```

### 403 Forbidden - User Blocked
```json
{
  "statusCode": 403,
  "success": false,
  "message": "This user is blocked ! !",
  "errorSources": [
    {
      "path": "",
      "message": "This user is blocked ! !"
    }
  ],
  "err": {
    "statusCode": 403
  }
}
```

### 400 Bad Request - Missing Email
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation failed",
  "errorSources": [
    {
      "path": "email",
      "message": "Email is required!"
    }
  ],
  "err": {
    "statusCode": 400
  }
}
```

### 400 Bad Request - Invalid Email
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation failed",
  "errorSources": [
    {
      "path": "email",
      "message": "Invalid email address!"
    }
  ],
  "err": {
    "statusCode": 400
  }
}
```

### 500 Server Error - Email Service Issue
```json
{
  "statusCode": 500,
  "success": false,
  "message": "Failed to send reset email",
  "errorSources": [
    {
      "path": "email",
      "message": "Failed to send reset email. Please try again."
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
2. URL: `http://localhost:3000/api/v1/auths/forget-password`
3. Body type: Select `raw` → `JSON`

### Step 2: Enter Body
```json
{
  "email": "shakil88882@gmail.com"
}
```

### Step 3: Send Request
Click **Send** button

### Step 4: Check Email
1. Open your email inbox
2. Look for reset password email from system
3. Email should arrive within 1-2 seconds
4. Click the reset button in email or copy the link

### Step 5: Extract Reset Token
From email link: `https://yoursite.com/reset?id=USER_ID&token=RESET_TOKEN`

The token is the `RESET_TOKEN` value

---

## cURL Example

```bash
curl -X POST http://localhost:3000/api/v1/auths/forget-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

## JavaScript/Fetch Example

```javascript
const requestPasswordReset = async (email) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auths/forget-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Reset link sent to your email');
      console.log('Check your inbox for reset instructions');
      
      // Show message to user
      alert('Password reset link has been sent to your email. Please check your inbox (and spam folder).');
      
      // Optionally redirect to a "check email" page
      window.location.href = '/check-email';
    } else {
      console.error('❌ Failed:', data.message);
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
};

// Usage
const userEmail = document.getElementById('emailInput').value;
requestPasswordReset(userEmail);
```

---

## Axios Example

```javascript
import axios from 'axios';

const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post('/api/v1/auths/forget-password', {
      email,
    });

    if (response.data.success) {
      console.log('✅ Reset email sent');
      return response.data;
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message);
    throw error;
  }
};

// Usage
try {
  await requestPasswordReset('user@example.com');
  console.log('Check your email for reset instructions');
} catch (error) {
  // Handle error
}
```

---

## TypeScript Example

```typescript
interface ForgetPasswordRequest {
  email: string;
}

interface ForgetPasswordResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: null;
}

const requestPasswordReset = async (
  email: string
): Promise<ForgetPasswordResponse> => {
  const response = await fetch('/api/v1/auths/forget-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to request password reset');
  }

  return response.json();
};

// Usage
try {
  const result = await requestPasswordReset('user@example.com');
  if (result.success) {
    console.log('✅ Reset link sent');
  }
} catch (error) {
  console.error('Error:', error);
}
```

---

## React Component Example

```jsx
import { useState } from 'react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/v1/auths/forget-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Reset link sent to your email! Check your inbox.');
        setEmail('');
      } else {
        setError(`❌ ${data.message}`);
      }
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Reset Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}
```

---

## Complete Flow Example

```javascript
async function completePasswordResetFlow(email) {
  try {
    // Step 1: Request password reset
    console.log('📧 Requesting password reset...');
    const response = await fetch('/api/v1/auths/forget-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    console.log('✅ Reset email sent!');

    // Step 2: User should check email and get token
    // (This would normally involve user interaction)
    // const resetToken = await getUserResetTokenFromEmail();

    // Step 3: User navigates to reset password page with token
    // Step 4: User submits new password (see RESET_PASSWORD.md)

    return {
      success: true,
      message: 'Reset email sent. Check your inbox.',
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}
```

---

## Email Content

When user requests password reset, they receive an email with:

```
Subject: Reset your password within 10 minutes!

---

Hello John,

You requested a password reset. Click the button below to reset your password. 
This link will expire in 10 minutes.

[Reset Password Button]

Or copy and paste this link in your browser:
https://your-site.com/reset-password?id=USER_ID&token=RESET_TOKEN

If you didn't request this password reset, please ignore this email.
For security, never share this link with anyone.

© RestOS. All rights reserved.
```

---

## Security Notes

### Token Expiration
- Reset tokens expire after 10 minutes
- User must complete reset within 10 minutes
- After expiration, must request new reset link
- Expired tokens will be rejected with 401 error

### User Verification
- User must exist in database
- User must not be blocked
- Email must match database record

### Email Delivery
- Emails sent via Gmail SMTP
- Uses secure HTTPS connections
- May take 1-2 seconds to arrive
- Check spam folder if not found

### Token Security
- Token is signed with JWT secret
- Token contains user information
- Token cannot be modified (signed)
- Token is one-time use

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "This user is not found !" | Email doesn't exist in database | Register account first |
| "Email is required!" | Missing email field | Include email in request body |
| "Invalid email address!" | Invalid email format | Check email format (user@domain.com) |
| "This user is blocked !" | User account is blocked | Contact administrator |
| Email not received | SMTP configuration issue | Check .env email credentials |
| Email takes too long | Email service delay | Wait 1-2 minutes or check spam |
| Reset link expired | More than 10 minutes passed | Request new reset link |
| "Failed to send reset email" | Email service down | Try again in a few moments |

---

## Integration Checklist

- [ ] Create forgot password form with email input
- [ ] Handle form submission
- [ ] Call /forget-password endpoint
- [ ] Show success message to user
- [ ] Redirect to "Check Email" page
- [ ] User checks email for reset link
- [ ] Extract token from email link
- [ ] Call /reset-password endpoint (see RESET_PASSWORD.md)
- [ ] Show password reset success
- [ ] Redirect to login page

---

## Best Practices

1. **User Experience**
   - Show clear message after sending link
   - Suggest checking spam folder
   - Link to resend if needed
   - Auto-fill email on return

2. **Security**
   - Use HTTPS only
   - Validate email format
   - Limit request frequency (optional)
   - Log reset attempts

3. **Email**
   - Clear, professional format
   - Direct call-to-action button
   - Expiration time clearly stated
   - Support contact info

---

## Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Reset link sent successfully |
| 400 | Bad Request | Invalid email or missing fields |
| 403 | Forbidden | User is blocked |
| 404 | Not Found | User doesn't exist |
| 500 | Server Error | Email service failure |

---

**Last Updated:** 2026-05-09
**API Version:** 1.0
**Status:** ✅ Production Ready
