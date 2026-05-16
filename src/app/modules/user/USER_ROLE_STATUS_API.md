# Admin API: Update User Role and Status

**Endpoint**: `PATCH /api/v1/users/:userId/role-status`

**Authentication**: Admin only ✓

**Purpose**: Allow admins to change a user's role (ADMIN ↔ USER) and/or status (ACTIVE ↔ BLOCKED).

---

## 📋 Request Format

### URL Parameter
```
:userId     → The ID of the user to update (MongoDB ObjectId string)
```

### Request Body (JSON)
```json
{
  "role": "ADMIN",      // OPTIONAL: "ADMIN" or "USER"
  "status": "BLOCKED"   // OPTIONAL: "ACTIVE" or "BLOCKED"
}
```

**Rules**:
- At least ONE of `role` or `status` must be provided (cannot send empty body).
- `role` values: `"ADMIN"` or `"USER"`
- `status` values: `"ACTIVE"` or `"BLOCKED"`
- Both fields are independent — change one, leave the other out, or change both.

---

## 💡 Examples

### Example 1: Make a user an admin
```javascript
const userId = "67a8b2c3d4e5f6g7h8i9j0k1";

fetch(`/api/v1/users/${userId}/role-status`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <ADMIN_TOKEN>",  // Admin token required
  },
  body: JSON.stringify({
    role: "ADMIN"
  }),
});
```

**Response** (Success):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User role and status updated successfully",
  "data": {
    "_id": "67a8b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN",           // ← Changed to ADMIN
    "status": "ACTIVE",
    "photo": "https://...",
    "photoPublicId": "users/...",
    // ... other fields
  }
}
```

---

### Example 2: Block a user
```javascript
const userId = "67a8b2c3d4e5f6g7h8i9j0k1";

fetch(`/api/v1/users/${userId}/role-status`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <ADMIN_TOKEN>",
  },
  body: JSON.stringify({
    status: "BLOCKED"
  }),
});
```

**Response** (Success):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User role and status updated successfully",
  "data": {
    "_id": "67a8b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",            // ← Unchanged
    "status": "BLOCKED",       // ← Changed to BLOCKED
    "photo": "https://...",
    "photoPublicId": "users/...",
    // ... other fields
  }
}
```

---

### Example 3: Promote a user to admin AND activate (change both)
```javascript
const userId = "67a8b2c3d4e5f6g7h8i9j0k1";

fetch(`/api/v1/users/${userId}/role-status`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <ADMIN_TOKEN>",
  },
  body: JSON.stringify({
    role: "ADMIN",
    status: "ACTIVE"
  }),
});
```

---

### Example 4: Demote an admin back to user
```javascript
const userId = "67a8b2c3d4e5f6g7h8i9j0k1";

fetch(`/api/v1/users/${userId}/role-status`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <ADMIN_TOKEN>",
  },
  body: JSON.stringify({
    role: "USER"
  }),
});
```

---

### Example 5: Unblock a user
```javascript
const userId = "67a8b2c3d4e5f6g7h8i9j0k1";

fetch(`/api/v1/users/${userId}/role-status`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <ADMIN_TOKEN>",
  },
  body: JSON.stringify({
    status: "ACTIVE"
  }),
});
```

---

## ✅ Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User role and status updated successfully",
  "data": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "ADMIN" or "USER",
    "status": "ACTIVE" or "BLOCKED",
    "photo": "secure_url",
    "photoPublicId": "public_id",
    // ... other user fields
  }
}
```

---

## ❌ Error Responses

### 1. Not Admin (Forbidden)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You do not have the necessary permissions to access this resource"
}
```
**Cause**: Only admins can access this endpoint. Non-admin token or missing token.

### 2. User Not Found (404)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found"
}
```
**Cause**: The `userId` in the URL doesn't match any user in the database.

### 3. Invalid Validation (400)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "At least one of 'role' or 'status' must be provided",
  "issues": [
    {
      "code": "custom",
      "message": "At least one of 'role' or 'status' must be provided",
      "path": ["body"]
    }
  ]
}
```
**Cause**: You sent an empty body `{}` or invalid values.

### 4. Invalid Role or Status (400)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "issues": [
    {
      "code": "invalid_enum_value",
      "message": "Invalid enum value. Expected 'ADMIN' | 'USER'",
      "path": ["body", "role"]
    }
  ]
}
```
**Cause**: `role` is not "ADMIN" or "USER", or `status` is not "ACTIVE" or "BLOCKED".

---

## 🔑 Authentication

This endpoint requires:
1. **Valid JWT token** in the `Authorization` header as a Bearer token.
2. Token must be for an **ADMIN** user.
3. Header format: `Authorization: Bearer <TOKEN>`

If you don't have an admin token:
- Login as admin user first via `/api/v1/auth/login`
- Copy the `accessToken` from the response
- Use that token in the `Authorization` header

---

## 🛠 Frontend Implementation Example

### Using Axios
```javascript
import axios from 'axios';

async function updateUserRoleAndStatus(userId, roleOrStatus) {
  try {
    const response = await axios.patch(
      `/api/v1/users/${userId}/role-status`,
      roleOrStatus,  // { role: "ADMIN" } or { status: "BLOCKED" } or both
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    console.log('User updated:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error updating user:', error.response?.data?.message);
    throw error;
  }
}

// Usage
updateUserRoleAndStatus('67a8b2c3d4e5f6g7h8i9j0k1', { role: 'ADMIN' });
updateUserRoleAndStatus('67a8b2c3d4e5f6g7h8i9j0k1', { status: 'BLOCKED' });
updateUserRoleAndStatus('67a8b2c3d4e5f6g7h8i9j0k1', { role: 'USER', status: 'ACTIVE' });
```

### Using React + fetch
```jsx
async function handlePromoteToAdmin(userId) {
  const response = await fetch(`/api/v1/users/${userId}/role-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ role: 'ADMIN' }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error.message);
    return;
  }

  const result = await response.json();
  console.log('User promoted:', result.data);
}
```

### React Component Example
```jsx
import { useState } from 'react';

export function AdminUserActions({ userId, adminToken }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRoleChange = async (newRole) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/users/${userId}/role-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`User role changed to ${newRole}`);
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/users/${userId}/role-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`User status changed to ${newStatus}`);
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleRoleChange('ADMIN')} disabled={loading}>
        Make Admin
      </button>
      <button onClick={() => handleRoleChange('USER')} disabled={loading}>
        Make User
      </button>
      <button onClick={() => handleStatusChange('BLOCKED')} disabled={loading}>
        Block User
      </button>
      <button onClick={() => handleStatusChange('ACTIVE')} disabled={loading}>
        Unblock User
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
```

---

## 🔒 Permission Summary

| Who can access? | Role + Status update |
|---|---|
| **Admin user** ✅ | Can change any user's role and status |
| **Regular user** ❌ | Cannot access this endpoint |
| **Unauthenticated** ❌ | Cannot access this endpoint |

---

## 📝 Notes

- **No restrictions within admin scope** — An admin can change any user (including other admins) to user or admin.
- **All or nothing** — You must provide at least one field, but you can update just role, just status, or both.
- **Flexible design** — Easy to extend in the future to add more fields (e.g., `isVerified`, `isEmailVerified`, etc.).
- **Immediate effect** — Changes take effect immediately in the database.
