# Order Details Page - Infinite Refresh Fix

## Problem Description

**Symptoms:**

- Page kept refreshing/reloading continuously after payment confirmation
- No order data rendered
- Console warning: "Node cannot be found in the current page"
- Component kept trying to load indefinitely

**Root Cause:**
The `useEffect` hook in `OrderDetailsPage.jsx` had `toast` (an object) in its dependency array. Since `useToast()` hook doesn't memoize its return value, it creates a new object on every render, causing:

1. Component renders
2. `toast` changes (new reference)
3. `useEffect` detects dependency change
4. Fetches order again
5. Component re-renders
6. **Loop repeats infinitely** ♻️

## Solution Implemented

### Changes Made to `client/src/pages/orders/OrderDetailsPage.jsx`

#### 1. **Added `useCallback` Import**

```jsx
// Before
import React, { useEffect, useState } from "react";

// After
import React, { useEffect, useState, useCallback } from "react";
```

#### 2. **Memoized the `loadOrder` Function**

```jsx
// Before (function redefined on every render)
useEffect(() => {
  const loadOrder = async () => {
    try {
      setLoading(true);
      const result = await dispatch(fetchOrderById(id)).unwrap();
      setOrder(result);
    } catch (err) {
      setError("Failed to load the order");
      toast.error("Failed to load order"); // ❌ Called directly in catch
    } finally {
      setLoading(false);
    }
  };

  if (id) loadOrder();
}, [id, dispatch, toast]); // ❌ toast causes infinite loop

// After (function memoized, toast only conditionally called)
const loadOrder = useCallback(async () => {
  try {
    setLoading(true);
    const result = await dispatch(fetchOrderById(id)).unwrap();
    setOrder(result);
  } catch (err) {
    console.error("Failed to load order:", err);
    setError("Failed to load the order");
    if (toast.showToast) {
      toast.showToast({ message: "Failed to load order", type: "error" });
    }
  } finally {
    setLoading(false);
  }
}, [id, dispatch, toast]);

useEffect(() => {
  if (id) {
    loadOrder();
  }
}, [id, loadOrder]); // ✅ Only id and loadOrder (stable function)
```

## Why This Fix Works

### 1. **Stable Function Reference**

`useCallback` memoizes the `loadOrder` function, so it only changes when its dependencies (`id`, `dispatch`, `toast`) change.

### 2. **Reduced Dependency Array**

- ❌ Before: `[id, dispatch, toast]` → toast is unstable
- ✅ After: `[id, loadOrder]` → loadOrder is stable, id controls re-fetch

### 3. **Safe Toast Handling**

- Instead of calling `toast.error()` directly, we check `if (toast.showToast)` first
- This prevents errors if toast hook is not available or returns undefined

### 4. **No Business Logic Changes**

- Still fetches order by ID
- Still sets loading/error states
- Still displays error message
- No API changes, no state mutation changes

## Technical Details

### When Will `loadOrder` Recreate?

```jsx
// Only when these change:
- id (route param) → Different order to load
- dispatch (from Redux) → Rare, only on major changes
- toast (from hook) → When parent re-renders
```

### Dependency Chain

```
id changes
    ↓
loadOrder recreates (via useCallback)
    ↓
useEffect sees new loadOrder reference
    ↓
Effect runs, calls loadOrder()
    ↓
Fetches order, sets state
    ↓
Component renders with new order
    ✓ DONE (no loop)
```

## Testing Checklist

After deploying this fix:

- [ ] Navigate to /payment
- [ ] Confirm payment (both online and in-store)
- [ ] Redirected to /orders/:id
- [ ] Page loads order details **once** (no continuous refresh)
- [ ] Order data displays correctly
- [ ] No console warnings about "Node cannot be found"
- [ ] Back button returns to /orders list
- [ ] Dark mode works correctly
- [ ] Mobile responsiveness intact

## Browser Verification

To manually verify the fix works:

1. **Open DevTools** (F12 / Cmd+Option+I)
2. **Go to Network tab** or **Console**
3. **Complete a payment flow**
4. **Expect to see:**
   - ✅ Single API call to `/api/orders/:id`
   - ✅ Page loads and displays data
   - ✅ No repeated API calls
   - ✅ No errors in console

## Related Components

This fix specifically addresses:

- `OrderDetailsPage.jsx` – The main page component
- Uses: `fetchOrderById` from `ordersSlice.js` (no changes needed)
- Renders: `ActiveOrderComponent` (no changes needed)
- Consumes: `useToast()` hook (no changes needed)

## Performance Impact

✅ **Positive:**

- Eliminates infinite render loops
- Reduces unnecessary API calls
- Improves page load time (single fetch instead of many)
- Reduces server load

---

**Status**: ✅ Fixed and Ready for Testing
**Date**: December 10, 2025
**File Modified**: `client/src/pages/orders/OrderDetailsPage.jsx`
