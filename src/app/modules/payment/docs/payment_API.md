# Payment Module API Documentation

## Module Overview
The Payment module handles SSL Commerce payment processing for restaurant orders. Users can initiate payments, view payment history, and see payment details. The system integrates with SSL Commerce for secure payment processing with automatic order status updates.

---

## Endpoints

### 1. Initiate Payment (Authenticated Users)
**Endpoint**: `POST /api/v1/payments/initiate`

**Authentication**: User required (Bearer token required)

**Description**: Initiate a payment for an order via SSL Commerce gateway

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Request Body** (JSON):
```json
{
  "orderId": "507f1f77bcf86cd799439011"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "paymentUrl": "https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q3...",
    "transactionId": "TXN-507f1f77bcf86cd799439011-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "sessionkey": "session-key-from-ssl-commerz"
  }
}
```

**Field Constraints**:
- `orderId`: Required, valid MongoDB ObjectId, must be an existing order

**Error Cases**:
- 400: Invalid order ID or order not found
- 401: User not authenticated

---

### 2. Payment Success Callback (Public - SSL Commerz)
**Endpoint**: `GET /api/v1/payments/success`

**Authentication**: None (Callback from SSL Commerz)

**Description**: Callback endpoint called by SSL Commerz after successful payment

**Query Parameters**:
```
tran_id=TXN-507f1f77bcf86cd799439011-xxxxxxxx
val_id=validation-id-from-ssl-commerz
amount=1500
currency=BDT
status=VALID
```

**Response**: Redirects to client success page with transaction ID

**Client Redirect URL**:
```
https://your-client-url.com/payment-success?transactionId=TXN-507f1f77bcf86cd799439011-xxxxxxxx
```

---

### 3. Payment Failure Callback (Public - SSL Commerz)
**Endpoint**: `GET /api/v1/payments/fail`

**Authentication**: None (Callback from SSL Commerz)

**Description**: Callback endpoint called by SSL Commerz after failed payment

**Query Parameters**:
```
tran_id=TXN-507f1f77bcf86cd799439011-xxxxxxxx
```

**Response**: Redirects to client failure page

**Client Redirect URL**:
```
https://your-client-url.com/payment-failed?transactionId=TXN-507f1f77bcf86cd799439011-xxxxxxxx
```

---

### 4. Payment Cancellation Callback (Public - SSL Commerz)
**Endpoint**: `GET /api/v1/payments/cancel`

**Authentication**: None (Callback from SSL Commerz)

**Description**: Callback endpoint called by SSL Commerz when payment is cancelled

**Query Parameters**:
```
tran_id=TXN-507f1f77bcf86cd799439011-xxxxxxxx
```

**Response**: Redirects to client cancellation page

**Client Redirect URL**:
```
https://your-client-url.com/payment-cancelled?transactionId=TXN-507f1f77bcf86cd799439011-xxxxxxxx
```

---

### 5. IPN Handler (Instant Payment Notification - SSL Commerz Webhook)
**Endpoint**: `POST /api/v1/payments/ipn`

**Authentication**: None (Webhook from SSL Commerz)

**Description**: Server-to-server payment verification via Instant Payment Notification

**Request Body** (JSON from SSL Commerz):
```json
{
  "tran_id": "TXN-507f1f77bcf86cd799439011-xxxxxxxx",
  "val_id": "validation-id-from-ssl-commerz",
  "amount": 1500,
  "currency": "BDT",
  "status": "VALID",
  "store_amount": 1485,
  "card_type": "Visa",
  "card_no": "****5891",
  "value_a": "order-metadata",
  "value_b": "custom-data"
}
```

**Response** (200 OK - Payment Valid):
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "payment": {
    "_id": "507f1f77bcf86cd799439012",
    "orderId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439001",
    "amount": 1500,
    "currency": "BDT",
    "transactionId": "TXN-507f1f77bcf86cd799439011-xxxxxxxx",
    "status": "completed",
    "paymentMethod": "sslcommerz",
    "createdAt": "2026-05-09T12:00:00Z",
    "updatedAt": "2026-05-09T12:05:00Z"
  }
}
```

**Response** (400 - Payment Invalid):
```json
{
  "success": false,
  "message": "Payment validation failed"
}
```

---

### 6. Get Payment History (Authenticated Users)
**Endpoint**: `GET /api/v1/payments/history`

**Authentication**: User required (Bearer token required)

**Description**: Retrieve paginated list of all payments made by the authenticated user

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Request Parameters** (Query):
```
page=1
limit=10
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "orderId": {
        "_id": "507f1f77bcf86cd799439011",
        "foodName": "Margherita Pizza",
        "totalPrice": 1500,
        "status": "confirmed"
      },
      "userId": "507f1f77bcf86cd799439001",
      "amount": 1500,
      "currency": "BDT",
      "transactionId": "TXN-507f1f77bcf86cd799439011-xxxxxxxx",
      "status": "completed",
      "paymentMethod": "sslcommerz",
      "createdAt": "2026-05-09T12:00:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

**Error Cases**:
- 401: User not authenticated

---

### 7. Get Payment Details (Authenticated Users)
**Endpoint**: `GET /api/v1/payments/:paymentId`

**Authentication**: User required (Bearer token required)

**Description**: Retrieve detailed information about a specific payment

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Path Parameters**:
```
paymentId: 507f1f77bcf86cd799439012
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "orderId": {
      "_id": "507f1f77bcf86cd799439011",
      "foodName": "Margherita Pizza",
      "quantity": 2,
      "price": 750,
      "totalPrice": 1500,
      "status": "confirmed",
      "createdAt": "2026-05-09T11:00:00Z"
    },
    "userId": {
      "_id": "507f1f77bcf86cd799439001",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "amount": 1500,
    "currency": "BDT",
    "transactionId": "TXN-507f1f77bcf86cd799439011-xxxxxxxx",
    "status": "completed",
    "paymentMethod": "sslcommerz",
    "sslcommerzResponse": {
      "status": "VALID",
      "tran_id": "TXN-507f1f77bcf86cd799439011-xxxxxxxx",
      "val_id": "validation-id-xxxxx",
      "amount": "1500.00",
      "card_type": "Visa",
      "card_no": "****5891"
    },
    "createdAt": "2026-05-09T12:00:00Z",
    "updatedAt": "2026-05-09T12:05:00Z"
  }
}
```

**Error Cases**:
- 401: User not authenticated
- 404: Payment not found

---

## Access Control Summary

| Endpoint | Method | Public | User | Admin |
|----------|--------|--------|------|-------|
| Initiate Payment | POST | ❌ | ✅ | ✅ |
| Payment Success | GET | ✅ | ✅ | ✅ |
| Payment Fail | GET | ✅ | ✅ | ✅ |
| Payment Cancel | GET | ✅ | ✅ | ✅ |
| IPN Handler | POST | ✅ | ✅ | ✅ |
| Get Payment History | GET | ❌ | ✅ | ✅ |
| Get Payment Details | GET | ❌ | ✅ | ✅ |

---

## Payment Flow Diagram

```
1. User creates order → Order status: "pending"
   ↓
2. User initiates payment → POST /api/v1/payments/initiate
   ↓
3. Server creates payment record (status: "pending") → Redirects to SSL Commerz gateway
   ↓
4. User completes payment at SSL Commerz gateway
   ↓
5a. Success: GET /api/v1/payments/success
    → Redirects to client success page
    → Server updates order status to "confirmed"
    → Server updates payment status to "completed"
   ↓
5b. Failure: GET /api/v1/payments/fail
    → Redirects to client failure page
    → Server updates payment status to "failed"
   ↓
5c. Cancellation: GET /api/v1/payments/cancel
    → Redirects to client cancellation page
    → Server updates payment status to "cancelled"
```

---

## SSL Commerce Configuration

**Environment Variables Required**:
```
STORE_ID=your_store_id_from_ssl_commerz
STORE_PASSWD=your_store_password_from_ssl_commerz
IS_LIVE=false (for sandbox) or true (for production)
SERVER_URL=https://your-api-server-url.com
CLIENT_URL=https://your-client-app-url.com
```

**Sandbox Credentials**:
- Get free sandbox account from: https://www.sslcommerz.com/
- Test payment card: 4111111111111111 (expires any future date, CVC: any 3 digits)

**API Endpoints**:
- Sandbox: https://sandbox.sslcommerz.com/gwprocess/v4/api.php
- Live: https://securepay.sslcommerz.com/gwprocess/v4/api.php

---

## Payment Status Transitions

```
pending → completed (after successful payment verification)
pending → failed (after payment failure)
pending → cancelled (after payment cancellation)
```

---

## Error Handling

All payment operations include comprehensive error handling:
- Invalid order IDs are caught and return 400 error
- Missing authentication redirects to login
- SSL Commerz API errors are logged and return appropriate HTTP status codes
- Network failures are handled gracefully with retry logic (optional)

---

Last Updated: 2026-05-09
