# Complete Postman Testing Guide - Payment Integration

## Prerequisites
- Postman installed
- Server running: `npm run dev`
- SSL Commerce credentials configured in `.env`
- Payment Postman collection imported

---

## Step-by-Step Testing Sequence

### PHASE 1: AUTHENTICATION (Get Access Token)

#### Step 1.1: Sign Up (Create User Account)
**Request**: POST /api/v1/auths/signup
```
URL: http://localhost:3000/api/v1/auths/signup

Headers:
Content-Type: application/json

Body (raw JSON):
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "Test@1234"
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439001",
    "name": "Test User",
    "email": "testuser@example.com",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**✅ Action**: Copy `accessToken` value

---

#### Step 1.2: Save Access Token to Postman Environment
1. In Postman, click "Environments" (top left dropdown)
2. Select your environment (e.g., "RestOs Dev")
3. Find variable: `accessToken`
4. Paste the token value you copied in Step 1.1
5. Click "Save"

**Visual Guide**:
```
Postman → Environments → RestOs Dev
├── baseUrl: http://localhost:3000/api/v1
├── accessToken: [YOUR_TOKEN_HERE] ✅ UPDATED
├── orderId: (empty - will fill in next phase)
├── transactionId: (empty)
└── paymentId: (empty)
```

---

### PHASE 2: CREATE ORDER (Prepare for Payment)

#### Step 2.1: Get Food List (Get foodId)
**Request**: GET /api/v1/foods
```
URL: http://localhost:3000/api/v1/foods?limit=5

Headers: (none needed - public endpoint)
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "retrieved all foods successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439010",
      "name": "Margherita Pizza",
      "price": 750,
      "category": "Pizzas",
      "isAvailable": true
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 5
  }
}
```

**✅ Action**: Copy any `_id` value from the foods list

---

#### Step 2.2: Create Order
**Request**: POST /api/v1/orders/create-order
```
URL: http://localhost:3000/api/v1/orders/create-order

Headers:
Content-Type: application/json

Body (raw JSON):
{
  "food": "507f1f77bcf86cd799439010",
  "quantity": 2,
  "price": 750,
  "totalPrice": 1500
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "food": "507f1f77bcf86cd799439010",
    "user": "507f1f77bcf86cd799439001",
    "foodName": "Margherita Pizza",
    "quantity": 2,
    "price": 750,
    "totalPrice": 1500,
    "status": "pending",
    "paymentStatus": "pending",
    "createdAt": "2026-05-09T14:00:00Z"
  }
}
```

**✅ Action**: Copy `_id` value (this is orderId)

---

#### Step 2.3: Save Order ID to Postman Environment
1. In Postman, go to Environments
2. Find variable: `orderId`
3. Paste the order ID from Step 2.2
4. Click "Save"

**Environment Updated**:
```
accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ✅
orderId: 507f1f77bcf86cd799439020 ✅
```

---

### PHASE 3: PAYMENT PROCESSING (Main Payment Flow)

#### Step 3.1: Initiate Payment
**Request**: POST /api/v1/payments/initiate
```
URL: http://localhost:3000/api/v1/payments/initiate

Headers:
Authorization: Bearer {{accessToken}}
Content-Type: application/json

Body (raw JSON):
{
  "orderId": "{{orderId}}"
}
```

**What Happens**:
- Server validates order exists
- Creates payment record with status "pending"
- Calls SSL Commerce API
- Gets payment gateway URL

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "paymentUrl": "https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q3D5F6E7D8C9B0A...",
    "transactionId": "TXN-507f1f77bcf86cd799439020-550e8400-e29b-41d4-a716-446655440000",
    "sessionkey": "session-key-xxx"
  }
}
```

**✅ Actions**:
1. Copy `transactionId` value
2. Save it to Postman environment variable: `transactionId`
3. Copy the `paymentUrl` (you'll use it in next step)

**Environment Updated**:
```
accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ✅
orderId: 507f1f77bcf86cd799439020 ✅
transactionId: TXN-507f1f77bcf86cd799439020-550e8400... ✅
```

---

#### Step 3.2: Complete Payment at SSL Commerce (Manual Step)

⚠️ **IMPORTANT**: This is a manual step in your browser

1. **Open the Payment URL**:
   - Copy the `paymentUrl` from Step 3.1 response
   - Open in browser: https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q3D5F6E7D8C9B0A...

2. **You'll see SSL Commerce Payment Gateway**:
   ```
   SSL Commerce Secure Payment Gateway
   ─────────────────────────────────────
   Customer Name: Test User
   Email: testuser@example.com
   Amount: 1500 BDT
   
   [Select Payment Method]
   ├── Credit Card
   ├── Debit Card
   ├── bKash
   └── Nagad
   ```

3. **Choose Credit Card** (for sandbox testing)

4. **Enter Test Card Details**:
   ```
   Card Number: 4111111111111111
   Expiry Date: 12/25 (any future month/year)
   CVC: 123 (any 3 digits)
   ```

5. **Click "Pay"** and confirm

6. **After Payment** (automated by SSL Commerz):
   - You'll be redirected automatically
   - Server receives IPN notification
   - Payment status updated to "completed"
   - Order status updated to "confirmed"

**📌 What's Happening Behind the Scenes**:
```
Browser → SSL Commerz Gateway → Complete Payment
                                      ↓
                        SSL Commerz sends IPN notification
                                      ↓
                        POST /api/v1/payments/ipn
                                      ↓
                        Server verifies payment
                                      ↓
                        Update payment status → "completed"
                                      ↓
                        Update order status → "confirmed"
```

---

### PHASE 4: VERIFICATION (Confirm Payment Was Processed)

#### Step 4.1: Get Payment History
**Request**: GET /api/v1/payments/history
```
URL: http://localhost:3000/api/v1/payments/history?page=1&limit=10

Headers:
Authorization: Bearer {{accessToken}}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439025",
      "orderId": {
        "_id": "507f1f77bcf86cd799439020",
        "foodName": "Margherita Pizza",
        "totalPrice": 1500,
        "status": "confirmed"
      },
      "userId": "507f1f77bcf86cd799439001",
      "amount": 1500,
      "currency": "BDT",
      "transactionId": "TXN-507f1f77bcf86cd799439020-550e8400...",
      "status": "completed",
      "paymentMethod": "sslcommerz",
      "createdAt": "2026-05-09T14:05:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

**✅ Verify**:
- Payment status is "completed" ✅
- Order status is "confirmed" ✅
- Payment is in your history ✅

**✅ Action**: Copy `_id` from payment object (this is paymentId)

---

#### Step 4.2: Save Payment ID to Postman Environment
1. In Postman, go to Environments
2. Find variable: `paymentId`
3. Paste the payment ID from Step 4.1
4. Click "Save"

**Environment Now Complete**:
```
accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ✅
orderId: 507f1f77bcf86cd799439020 ✅
transactionId: TXN-507f1f77bcf86cd799439020-550e8400... ✅
paymentId: 507f1f77bcf86cd799439025 ✅
```

---

#### Step 4.3: Get Payment Details
**Request**: GET /api/v1/payments/:paymentId
```
URL: http://localhost:3000/api/v1/payments/{{paymentId}}

Headers:
Authorization: Bearer {{accessToken}}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439025",
    "orderId": {
      "_id": "507f1f77bcf86cd799439020",
      "foodName": "Margherita Pizza",
      "quantity": 2,
      "price": 750,
      "totalPrice": 1500,
      "status": "confirmed",
      "createdAt": "2026-05-09T14:00:00Z"
    },
    "userId": {
      "_id": "507f1f77bcf86cd799439001",
      "name": "Test User",
      "email": "testuser@example.com"
    },
    "amount": 1500,
    "currency": "BDT",
    "transactionId": "TXN-507f1f77bcf86cd799439020-550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "paymentMethod": "sslcommerz",
    "sslcommerzResponse": {
      "status": "VALID",
      "tran_id": "TXN-507f1f77bcf86cd799439020-550e8400-e29b-41d4-a716-446655440000",
      "val_id": "validation-id-xxxxx",
      "amount": "1500.00",
      "card_type": "Visa",
      "card_no": "****1111"
    },
    "createdAt": "2026-05-09T14:05:00Z",
    "updatedAt": "2026-05-09T14:05:00Z"
  }
}
```

**✅ Verify Complete Payment Details**:
- SSL Commerz response included ✅
- Card details (masked) shown ✅
- Full transaction history available ✅

---

### PHASE 5: DATABASE VERIFICATION (Optional but Recommended)

#### Step 5.1: Check Payment Record in MongoDB
```bash
# Connect to MongoDB
mongosh

# Switch to RestOS database
use RestOS

# Find payment record
db.payments.findOne({ transactionId: "TXN-507f1f77bcf86cd799439020-550e8400..." })

# Expected output:
{
  "_id": ObjectId("507f1f77bcf86cd799439025"),
  "orderId": ObjectId("507f1f77bcf86cd799439020"),
  "userId": ObjectId("507f1f77bcf86cd799439001"),
  "amount": 1500,
  "currency": "BDT",
  "transactionId": "TXN-507f1f77bcf86cd799439020-550e8400...",
  "status": "completed",
  "paymentMethod": "sslcommerz",
  "sslcommerzResponse": { /* full SSL Commerz response */ },
  "createdAt": ISODate("2026-05-09T14:05:00Z"),
  "updatedAt": ISODate("2026-05-09T14:05:00Z")
}
```

---

#### Step 5.2: Check Order Record Updated
```bash
db.orders.findOne({ _id: ObjectId("507f1f77bcf86cd799439020") })

# Expected output:
{
  "_id": ObjectId("507f1f77bcf86cd799439020"),
  "food": ObjectId("507f1f77bcf86cd799439010"),
  "user": ObjectId("507f1f77bcf86cd799439001"),
  "foodName": "Margherita Pizza",
  "quantity": 2,
  "price": 750,
  "totalPrice": 1500,
  "status": "confirmed",
  "paymentStatus": "completed",
  "createdAt": ISODate("2026-05-09T14:00:00Z"),
  "updatedAt": ISODate("2026-05-09T14:05:00Z")
}
```

**✅ Verify**:
- Order status: "confirmed" ✅
- Payment status: "completed" ✅
- Timestamps updated ✅

---

## Complete Testing Checklist

```
PHASE 1: AUTHENTICATION
  ☐ Step 1.1: Sign up user
  ☐ Step 1.2: Save access token to environment

PHASE 2: ORDER CREATION
  ☐ Step 2.1: Get food list
  ☐ Step 2.2: Create order
  ☐ Step 2.3: Save order ID to environment

PHASE 3: PAYMENT PROCESSING
  ☐ Step 3.1: Initiate payment (get payment URL)
  ☐ Step 3.2: Complete payment at SSL Commerce gateway
             - Use test card: 4111111111111111
             - Expiry: Any future date
             - CVC: Any 3 digits

PHASE 4: VERIFICATION
  ☐ Step 4.1: Get payment history
  ☐ Step 4.2: Save payment ID to environment
  ☐ Step 4.3: Get payment details

PHASE 5: DATABASE CHECK (Optional)
  ☐ Step 5.1: Verify payment record in MongoDB
  ☐ Step 5.2: Verify order record updated

EXPECTED RESULTS:
  ✅ Payment status: "completed"
  ✅ Order status: "confirmed"
  ✅ Payment history shows 1 completed payment
  ✅ Order paymentStatus: "completed"
```

---

## Troubleshooting During Testing

### Issue: "User not authenticated" at Step 3.1
**Cause**: Access token not set or expired
**Solution**:
1. Go to Step 1.2 again
2. Copy fresh token from signup response
3. Update environment variable
4. Retry Step 3.1

### Issue: "Order not found" at Step 3.1
**Cause**: Order ID incorrect or doesn't exist
**Solution**:
1. Go to Step 2.2 again
2. Create a new order
3. Copy new order ID
4. Update environment variable
5. Retry Step 3.1

### Issue: Payment URL not working
**Cause**: SSL Commerce sandbox credentials incorrect
**Solution**:
1. Check `.env` file has correct STORE_ID and STORE_PASSWD
2. Verify IS_LIVE=false
3. Restart server: `npm run dev`
4. Retry Step 3.1

### Issue: Payment status still "pending" after Step 3.2
**Cause**: IPN verification didn't work automatically
**Solution**:
1. Check server logs for errors
2. Manually test IPN endpoint:
   ```
   POST /api/v1/payments/ipn
   Body: {
     "tran_id": "your-transaction-id",
     "val_id": "your-val-id",
     "status": "VALID"
   }
   ```
3. Check if payment was verified

---

## Quick Reference: Environment Variables

After completing all steps, your Postman environment should look like:

```
baseUrl = http://localhost:3000/api/v1
accessToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
orderId = 507f1f77bcf86cd799439020
transactionId = TXN-507f1f77bcf86cd799439020-550e8400-e29b-41d4-a716-446655440000
paymentId = 507f1f77bcf86cd799439025
```

These can be reused for:
- Testing multiple payment scenarios
- Creating new orders and payments
- Checking payment history

---

## What You've Tested

✅ User authentication and JWT tokens
✅ Order creation with food items
✅ Payment initiation with SSL Commerce
✅ Actual payment gateway (test mode)
✅ Automatic payment verification (IPN)
✅ Order status auto-update
✅ Payment history retrieval
✅ Payment detail retrieval
✅ Database record creation and updates

**All 7 payment endpoints are now verified working!** 🎉

---

**Last Updated**: 2026-05-09
**Status**: Ready for Production Testing
