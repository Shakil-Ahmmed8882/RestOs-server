# Payment Integration Setup Guide

## Quick Start

This guide walks you through setting up SSL Commerce payment processing for your RestOs application.

---

## Step 1: Get SSL Commerce Credentials

### For Testing (Sandbox)

1. Visit: https://www.sslcommerz.com/
2. Click "Create Account" or "Get Started"
3. Select "Merchant" account type
4. Fill in your business details:
   - Business Name: RestOs
   - Email: shakilahmmed8882@gmail.com
   - Phone: Your contact number
   - Country: Bangladesh

5. Complete registration and verify email

6. Once logged in:
   - Go to Dashboard → Settings → Store Credentials
   - Copy your **Store ID**
   - Copy your **Store Password**

### Testing with Sandbox

Sandbox provides a safe environment to test payments without real money.

**Test Card Details**:
```
Card Number: 4111111111111111
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
```

---

## Step 2: Update Environment Variables

1. Open your `.env` file:
```bash
# File: .env
```

2. Add/Update these variables with your SSL Commerce credentials:

```env
# SSL Commerce Configuration
STORE_ID=your_actual_store_id_here
STORE_PASSWD=your_actual_store_password_here
IS_LIVE=false              # Set to 'true' for production later

# Server & Client URLs (critical for payment flow)
SERVER_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173
```

⚠️ **Important**:
- Do NOT include quotes around values
- Keep credentials secure (never commit to Git)
- IS_LIVE=false uses sandbox, IS_LIVE=true uses production

---

## Step 3: Verify Installation

Check that axios is installed:

```bash
npm list axios
```

If not installed:
```bash
npm install axios
```

---

## Step 4: Start the Development Server

```bash
npm run dev
```

You should see:
```
Server is running on port 3000
Connected to database
Payment module ready
```

---

## Step 5: Test Payment Flow

### Using Postman

1. **Import Payment Collection**:
   - File: `src/app/modules/payment/docs/payment.postman_collection.json`
   - In Postman: File → Import → Choose JSON file

2. **Set Up Environment Variables in Postman**:
   - Click "Environments" (top left)
   - Create new environment: `RestOs Dev`
   - Add variables:
     ```
     baseUrl: http://localhost:3000/api/v1
     accessToken: (leave blank, will be auto-populated)
     orderId: (leave blank, will be auto-populated)
     transactionId: (leave blank, will be auto-populated)
     ```

3. **Test Sequence**:

   **Step A: Sign Up / Login**
   - Use Auth Postman collection
   - POST `/auths/signup` or `/auths/login`
   - Copy `accessToken` from response
   - Paste into Postman environment variable

   **Step B: Create Order**
   - Use Order Postman collection
   - POST `/orders/create-order`
   - Include: foodId, quantity, price
   - Copy `orderId` from response
   - Paste into Postman environment variable

   **Step C: Initiate Payment**
   - Use Payment Postman collection
   - POST `/payments/initiate`
   - Body: `{"orderId": "{{orderId}}"}`
   - Response includes `paymentUrl`
   - Click the URL to test actual SSL Commerce gateway

   **Step D: Simulate Payment Success**
   - At SSL Commerce gateway, use test card: `4111111111111111`
   - After payment, you're redirected to success URL
   - This triggers payment verification automatically

   **Step E: Verify Payment**
   - GET `/payments/history`
   - Should show your completed payment
   - GET `/payments/{{paymentId}}`
   - View detailed payment information

---

## Step 6: Database Check

Verify payment records are created:

```bash
# Connect to MongoDB
# Find payment records
db.payments.find()

# Find order with payment status
db.orders.find()
```

Expected payment document:
```json
{
  "_id": ObjectId("..."),
  "orderId": ObjectId("..."),
  "userId": ObjectId("..."),
  "amount": 1500,
  "currency": "BDT",
  "transactionId": "TXN-...-unique",
  "status": "completed",
  "paymentMethod": "sslcommerz",
  "sslcommerzResponse": { ... },
  "createdAt": ISODate("2026-05-09T..."),
  "updatedAt": ISODate("2026-05-09T...")
}
```

---

## Step 7: Production Setup (Later)

When ready to go live:

1. **Switch to Live Credentials**:
   ```env
   IS_LIVE=true
   STORE_ID=your_live_store_id
   STORE_PASSWD=your_live_store_password
   ```

2. **Update URLs**:
   ```env
   SERVER_URL=https://your-production-api.com
   CLIENT_URL=https://your-production-app.com
   ```

3. **Enable HTTPS**:
   - All payment endpoints must use HTTPS
   - SSL certificate required

4. **Configure IPN in SSL Commerce**:
   - Login to SSL Commerz account
   - Settings → IPN Settings
   - Set IPN URL: `https://your-api.com/api/v1/payments/ipn`
   - Enable notifications

---

## API Reference Quick Guide

### Initiate Payment
```
POST /api/v1/payments/initiate
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "orderId": "507f1f77bcf86cd799439011"
}

Response:
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.sslcommerz.com/...",
    "transactionId": "TXN-...",
    "sessionkey": "..."
  }
}
```

### Get Payment History
```
GET /api/v1/payments/history?page=1&limit=10
Authorization: Bearer {{accessToken}}

Response:
{
  "success": true,
  "data": [{ payment objects }],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

### Get Payment Details
```
GET /api/v1/payments/:paymentId
Authorization: Bearer {{accessToken}}

Response:
{
  "success": true,
  "data": { payment object with full details }
}
```

---

## Troubleshooting

### Issue: "STORE_ID is required"
**Solution**: 
- Check `.env` file has STORE_ID value (not empty)
- Ensure no quotes around the value
- Restart dev server: `npm run dev`

### Issue: "Payment gateway returned error"
**Solution**:
- Verify credentials are correct from SSL Commerz dashboard
- Check IS_LIVE matches your environment
- Ensure SERVER_URL and CLIENT_URL are correctly set

### Issue: "Order not found"
**Solution**:
- Create order first via `/orders/create-order`
- Verify orderId is valid MongoDB ObjectId
- Ensure order belongs to authenticated user

### Issue: "User not authenticated"
**Solution**:
- Make sure you logged in first
- Check accessToken is set in Postman environment
- Token may have expired - login again

### Issue: "Payment callback not working"
**Solution**:
- For localhost testing: callbacks won't work naturally (redirects)
- In production: ensure IPN URL is set in SSL Commerce dashboard
- Check firewall allows SSL Commerz IP addresses

---

## Testing Checklist

- [ ] SSL Commerce credentials obtained
- [ ] Environment variables updated (.env)
- [ ] axios installed (`npm install axios`)
- [ ] Dev server started (`npm run dev`)
- [ ] Postman collection imported
- [ ] User authentication working
- [ ] Order creation working
- [ ] Payment initiation returning gateway URL
- [ ] Test payment completed (using test card)
- [ ] Payment history showing completed payment
- [ ] Order status updated to "confirmed"
- [ ] Payment details retrievable

---

## Architecture Overview

```
RestOs Application
├── Auth Module
│   └── User login/signup (get JWT token)
├── Order Module
│   └── Create order (get orderId)
└── Payment Module
    ├── Initiate Payment
    │   └── Call SSL Commerce API
    │       └── Get payment gateway URL
    ├── SSL Commerce Gateway
    │   └── User completes payment
    ├── Callback Handler
    │   ├── Success → Update order to "confirmed"
    │   ├── Fail → Mark payment as "failed"
    │   └── Cancel → Mark payment as "cancelled"
    ├── IPN Webhook
    │   └── Server-to-server verification
    └── History & Details
        └── User can view all payments
```

---

## File Structure

```
src/app/modules/payment/
├── payment.interface.ts           # Type definitions
├── payment.model.ts               # MongoDB schema
├── payment.validation.ts          # Zod validation
├── payment.service.ts             # Business logic + SSL Commerce API
├── payment.controller.ts          # Request handlers
├── payment.route.ts               # Routes
├── docs/
│   ├── payment_API.md            # Complete API documentation
│   └── payment.postman_collection.json  # Test collection
└── README.md                      # Module documentation
```

---

## Next Steps

1. ✅ Follow Steps 1-7 above
2. ✅ Run test payments using sandbox
3. ✅ Verify order status updates automatically
4. ✅ Check payment records in database
5. ✅ Review payment history in client app
6. ⏳ When ready: Switch to production credentials

---

## Support Resources

- **SSL Commerz Docs**: https://developer.sslcommerz.com/
- **API Documentation**: `src/app/modules/payment/docs/payment_API.md`
- **Postman Collection**: `src/app/modules/payment/docs/payment.postman_collection.json`
- **Module README**: `src/app/modules/payment/README.md`

---

**Setup Completed!** 🎉

Your payment module is ready. Follow the testing checklist and you'll have a fully functional SSL Commerce integration.

**Questions?** Check the troubleshooting section above.
