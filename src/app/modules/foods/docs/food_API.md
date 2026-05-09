# Food Module API Documentation

## Module Overview
The Food module manages restaurant menu items including creation, retrieval, updates, deletion, and user reviews. Admins can create and manage foods with image uploads, while users can view food details and add reviews.

---

## Endpoints

### 1. Create Food (Admin Only)
**Endpoint**: `POST /api/v1/foods/create-food`

**Authentication**: Admin only (Bearer token required)

**Description**: Create a new food item with optional image upload to Cloudinary

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Request Body** (form-data):
```
data: {
  "name": "Margherita Pizza",
  "description": "Classic pizza with tomato, mozzarella, basil",
  "price": 12.99,
  "category": "Pizzas",
  "isAvailable": true
}
file: (optional image file)
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "food is create successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Margherita Pizza",
    "price": 12.99,
    "image": "https://cloudinary.url/image.jpg",
    "category": "Pizzas",
    "isAvailable": true,
    "createdAt": "2026-05-09T10:00:00Z"
  }
}
```

**Field Constraints**:
- `name`: Required, string
- `description`: Optional, string
- `price`: Required, number (> 0)
- `category`: Required, string
- `isAvailable`: Optional, boolean (default: true)
- `file`: Optional, image file (jpg, png, webp, max 5MB)

**Error Cases**:
- 400: Missing required fields
- 401: Unauthorized (not admin)
- 413: File too large

---

### 2. Get All Foods (Public)
**Endpoint**: `GET /api/v1/foods`

**Authentication**: None (Public)

**Description**: Retrieve paginated list of all available foods

**Request Parameters** (Query):
```
page=1
limit=10
search=pizza
category=Pizzas
sort=-createdAt
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "retrieved all foods successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Margherita Pizza",
      "price": 12.99,
      "image": "https://cloudinary.url/image.jpg",
      "category": "Pizzas",
      "isAvailable": true,
      "rating": 4.5,
      "reviewCount": 12
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10
  }
}
```

---

### 3. Get Top Selling Foods (Public)
**Endpoint**: `GET /api/v1/foods/top-selling-food`

**Authentication**: None (Public)

**Description**: Retrieve list of top-selling foods sorted by order count

**Response** (200 OK):
```json
{
  "success": true,
  "message": "retrieved all foods successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Margherita Pizza",
      "price": 12.99,
      "image": "https://cloudinary.url/image.jpg",
      "rating": 4.8,
      "orderCount": 156
    }
  ]
}
```

---

### 4. Get Single Food Details (Public)
**Endpoint**: `GET /api/v1/foods/:foodId`

**Authentication**: None (Public)

**Description**: Retrieve detailed information about a specific food item including reviews

**Path Parameters**:
```
foodId: 507f1f77bcf86cd799439011
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Food is retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Margherita Pizza",
    "description": "Classic pizza with tomato, mozzarella, basil",
    "price": 12.99,
    "image": "https://cloudinary.url/image.jpg",
    "category": "Pizzas",
    "isAvailable": true,
    "rating": 4.5,
    "reviewCount": 12,
    "reviews": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": "507f1f77bcf86cd799439001",
        "userName": "John Doe",
        "rating": 5,
        "comment": "Delicious pizza!",
        "createdAt": "2026-05-08T15:30:00Z"
      }
    ]
  }
}
```

**Error Cases**:
- 404: Food item not found

---

### 5. Update Food (Admin Only)
**Endpoint**: `PATCH /api/v1/foods/:foodId`

**Authentication**: Admin only (Bearer token required)

**Description**: Update food details and optionally update image

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Path Parameters**:
```
foodId: 507f1f77bcf86cd799439011
```

**Request Body** (form-data):
```
data: {
  "name": "Margherita Pizza - Updated",
  "price": 13.99,
  "isAvailable": true
}
file: (optional new image file)
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "food updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Margherita Pizza - Updated",
    "price": 13.99,
    "image": "https://cloudinary.url/new-image.jpg",
    "updatedAt": "2026-05-09T11:00:00Z"
  }
}
```

**Error Cases**:
- 400: Invalid update fields
- 401: Unauthorized (not admin)
- 404: Food item not found

---

### 6. Delete Food (Admin Only)
**Endpoint**: `DELETE /api/v1/foods/:foodId`

**Authentication**: Admin only (Bearer token required)

**Description**: Delete a food item permanently

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Path Parameters**:
```
foodId: 507f1f77bcf86cd799439011
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "food deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Margherita Pizza",
    "deletedAt": "2026-05-09T11:30:00Z"
  }
}
```

**Error Cases**:
- 401: Unauthorized (not admin)
- 404: Food item not found

---

### 7. Add Review to Food (Authenticated Users)
**Endpoint**: `POST /api/v1/foods/:foodId/review`

**Authentication**: User required (Bearer token required)

**Description**: Add a rating and review to a food item

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Path Parameters**:
```
foodId: 507f1f77bcf86cd799439011
```

**Request Body** (JSON):
```json
{
  "rating": 5,
  "comment": "Amazing food, highly recommend!"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "foodId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439001",
    "rating": 5,
    "comment": "Amazing food, highly recommend!",
    "createdAt": "2026-05-09T12:00:00Z"
  }
}
```

**Field Constraints**:
- `rating`: Required, number (1-5)
- `comment`: Optional, string (max 500 characters)

**Error Cases**:
- 400: Invalid rating (must be 1-5)
- 401: Unauthorized (not authenticated)
- 404: Food item not found

---

## Access Control Summary

| Endpoint | Method | Public | User | Admin |
|----------|--------|--------|------|-------|
| Get All Foods | GET | ✅ | ✅ | ✅ |
| Get Top Selling | GET | ✅ | ✅ | ✅ |
| Get Single Food | GET | ✅ | ✅ | ✅ |
| Create Food | POST | ❌ | ❌ | ✅ |
| Update Food | PATCH | ❌ | ❌ | ✅ |
| Delete Food | DELETE | ❌ | ❌ | ✅ |
| Add Review | POST | ❌ | ✅ | ✅ |

---

## File Upload Notes

**Image Upload Handling**:
- Endpoint: Create Food, Update Food
- Field name: `file`
- Accepted formats: JPG, PNG, WebP
- Max size: 5MB
- Automatic upload to Cloudinary
- Returns secure HTTPS URL
- Optional (can create/update without image)

---

Last Updated: 2026-05-09
