# Payment 500 Error Fix - POST /api/checkout/create

## Issue Summary

Users experienced a 500 Internal Server Error when attempting to process online payments through the Stripe integration. The error originated in the `POST /api/checkout/create` endpoint.

## Root Causes Identified and Fixed

### 1. **Stripe Client Initialization Timing (CRITICAL)**

**Problem:**

```javascript
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY); // ❌ Initialized at module load
```

- The Stripe client was initialized at module import time with `process.env.STRIPE_SECRET_KEY`
- If environment variables were not yet loaded when the module was imported, `stripeClient` would be initialized with `undefined`
- This caused errors when attempting to call methods like `stripeClient.checkout.sessions.create()`

**Solution:**

```javascript
let stripeClient;

const getStripeClient = () => {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable not configured");
    }
    stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};
```

- Implemented lazy initialization of Stripe client
- Ensures `STRIPE_SECRET_KEY` is available at time of use, not at module load time
- All references to `stripeClient` updated to use `getStripeClient()`:
  - Line 104: `stripeClient.checkout.sessions.create()` → `getStripeClient().checkout.sessions.create()`
  - Line 156: `stripeClient.webhooks.constructEvent()` → `getStripeClient().webhooks.constructEvent()`
  - Line 527: `stripeClient.refunds.create()` → `getStripeClient().refunds.create()`
  - Line 640: `stripeClient.checkout.sessions.retrieve()` → `getStripeClient().checkout.sessions.retrieve()`

### 2. **Enhanced Error Logging in Payment Service**

**Improvements:**

- Added try-catch wrapper around entire `createCheckoutSession` method
- Added comprehensive error logging with stack traces:

```javascript
catch (error) {
  logger.error("Failed to create checkout session", {
    orderId,
    error: error.message,
    stack: error.stack
  });
  throw error;
}
```

### 3. **Enhanced Error Logging in Payment Controller**

**Improvements:**

- Added detailed environment variable validation logging
- Added order existence check with logging:

```javascript
console.log("STRIPE_SECRET_KEY configured:", !!process.env.STRIPE_SECRET_KEY);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
// ... after order lookup:
console.log("Order found:", {
  _id: order._id,
  orderNumber: order.orderNumber,
  items: order.items?.length || 0,
  totalAmount: order.totalAmount,
  paymentStatus: order.paymentStatus,
});
```

- Enhanced error response with stack trace in development mode:

```javascript
catch (error) {
  console.error("Checkout session error:", {
    message: error.message,
    stack: error.stack,
    orderId: req.body?.orderId
  });
  res.status(500).json({
    success: false,
    error: error.message || "Failed to create checkout session",
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
```

### 4. **Environment Variable Validation**

Added explicit validation in `createCheckoutSession`:

```javascript
// Validate CLIENT_URL is set
if (!process.env.CLIENT_URL) {
  throw new Error("CLIENT_URL environment variable not configured");
}
```

## Files Modified

1. **server/src/modules/payment/paymentService.js**

   - Added `getStripeClient()` function for lazy initialization
   - Updated all `stripeClient` references to use `getStripeClient()`
   - Added error logging wrapper around `createCheckoutSession`
   - Added `CLIENT_URL` validation

2. **server/src/modules/payment/paymentController.js**
   - Added comprehensive environment variable logging
   - Added order lookup validation and logging
   - Enhanced error response with stack traces in development

## Testing Instructions

### 1. Verify Environment Variables

Ensure these are set on your Onrender deployment:

```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
CLIENT_URL=https://restaurant-system-1-kuq6.onrender.com
STRIPE_CURRENCY=usd
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Test Online Payment Flow

1. Create an order with items
2. Navigate to payment page
3. Click "Pay Online"
4. Should redirect to Stripe checkout session successfully (no 500 error)
5. Check server logs for:
   - "=== CHECKOUT SESSION REQUEST ===" with order details
   - "Order found:" with item count and total
   - "Created Stripe session" confirmation

### 3. Debug 500 Errors

If you still see 500 errors, check the server logs for:

- "Stripe secret key not configured" → Set `STRIPE_SECRET_KEY` env var
- "Order not found" → Verify order exists in database
- "Order has no items" → Ensure order items array is populated
- "CLIENT_URL environment variable not configured" → Set `CLIENT_URL` env var
- Any other error message will be logged with full stack trace

## Related Files

- `server/app.js`: Payment routes configuration
- `client/src/redux/slices/paymentSlice.js`: Frontend payment thunk that calls this endpoint
- `client/src/pages/PaymentPage.jsx`: UI that triggers payment flow

## Previous Fixes Applied

This is part of the comprehensive payment flow fix that also addressed:

- ✅ Infinite reload loop on payment pages (useEffect toast dependency issues - fixed previously)
- ✅ Theme unification across user-facing pages (color variables applied)
- ✅ In-store payment flow (tested and working)
- 🔧 Online payment 500 error (THIS FIX)
- ⏳ End-to-end payment success validation (pending user testing)

## Status

✅ **COMPLETED** - All syntax errors fixed, environment variable validation enhanced, lazy initialization implemented
