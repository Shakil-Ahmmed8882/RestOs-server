# User API Documentation

## Overview
The User API provides endpoints for managing user profiles, including retrieving, updating, and deleting user accounts. All endpoints (except Create User) require authentication.

---

## Endpoints

### 1. Create User
Creates a new user account. This endpoint is public and does not require authentication.

**Endpoint:** `POST /api/users/create-user`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "photo": "https://example.com/photo.jpg",
  "bio": "Food enthusiast",
  "location": "New York",
  "contactNumber": "555-1234",
  "cuisinePreferences": ["Italian", "Asian"],
  "favoriteRestaurants": ["Restaurant A", "Restaurant B"],
  "dietaryRestrictions": ["Vegetarian"],
  "socialMedia": {
    "instagram": "johndoe",
    "facebook": "john.doe",
    "twitter": "johndoe"
  },
  "diningFrequency": "Frequently",
  "preferredMealTimes": ["Lunch", "Dinner"],
  "paymentMethods": ["Credit Card", "Digital Wallet"]
}
```

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "User is created successfully",
  "data": {
    "_id": "64d5f3a8b2c1d4e5f6g7h8i9",
    "name": "John Doe",
    "email": "john@example.com",
    "photo": "https://cloudinary.url/photo.jpg",
    "photoPublicId": "user-photo-id",
    "role": "user",
    "status": "active",
    "isDeleted": false
  }
}
```

---

### 2. Get All Users
Retrieves a paginated list of all users. Supports filtering, searching, and field selection.

**Endpoint:** `GET /api/users`

**Authentication:** Required (USER, ADMIN roles)

**Query Parameters:**
- `search` - Search by name, email, or contact number
- `fields` - Comma-separated fields to include
- `sort` - Sort field and order (e.g., `-createdAt`)
- `limit` - Number of results per page (default: 10)
- `page` - Page number (default: 1)

**Example Request:**
```
GET /api/users?search=john&limit=10&page=1
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "retrieved all users successfully",
  "data": {
    "result": [
      {
        "_id": "64d5f3a8b2c1d4e5f6g7h8i9",
        "name": "John Doe",
        "email": "john@example.com",
        "photo": "https://cloudinary.url/photo.jpg",
        "role": "user",
        "status": "active",
        "contactNumber": "555-1234"
      }
    ],
    "meta": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### 3. Get Single User
Retrieves a specific user's profile by their ID. Only the authenticated user can fetch their own profile, or an admin can fetch any user's profile.

**Endpoint:** `GET /api/users/:userId`

**Authentication:** Required (USER, ADMIN roles)

**URL Parameters:**
- `userId` - The ID of the user to retrieve

**Example Request:**
```
GET /api/users/64d5f3a8b2c1d4e5f6g7h8i9
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Retrieved single user successfully",
  "data": {
    "_id": "64d5f3a8b2c1d4e5f6g7h8i9",
    "name": "John Doe",
    "email": "john@example.com",
    "photo": "https://cloudinary.url/photo.jpg",
    "photoPublicId": "user-photo-id",
    "bio": "Food enthusiast",
    "location": "New York",
    "contactNumber": "555-1234",
    "cuisinePreferences": ["Italian", "Asian"],
    "favoriteRestaurants": ["Restaurant A", "Restaurant B"],
    "dietaryRestrictions": ["Vegetarian"],
    "socialMedia": {
      "instagram": "johndoe",
      "facebook": "john.doe",
      "twitter": "johndoe"
    },
    "diningFrequency": "Frequently",
    "preferredMealTimes": ["Lunch", "Dinner"],
    "paymentMethods": ["Credit Card", "Digital Wallet"],
    "role": "user",
    "status": "active",
    "isDeleted": false
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "success": false,
  "message": "Oops! User is not found!"
}
```

---

### 4. Update User
Updates a user's profile. Only the authenticated user can update their own profile. Supports photo upload to Cloudinary. If a new photo is uploaded, the previous photo is automatically deleted from Cloudinary.

**Endpoint:** `PATCH /api/users/:userId`

**Authentication:** Required (USER role only - users can only update their own profile)

**URL Parameters:**
- `userId` - The ID of the user to update

**Request Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body (Form Data):**
```
Field: photo
Type: File (optional)
Accepted formats: image/jpeg, image/png, image/gif, image/webp
Max size: 10MB

Field: name
Type: String (optional)

Field: bio
Type: String (optional)

Field: location
Type: String (optional)

Field: contactNumber
Type: String (optional)

Field: cuisinePreferences
Type: Array of Strings (optional)

Field: favoriteRestaurants
Type: Array of Strings (optional)

Field: dietaryRestrictions
Type: Array of Strings (optional)

Field: diningFrequency
Type: String - Options: "Occasionally", "Frequently", "Rarely" (optional)

Field: preferredMealTimes
Type: Array of Strings - Options: ["Breakfast", "Lunch", "Dinner"] (optional)

Field: paymentMethods
Type: Array of Strings - Options: ["Cash", "Credit Card", "Digital Wallet"] (optional)

Field: socialMedia
Type: JSON Object (optional)
Example: {"instagram": "johndoe", "facebook": "john.doe", "twitter": "johndoe"}
```

**Example Request (cURL):**
```bash
curl -X PATCH http://localhost:5000/api/users/64d5f3a8b2c1d4e5f6g7h8i9 \
  -H "Authorization: Bearer <token>" \
  -F "photo=@/path/to/photo.jpg" \
  -F "name=John Updated" \
  -F "bio=Updated bio" \
  -F "location=Los Angeles"
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Update user data successfully",
  "data": {
    "_id": "64d5f3a8b2c1d4e5f6g7h8i9",
    "name": "John Updated",
    "email": "john@example.com",
    "photo": "https://cloudinary.url/new-photo.jpg",
    "photoPublicId": "user-64d5f3a8-newphoto",
    "bio": "Updated bio",
    "location": "Los Angeles",
    "contactNumber": "555-1234",
    "role": "user",
    "status": "active",
    "isDeleted": false
  }
}
```

**Notes:**
- Photo upload is optional - you can update other fields without uploading a new photo
- If a new photo is uploaded, the old photo is automatically deleted from Cloudinary
- Photo update is handled atomically with other updates using database transactions
- All array and object fields are completely replaced (not merged) on update

---

### 5. Delete User
Soft deletes a user account. Only the authenticated user can delete their own account. The user record is not removed from the database but marked as deleted.

**Endpoint:** `DELETE /api/users/:userId`

**Authentication:** Required (USER role only - users can only delete their own account)

**URL Parameters:**
- `userId` - The ID of the user to delete

**Example Request:**
```
DELETE /api/users/64d5f3a8b2c1d4e5f6g7h8i9
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "delete user data successfully",
  "data": {
    "_id": "64d5f3a8b2c1d4e5f6g7h8i9",
    "name": "John Doe",
    "email": "john@example.com",
    "isDeleted": true
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "success": false,
  "message": "User not found"
}
```

**Notes:**
- This is a soft delete - the user record remains in the database with `isDeleted: true`
- Deleted user accounts cannot be used for login
- Admin users can review deleted accounts for audit purposes
- User photos are NOT automatically deleted from Cloudinary on account deletion

---

## Authentication

All endpoints except "Create User" require a valid JWT token in the Authorization header.

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

---

## Error Handling

All errors follow a consistent response format:

```json
{
  "statusCode": 400,
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `409 Conflict` - Email already exists (during creation)
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently no rate limiting is implemented. Please contact support if you require rate limiting.

---

## Pagination

List endpoints support pagination through query parameters:
- `page` - Page number (starts at 1)
- `limit` - Results per page (default: 10)

---

## Field Filtering

Retrieve specific fields using the `fields` query parameter:
```
GET /api/users?fields=name,email,photo
```

---

## Sorting

Sort results using the `sort` parameter:
```
GET /api/users?sort=-createdAt
```

Use `-` prefix for descending order.
