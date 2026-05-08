# Reset Password API Documentation

## Overview
The `/reset-password` endpoint is used to actually reset the password. It requires the reset token received from the `/forget-password` endpoint and the new password. This endpoint should be called after the user clicks the reset link in the email.

---

## Endpoint Details

### Route
```
POST /api/auth/reset-password
```

### Authentication
```
Required - Reset token from email link
```

### Headers Required
```
Authorization: Bearer {resetToken}
```

### Content-Type
```
application/json
```

---

## Request Body

```json
{
  "userId": "65f1a2b3c4d5e6f7g8h9i0j",
  "newPassword": "NewSecurePassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | Yes | User ID from reset email link parameter |
| `newPassword` | String | Yes | New password to set |

---

## How It Works

1. **Token validated** - Reset token from Authorization header is verified
2. **Token decoded** - Extract userId from token payload
3. **User ID matched** - Verify userId from body matches userId in token
4. **User verified** - Check if user exists in database
5. **Status checked** - Ensure user is not blocked
6. **Password hashed** - New password is hashed using bcrypt
7. **Password updated** - New hashed password stored in database
8. **Timestamp updated** - `passwordChangedAt` field is set to current time
9. **Response returned** - Confirmation of successful reset

---

## Success Response (200)

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Password reset successfully!",
  "data": null
}
```

---

## Testing in Postman

### Step 1: Get Reset Token
1. Call `/forget-password` endpoint (see FORGET_PASSWORD.md)
2. Check your email for reset link
3. Extract the reset token from email link:
   ```
   https://yourfrontend.com/reset-password?id=USER_ID&token=RESET_TOKEN
   ```
4. Copy the `RESET_TOKEN` value

### Step 2: Call Reset Password
1. Create a new `POST` request
2. URL: `http://localhost:3000/api/auth/reset-password`

3. Go to **Headers** tab
4. Add header:
   - Key: `Authorization`
   - Value: `Bearer {RESET_TOKEN}` (paste the token from email)

5. Go to **Body** tab
6. Select **raw** → **JSON**
7. Enter:
```json
{
  "userId": "65f1a2b3c4d5e6f7g8h9i0j",
  "newPassword": "YourNewPassword123"
}
```

**Note:** The `userId` should be the same value from the email link parameter `id`

---

## Complete Testing Flow

### Quick Test Setup

1. **Prepare an account:**
   - Use an existing user or register a new one
   - Email: `test@example.com`
   - Password: `OldPassword123`

2. **Step 1: Login**
   ```
   POST /api/auth/login
   Body: {
     "email": "test@example.com",
     "password": "OldPassword123"
   }
   ```
   Response includes `accessToken`

3. **Step 2: Request Password Reset**
   ```
   POST /api/auth/forget-password
   Headers: Authorization: Bearer {accessToken}
   Body: {}
   ```
   Check email for reset link with token

4. **Step 3: Extract Token from Email**
   - Email contains: `https://frontend.com/reset?id=USER_ID&token=RESET_TOKEN_HERE`
   - Copy `RESET_TOKEN_HERE` and `USER_ID`

5. **Step 4: Reset Password**
   ```
   POST /api/auth/reset-password
   Headers: Authorization: Bearer {RESET_TOKEN_HERE}
   Body: {
     "userId": "USER_ID",
     "newPassword": "NewPassword456"
   }
   ```
   Response: `{ "success": true, "message": "Password reset successfully!" }`

6. **Step 5: Login with New Password**
   ```
   POST /api/auth/login
   Body: {
     "email": "test@example.com",
     "password": "NewPassword456"
   }
   ```
   Should succeed with new password

---

## Error Scenarios

### ❌ Missing Authorization Header
**Status:** 400 Bad Request
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Reset token is required!"
}
```

**Solution:**
- Add `Authorization` header with reset token from email
- Format: `Bearer {resetToken}`

---

### ❌ Invalid or Expired Reset Token
**Status:** 401 Unauthorized
```json
{
  "statusCode": 401,
  "success": false,
  "message": "You are not authorized!"
}
```

**Solution:**
- Reset token expires in 10 minutes
- Request a new password reset by calling `/forget-password` again
- Check email for new reset link

---

### ❌ User ID Mismatch
**Status:** 403 Forbidden
```json
{
  "statusCode": 403,
  "success": false,
  "message": "You are forbidden!"
}
```

**Solution:**
- Ensure `userId` in body matches the `id` parameter from email link
- The token is only valid for the user it was issued to
- Cannot use another user's reset token

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
- User may have been deleted from database
- Request new password reset link
- Register a new account if needed

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
- Cannot reset password while blocked

---

### ❌ Missing Required Fields
**Status:** 400 Bad Request
```json
{
  "statusCode": 400,
  "success": false,
  "message": "newPassword is required"
}
```

**Solution:**
- Ensure both `userId` and `newPassword` are provided
- Both fields are required in request body

---

## Postman Collection Example

Create a new Collection in Postman and add these requests:

### Environment Variables
```
BASE_URL: http://localhost:3000/api
TEST_EMAIL: test@example.com
TEST_PASSWORD: OldPassword123
NEW_PASSWORD: NewPassword456
```

### Request 1: Register User
```
POST {{BASE_URL}}/auth/register
Headers: Content-Type: application/json
Body (form-data):
- name: Test User
- email: {{TEST_EMAIL}}
- password: {{TEST_PASSWORD}}
```

### Request 2: Login
```
POST {{BASE_URL}}/auth/login
Headers: Content-Type: application/json
Body (raw JSON):
{
  "email": "{{TEST_EMAIL}}",
  "password": "{{TEST_PASSWORD}}"
}
```
Extract `accessToken` → save to `{{accessToken}}`

### Request 3: Forget Password
```
POST {{BASE_URL}}/auth/forget-password
Headers:
  Authorization: Bearer {{accessToken}}
  Content-Type: application/json
Body: {}
```
Check email, extract reset token and userId → save as `{{resetToken}}` and `{{userId}}`

### Request 4: Reset Password
```
POST {{BASE_URL}}/auth/reset-password
Headers:
  Authorization: Bearer {{resetToken}}
  Content-Type: application/json
Body (raw JSON):
{
  "userId": "{{userId}}",
  "newPassword": "{{NEW_PASSWORD}}"
}
```

### Request 5: Verify Password Changed
```
POST {{BASE_URL}}/auth/login
Headers: Content-Type: application/json
Body (raw JSON):
{
  "email": "{{TEST_EMAIL}}",
  "password": "{{NEW_PASSWORD}}"
}
```
Should succeed with new password

---

## Important Notes

⚠️ **Token Expiration:**
- Reset token expires in 10 minutes
- Token is single-use (recommended to invalidate after use)
- After expiration or use, token becomes invalid
- User must request new reset if needed

⚠️ **Password Requirements:**
- New password must be different from old password (best practice)
- Minimum length should be enforced (add validation if needed)
- Password is hashed using bcrypt (10 salt rounds)

⚠️ **Token Verification:**
- Reset token is verified against the user making the request
- `userId` in body must match `userId` in token
- Prevents unauthorized password changes

⚠️ **Timestamp:**
- `passwordChangedAt` field is updated to current time
- Can be used to force re-login after password change
- Useful for security audit trails

⚠️ **Security:**
- Reset token is short-lived (10 minutes)
- Token contains user information (userId, email, role)
- Token is signed with JWT secret key
- Never expose reset token in logs or client-side code

---

## Database Changes

After successful password reset:

**Before:**
```javascript
{
  _id: "65f1a2b3c4d5e6f7g8h9i0j",
  email: "test@example.com",
  password: "$2a$10$hashedOldPassword...",
  passwordChangedAt: null
}
```

**After:**
```javascript
{
  _id: "65f1a2b3c4d5e6f7g8h9i0j",
  email: "test@example.com",
  password: "$2a$10$hashedNewPassword...",
  passwordChangedAt: "2024-01-15T10:30:45.123Z"
}
```

---

## API Integration Example

### JavaScript/Fetch
```javascript
// From email link: ?id=USER_ID&token=RESET_TOKEN
const resetToken = new URLSearchParams(window.location.search).get('token');
const userId = new URLSearchParams(window.location.search).get('id');
const newPassword = 'NewSecurePassword123';

const response = await fetch('http://localhost:3000/api/auth/reset-password', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${resetToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId,
    newPassword
  })
});

const data = await response.json();
if (data.success) {
  console.log('Password reset successful!');
  // Redirect to login
}
```

### TypeScript/Axios
```typescript
const resetToken = router.query.token;
const userId = router.query.id;

const response = await axios.post(
  'http://localhost:3000/api/auth/reset-password',
  {
    userId,
    newPassword: formData.newPassword
  },
  {
    headers: {
      'Authorization': `Bearer ${resetToken}`
    }
  }
);

if (response.data.success) {
  router.push('/login');
}
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 400 Reset token required | No Authorization header | Add reset token in Authorization header |
| 401 Invalid token | Token expired or malformed | Request new password reset |
| 403 Forbidden | userId mismatch | Use same userId as in email link |
| 404 User not found | User deleted | Register new account |
| Token expires too fast | Default is 10 minutes | Can be increased in config |
| Cannot login after reset | Password not saved | Check database for updated password |

