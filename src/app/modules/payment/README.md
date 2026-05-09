# Payment Module - SSL Commerce Integration

## Overview

The Payment module provides complete SSL Commerce payment gateway integration for the RestOs restaurant management system. Users can:
- Initiate payments for orders
- View payment history
- See detailed payment information
- Receive automatic order status updates upon successful payment

## Features

✅ **SSL Commerce Integration**
- Sandbox and live environment support
- Secure payment processing
- Automatic payment verification (IPN)
- Transaction ID tracking

✅ **Payment Flow Management**
- Order → Payment initiation → Gateway redirect → Verification → Order confirmation
- Automatic status transitions
- Payment history tracking

✅ **Security**
- Role-based access control (authenticated users only)
- JWT token validation
- Secure credential management via environment variables
- HTTPS-only communication

✅ **Error Handling**
- Comprehensive error cases covered
- User-friendly error messages
- Transaction logging

## Architecture

```
payment/
├── payment.interface.ts       # TypeScript types and interfaces
├── payment.model.ts           # MongoDB schema definition
├── payment.validation.ts      # Zod validation schemas
├── payment.service.ts         # Business logic & SSL Commerce API calls
├── payment.controller.ts      # Request handlers
├── payment.route.ts           # Express route definitions
├── docs/
│   ├── payment_API.md         # Complete API documentation
│   └── payment.postman_collection.json  # Postman test collection
└── README.md                  # This file
```

## Setup & Configuration

### 1. Environment Variables

Add these to your `.env` file:

```env
# SSL Commerce Configuration
STORE_ID=your_store_id_from_ssl_commerz
STORE_PASSWD=your_store_password_from_ssl_commerz
IS_LIVE=false              # Set to 'true' for production

# Server & Client URLs
SERVER_URL=https://your-api-server-url.com
CLIENT_URL=https://your-client-app-url.com
```

### 2. Get SSL Commerce Credentials

1. Visit: https://www.sslcommerz.com/
2. Create a free sandbox account (for testing)
3. Copy your Store ID and Store Password
4. Add them to `.env` file

**Free Sandbox Test Card**:
- Card Number: `4111111111111111`
- Expiry: Any future date
- CVC: Any 3 digits

### 3. Install Dependencies

```bash
npm install axios
```

## Payment Flow

```
┌─────────────────────────────────────────────────┐
│ 1. Create Order (via /orders endpoint)          │
│    Order Status: pending                        │
│    Payment Status: pending                      │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 2. User Initiates Payment (/payments/initiate)  │
│    - Validate order exists                      │
│    - Create payment record                      │
│    - Call SSL Commerce API                      │
│    - Get payment gateway URL                    │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 3. User Redirected to SSL Commerce Gateway      │
│    - User enters card details                   │
│    - Payment processing                         │
└──────────────┬──────────────────────────────────┘
               │
         ┌─────┴──────┬──────────────┐
         │            │              │
         ▼            ▼              ▼
    SUCCESS       FAIL          CANCEL
         │            │              │
    ┌────┴─┐      ┌───┴──┐     ┌────┴──┐
    │      │      │      │     │       │
    ▼      ▼      ▼      ▼     ▼       ▼
  GET    IPN    GET    IPN    GET     IPN
 /success      /fail          /cancel
    │      │      │      │     │       │
    └──┬───┘      └──┬───┘     └───┬───┘
       │             │             │
       ▼             ▼             ▼
  COMPLETED      FAILED       CANCELLED
  Order Status: confirmed
  Payment Status: completed
```

## API Endpoints

### Core Payment Endpoints

1. **POST /api/v1/payments/initiate**
   - Initiate payment for an order
   - Returns SSL Commerce payment URL
   - Auth: User required

2. **GET /api/v1/payments/history**
   - Get user's payment history with pagination
   - Auth: User required

3. **GET /api/v1/payments/:paymentId**
   - Get detailed payment information
   - Auth: User required

### Callback Endpoints (SSL Commerz)

4. **GET /api/v1/payments/success**
   - Called after successful payment
   - Redirects to client success page

5. **GET /api/v1/payments/fail**
   - Called after failed payment
   - Redirects to client failure page

6. **GET /api/v1/payments/cancel**
   - Called when user cancels payment
   - Redirects to client cancellation page

7. **POST /api/v1/payments/ipn**
   - Instant Payment Notification webhook
   - Server-to-server payment verification
   - SSL Commerz → Your API

## Testing with Postman

1. **Import Postman Collection**:
   - File: `payment.postman_collection.json`
   - Import into Postman

2. **Set Environment Variables**:
   - `baseUrl`: http://localhost:3000/api/v1
   - `accessToken`: (get from login/signup)
   - `orderId`: (get from orders endpoint)

3. **Test Flow**:
   ```
   1. Create order via /orders/create-order endpoint
   2. Copy orderId
   3. Set orderId in Postman environment
   4. POST /payments/initiate
   5. Copy returned transactionId to environment
   6. (In real scenario: Complete payment at SSL Commerce)
   7. GET /payments/history to verify
   8. GET /payments/{paymentId} for details
   ```

## Error Handling

All endpoints include comprehensive error handling:

| Error | HTTP Status | Cause |
|-------|-------------|-------|
| Invalid Order ID | 400 | Order doesn't exist |
| User Not Authenticated | 401 | Missing/invalid JWT token |
| Payment Not Found | 404 | Payment ID doesn't exist |
| SSL Commerz API Error | 400 | Payment gateway issue |

## Database Schema

### Payment Document

```json
{
  "_id": "ObjectId",
  "orderId": "ObjectId (ref: Orders)",
  "userId": "ObjectId (ref: User)",
  "amount": 1500,
  "currency": "BDT",
  "transactionId": "TXN-...-unique",
  "status": "completed|pending|failed|cancelled",
  "paymentMethod": "sslcommerz",
  "sslcommerzResponse": { /* raw response from SSL Commerz */ },
  "createdAt": "2026-05-09T12:00:00Z",
  "updatedAt": "2026-05-09T12:05:00Z"
}
```

### Order Document (Updated)

```json
{
  "_id": "ObjectId",
  "food": "ObjectId (ref: Food)",
  "user": "ObjectId (ref: User)",
  "foodName": "Pizza",
  "price": 750,
  "totalPrice": 1500,
  "quantity": 2,
  "status": "confirmed|pending|canceled",
  "paymentStatus": "completed|pending|failed|cancelled",
  "createdAt": "2026-05-09T11:00:00Z",
  "updatedAt": "2026-05-09T12:00:00Z"
}
```

## Integration Checklist

- [ ] Add SSL Commerce credentials to `.env`
- [ ] Install axios: `npm install axios`
- [ ] Database migrations run (Payment collection created)
- [ ] Server restart: `npm run dev`
- [ ] Test with Postman collection
- [ ] Verify payment flow end-to-end
- [ ] Set up IPN callback in SSL Commerce dashboard (production only)
- [ ] Update client URLs in environment

## Common Issues & Solutions

### Issue: "Payment initiation failed"
**Cause**: Invalid SSL Commerce credentials
**Solution**: 
1. Verify STORE_ID and STORE_PASSWD in `.env`
2. Check IS_LIVE flag matches your environment
3. Ensure credentials are not wrapped in quotes

### Issue: "Order not found" when initiating payment
**Cause**: Invalid order ID or typo
**Solution**:
1. Verify orderId exists in database
2. Check order belongs to authenticated user
3. Use correct MongoDB ObjectId format

### Issue: Payment verification fails (IPN)
**Cause**: Incorrect callback URL in SSL Commerz settings
**Solution**:
1. Update IPN URL in SSL Commerz dashboard
2. Ensure SERVER_URL is publicly accessible
3. Check firewall/proxy allows SSL Commerz IPN

## Production Deployment

1. **Switch to Live Mode**:
   ```env
   IS_LIVE=true
   STORE_ID=your_live_store_id
   STORE_PASSWD=your_live_store_password
   ```

2. **Configure IPN in SSL Commerz Dashboard**:
   - Set IPN URL: `https://your-api.com/api/v1/payments/ipn`
   - Enable IPN notifications

3. **Update Redirect URLs**:
   - Success: `https://your-client.com/payment-success`
   - Fail: `https://your-client.com/payment-failed`
   - Cancel: `https://your-client.com/payment-cancelled`

4. **Enable HTTPS**:
   - All payment-related requests must use HTTPS
   - Update SERVER_URL and CLIENT_URL to HTTPS

## Security Best Practices

✅ **Implemented**:
- JWT token validation on all protected endpoints
- HTTPS-only communication (enforced in production)
- Secure credential storage (environment variables)
- Transaction ID uniqueness
- Order validation before payment processing

✅ **Recommended**:
- Enable rate limiting on payment endpoints
- Log all payment transactions
- Monitor for suspicious payment patterns
- Regular security audits
- Implement payment idempotency (prevent duplicate charges)

## Support & References

- **SSL Commerz Documentation**: https://developer.sslcommerz.com/
- **API Status**: https://www.sslcommerz.com/
- **Integration Guide**: https://www.sslcommerz.com/product/sslcommerz-merchant-gateway/

---

**Last Updated**: 2026-05-09
**Version**: 1.0.0
