# Food Category API Documentation

## Module Overview
The Food Category module manages restaurant food categories with image support. It provides endpoints for creating, retrieving, updating, and deleting food categories. Image uploads are handled through Cloudinary cloud storage with atomic transaction support.

## Base URL
```
http://localhost:5000/api/food-categories
```

## Authentication
- **Public Endpoints**: Get all categories, Get single category
- **Admin-Only Endpoints**: Create category, Update category, Delete category

---

## Endpoints

### 1. Create Category
**Endpoint**: `POST /create-category`  
**Authentication**: Required (Admin only)  
**Content-Type**: `multipart/form-data`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Category name (must be unique) |
| `description` | string | No | Category description |
| `file` | file | No | Category image (max 10MB, formats: jpg, png, webp) |

#### Request Example
```bash
curl -X POST http://localhost:5000/api/food-categories/create-category \
  -H "Authorization: Bearer {{accessToken}}" \
  -F "name=Italian" \
  -F "description=Italian cuisine dishes" \
  -F "file=@path/to/image.jpg"
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "createdCategory": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Italian",
        "description": "Italian cuisine dishes",
        "image": "https://res.cloudinary.com/...",
        "createdAt": "2026-05-09T10:30:00Z",
        "updatedAt": "2026-05-09T10:30:00Z"
      }
    ]
  }
}
```

#### Error Responses
- **400**: Category name already exists or invalid input
- **401**: Unauthorized (not logged in)
- **403**: Forbidden (user is not admin)

---

### 2. Get All Categories
**Endpoint**: `GET /`  
**Authentication**: Not required  
**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search by category name |
| `limit` | number | 10 | Results per page |
| `page` | number | 1 | Page number |
| `sort` | string | `-createdAt` | Sort field (prefix - for descending) |

#### Request Example
```bash
curl -X GET "http://localhost:5000/api/food-categories?search=&limit=10&page=1" \
  -H "Accept: application/json"
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "All categories retrieved successfully",
  "data": {
    "result": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Italian",
        "description": "Italian cuisine dishes",
        "image": "https://res.cloudinary.com/...",
        "createdAt": "2026-05-09T10:30:00Z",
        "updatedAt": "2026-05-09T10:30:00Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPage": 1
  }
}
```

---

### 3. Get Single Category
**Endpoint**: `GET /:categoryId`  
**Authentication**: Not required

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `categoryId` | string | MongoDB ObjectId of the category |

#### Request Example
```bash
curl -X GET http://localhost:5000/api/food-categories/507f1f77bcf86cd799439011 \
  -H "Accept: application/json"
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Italian",
    "description": "Italian cuisine dishes",
    "image": "https://res.cloudinary.com/...",
    "createdAt": "2026-05-09T10:30:00Z",
    "updatedAt": "2026-05-09T10:30:00Z"
  }
}
```

#### Error Response (404)
```json
{
  "success": false,
  "message": "Category not found"
}
```

---

### 4. Update Category
**Endpoint**: `PATCH /:categoryId`  
**Authentication**: Required (Admin only)  
**Content-Type**: `multipart/form-data`

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `categoryId` | string | MongoDB ObjectId of the category |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Updated category name |
| `description` | string | No | Updated description |
| `file` | file | No | New category image (max 10MB, optional) |

#### Request Example
```bash
curl -X PATCH http://localhost:5000/api/food-categories/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer {{accessToken}}" \
  -F "name=Italian Cuisine" \
  -F "description=Updated Italian cuisine dishes" \
  -F "file=@path/to/new-image.jpg"
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "updatedFoodData": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Italian Cuisine",
      "description": "Updated Italian cuisine dishes",
      "image": "https://res.cloudinary.com/...",
      "createdAt": "2026-05-09T10:30:00Z",
      "updatedAt": "2026-05-09T12:00:00Z"
    },
    "img": "https://res.cloudinary.com/..."
  }
}
```

#### Error Responses
- **400**: Invalid input
- **401**: Unauthorized (not logged in)
- **403**: Forbidden (user is not admin)
- **404**: Category not found

---

### 5. Delete Category
**Endpoint**: `DELETE /:categoryId`  
**Authentication**: Required (Admin only)

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `categoryId` | string | MongoDB ObjectId of the category |

#### Request Example
```bash
curl -X DELETE http://localhost:5000/api/food-categories/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer {{accessToken}}"
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": {
    "deletedCategory": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Italian",
      "description": "Italian cuisine dishes",
      "image": "https://res.cloudinary.com/...",
      "createdAt": "2026-05-09T10:30:00Z",
      "updatedAt": "2026-05-09T10:30:00Z"
    }
  }
}
```

#### Error Responses
- **401**: Unauthorized (not logged in)
- **403**: Forbidden (user is not admin)
- **404**: Category not found

---

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "You are not authorized!"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "You are not authorized!"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Category not found !!"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Field Constraints

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | Required, unique, 1-255 characters |
| `description` | string | Optional, max 1000 characters |
| `image` | string | Optional, max 10MB, URL from Cloudinary |

---

## Important Notes

1. **Image Upload**: Images are uploaded to Cloudinary. Old images are automatically deleted when updating a category.
2. **Atomic Transactions**: All operations (image upload, database update) happen within MongoDB transactions for data consistency.
3. **Admin-Only Operations**: Create, Update, and Delete operations require admin authentication.
4. **Public Access**: List and Get Single operations are public and don't require authentication.
5. **Unique Category Names**: Each category name must be unique in the system.
