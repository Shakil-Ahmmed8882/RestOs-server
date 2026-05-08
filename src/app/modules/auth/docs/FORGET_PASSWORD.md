# Forget Password API Documentation

## Overview
The `/forget-password` endpoint is used when a logged-in user wants to reset their password. It generates a reset token with a 10-minute expiration and sends a reset link via email.

---

## Endpoint Details

### Route
```
POST /api/auth/forget-password
```

### Authentication
```
Required - User must be logged in
```

### Headers Required
```
Authorization: Bearer {accessToken}
```

### Content-Type
```
application/json
```

---

## Request Body

The request body should be **empty** (just an empty JSON object or no body at all):

```json
{}
```

---

## How It Works

1. **User is authenticated** - The `auth()` middleware validates the access token
2. **User ID extracted** - From the authenticated request (decoded from token)
3. **User verified** - Checks if user exists in database
4. **Status checked** - Ensures user is not blocked
5. **Reset token generated** - JWT token valid for 10 minutes
6. **Reset link created** - Contains user ID and reset token
7. **Email sent** - Reset link emailed to user's registered email
8. **Response returned** - Confirmation to frontend

---

## Success Response (200)

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Reset link is generated successfully!",
  "data": null
}
```

---

## Testing in Postman

### Step 1: Login First
1. Create a `POST` request to `/api/auth/login`
2. Provide email and password:
```json
{
  "email": "user@example.com",
  "password": "YourPassword123"
}
```
3. Copy the `accessToken` from response

### Step 2: Call Forget Password
1. Create a new `POST` request
2. URL: `http://localhost:3000/api/auth/forget-password`
3. Go to **Headers** tab
4. Add header:
   - Key: `Authorization`
   - Value: `Bearer {accessToken}` (paste the token you copied)

5. Go to **Body** tab
6. Select **raw** → **JSON**
7. Send empty JSON or no body:
```json
{}
```

### Step 3: Check Email
- User receives reset link at their registered email
- Link format: `{reset_ui_link}?id={userId}&token={resetToken}`
- Reset token is valid for 10 minutes only

---

## Error Scenarios

### ❌ Missing Authorization Header
**Status:** 401 Unauthorized
```json
{
  "statusCode": 401,
  "success": false,
  "message": "You are not authorized!"
}
```

**Solution:** 
- Add `Authorization` header with valid access token
- Token must be from a logged-in user

---

### ❌ Invalid or Expired Token
**Status:** 401 Unauthorized
```json
{
  "statusCode": 401,
  "success": false,
  "message": "You are not authorized!"
}
```

**Solution:**
- Get a fresh access token by logging in again
- Use the new token in the Authorization header

---

### ❌ User Not Found
**Status:** 404 Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "message": "This user is not found!"
}
```

**Solution:**
- This should not happen if you're logged in
- Indicates the user was deleted from database
- Try logging in again

---

### ❌ User is Blocked
**Status:** 403 Forbidden
```json
{
  "statusCode": 403,
  "success": false,
  "message": "This user is blocked!"
}
```

**Solution:**
- Contact administrator to unblock account
- Cannot reset password while account is blocked

---

### ❌ Email Service Failure
**Status:** 500 Internal Server Error
```json
{
  "statusCode": 500,
  "success": false,
  "message": "Failed to send reset email"
}
```

**Solution:**
- Check email service configuration
- Verify SMTP credentials in `.env` file
- Check network connectivity

---

## Complete Postman Testing Flow

### Collection Setup

**Environment Variables:**
```
BASE_URL: http://localhost:3000/api
EMAIL: test@example.com
PASSWORD: TestPass123
```

### Request 1: Register User (if not already registered)
```
POST {{BASE_URL}}/auth/register
Body (form-data):
- name: Test User
- email: {{EMAIL}}
- password: {{PASSWORD}}
```

Save the access token to variable: `accessToken`

### Request 2: Login (if already registered)
```
POST {{BASE_URL}}/auth/login
Body (raw JSON):
{
  "email": "{{EMAIL}}",
  "password": "{{PASSWORD}}"
}
```

In response, copy `accessToken` and set it as environment variable: `accessToken`

### Request 3: Forget Password
```
POST {{BASE_URL}}/auth/forget-password
Headers:
  Authorization: Bearer {{accessToken}}
Body: (empty or {})
```

### Expected Response:
```
Status: 200
Message: "Reset link is generated successfully!"
```

### Next Steps:
- Check email for reset link
- Use the reset link to call `/reset-password` endpoint
- Reset link contains: `id` (userId) and `token` (resetToken)

---

## Email Link Format

The user receives an email with a reset link:

```
https://yourfrontend.com/reset-password?id=USER_ID&token=RESET_TOKEN
```

Frontend should:
1. Extract `id` and `token` from URL
2. User enters new password
3. Frontend calls `/reset-password` endpoint with:
   - `userId`: from URL parameter
   - `newPassword`: from form input
   - Authorization header with reset `token`

---

## Important Notes

⚠️ **Token Expiration:**
- Reset token expires in 10 minutes
- User must use the reset link within 10 minutes
- After expiration, must call forget-password again

⚠️ **User Authentication:**
- Only authenticated users can request password reset
- User must have valid access token
- Access token must not be expired

⚠️ **Email Delivery:**
- Email is sent asynchronously
- Reset link is generated and logged on backend
- If email service fails, user can request again

⚠️ **Security:**
- Reset token is JWT signed
- Contains userId and other user info
- Verified on `/reset-password` endpoint
- Single-use recommendation (token should be invalidated after use)

---

## API Integration Example

### JavaScript/Fetch
```javascript
// After login, you have accessToken
const response = await fetch('http://localhost:3000/api/auth/forget-password', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});

const data = await response.json();
if (data.success) {
  console.log('Reset link sent to email');
  // Redirect user to check email
}
```

### TypeScript/Axios
```typescript
const response = await axios.post(
  'http://localhost:3000/api/auth/forget-password',
  {},
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

if (response.data.success) {
  // Show message: "Reset link sent to your email"
  // Redirect to email verification page
}
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No token or expired token | Login again to get fresh token |
| 404 User not found | User deleted or token corrupted | Try logging in again |
| 403 User blocked | Account is blocked by admin | Contact administrator |
| Email not received | Email service down | Retry forget-password |
| Reset link expires | Took too long to click link | Request password reset again |

