# Implementation Checklist - Role-Based Orders

## ✅ Completed Components

### Core Infrastructure

- [x] **useRole.js** - Custom hooks for role checking

  - `useRole()` - Get all role flags
  - `useHasRole()` - Check specific role(s)
  - `useIsStaff()` - Check if user is staff

- [x] **orderSlice.js** - Updated Redux slice
  - Added `fetchActiveOrders` thunk
  - All existing thunks preserved

### Page Components

- [x] **AdminOrders.jsx** - Refactored to use Redux

  - Fetch all orders from backend
  - Filter by status and date
  - Update order status
  - View order details
  - Export to CSV
  - Role protection (admin only)

- [x] **CashierOrders.jsx** - New cashier dashboard

  - Create direct orders (no cart)
  - View active orders
  - Auto-refresh every 10 seconds
  - Modal for order details
  - Form validation

- [x] **KitchenOrders.jsx** - New kitchen dashboard
  - View active orders only
  - Card-based layout (better for kitchen)
  - Status filters
  - Quick action buttons
  - Auto-refresh every 5 seconds
  - Role protection (kitchen only)

---

## 📋 What You Need to Do Next

### Step 1: Update Routes

Add these new routes to your route configuration:

```javascript
// In your admin routes configuration
import AdminOrders from "./pages/admin/Orders";
import CashierOrders from "./pages/admin/CashierOrders";
import KitchenOrders from "./pages/admin/KitchenOrders";
import { useRole } from "./hooks/useRole";

// In your Routes component:
{
  user?.role === "admin" && (
    <Route path="/admin/orders" element={<AdminOrders />} />
  );
}

{
  (user?.role === "cashier" || user?.role === "admin") && (
    <Route path="/admin/cashier-orders" element={<CashierOrders />} />
  );
}

{
  (user?.role === "kitchen" || user?.role === "admin") && (
    <Route path="/admin/kitchen-orders" element={<KitchenOrders />} />
  );
}
```

### Step 2: Update Navigation Menu

Add menu links in your admin sidebar based on roles:

```javascript
import { useRole } from "../hooks/useRole";

export function AdminMenu() {
  const { isAdmin, isCashier, isKitchen } = useRole();

  return (
    <nav>
      {isAdmin && (
        <>
          <NavLink to="/admin/orders">Orders Management</NavLink>
          <NavLink to="/admin/cashier-orders">Cashier</NavLink>
          <NavLink to="/admin/kitchen-orders">Kitchen</NavLink>
        </>
      )}
      {isCashier && !isAdmin && (
        <NavLink to="/admin/cashier-orders">My Orders</NavLink>
      )}
      {isKitchen && !isAdmin && (
        <NavLink to="/admin/kitchen-orders">Kitchen</NavLink>
      )}
    </nav>
  );
}
```

### Step 3: Export Role Hooks

Make sure the hooks are exported from your hooks folder:

```javascript
// In client/src/hooks/index.js (create if needed)
export { useRole, useHasRole, useIsStaff } from "./useRole";
```

### Step 4: Test Each Role

Create test accounts with each role in your database:

```javascript
// Admin user
{ name: "Admin", email: "admin@restaurant.com", role: "admin" }

// Cashier user
{ name: "Cashier", email: "cashier@restaurant.com", role: "cashier" }

// Kitchen user
{ name: "Kitchen", email: "kitchen@restaurant.com", role: "kitchen" }

// Customer user
{ name: "Customer", email: "customer@restaurant.com", role: "customer" }
```

### Step 5: Verify Backend

Ensure these endpoints work correctly:

```
✓ GET /api/orders (requires cashier/admin role)
✓ GET /api/orders/kitchen/active (requires cashier/admin/kitchen role)
✓ POST /api/orders/direct (requires cashier/admin role)
✓ PATCH /api/orders/:id/status (requires cashier/admin role)
```

---

## 🎯 Feature Breakdown

### Admin Dashboard (/admin/orders)

| Feature          | Status | Notes                      |
| ---------------- | ------ | -------------------------- |
| View all orders  | ✅     | Uses Redux fetchAllOrders  |
| Filter by status | ✅     | 5 status options           |
| Filter by date   | ✅     | Date picker                |
| Update status    | ✅     | Real-time sync             |
| View details     | ✅     | Modal popup                |
| Export CSV       | ✅     | Downloads file             |
| Delete order     | ❌     | Disabled - not implemented |

### Cashier Dashboard (/admin/cashier-orders)

| Feature             | Status | Notes                    |
| ------------------- | ------ | ------------------------ |
| Create direct order | ✅     | Form with items          |
| View active orders  | ✅     | Filters to pending/ready |
| Add multiple items  | ✅     | Dynamic form             |
| Calculate total     | ✅     | Automatic                |
| View order details  | ✅     | Modal popup              |
| Auto-refresh        | ✅     | Every 10 seconds         |

### Kitchen Dashboard (/admin/kitchen-orders)

| Feature            | Status | Notes               |
| ------------------ | ------ | ------------------- |
| View active orders | ✅     | Card layout         |
| Filter by status   | ✅     | Buttons at top      |
| Start preparing    | ✅     | pending → preparing |
| Mark ready         | ✅     | preparing → ready   |
| View details       | ✅     | Modal popup         |
| Auto-refresh       | ✅     | Every 5 seconds     |

---

## 🔄 Order Status Workflow

```
Cashier Creates Order (direct)
        ↓
   Kitchen Sees It (pending)
        ↓
   Kitchen Clicks "Start Preparing" (preparing)
        ↓
   Kitchen Clicks "Mark Ready" (ready)
        ↓
   Admin Can Mark Complete (completed)
```

---

## 📊 Redux State Usage

All components use `useSelector` to get state:

```javascript
// In any component
const { allOrders, activeOrders, loading, error, successMessage } = useSelector(
  (state) => state.order
);

// Dispatch actions
const dispatch = useDispatch();
dispatch(fetchAllOrders());
dispatch(fetchActiveOrders());
dispatch(updateOrderStatus({ orderId, status }));
dispatch(createDirectOrder(payload));
```

---

## 🛡️ Security Features

1. **Frontend Guards:** `useRole()` prevents UI access
2. **Backend Validation:** API requires role middleware
3. **Token-Based:** JWT in cookies contains role
4. **Access Control:** Each endpoint checks permissions

---

## ⚠️ Known Limitations

1. **Delete Order:** Not implemented in current pages
2. **Edit Order:** Cannot modify after creation
3. **Real-time Sync:** Uses polling (10s/5s), not WebSocket
4. **Offline:** No offline support
5. **Notifications:** No push notifications

---

## 🚀 Quick Start Testing

1. **Login as Admin**

   - Go to `/admin/orders`
   - See all orders
   - Try updating status
   - Export CSV

2. **Login as Cashier**

   - Go to `/admin/cashier-orders`
   - Click "Create Direct Order"
   - Add items and submit
   - See order appear in active list

3. **Login as Kitchen**
   - Go to `/admin/kitchen-orders`
   - See active orders (pending/preparing)
   - Click "Start Preparing"
   - Click "Mark Ready"
   - See status update

---

## 📝 Notes

- All orders fetch from MongoDB backend
- Status updates sync in real-time (if backend updated correctly)
- Components use Redux for state (not local state)
- All forms include error handling and loading states
- Mobile responsive design included
- Dark mode support included

---

## 🔧 Customization Options

You can customize:

- Status options (add new statuses)
- Auto-refresh intervals (10s for cashier, 5s for kitchen)
- Table columns (add/remove fields)
- Card layout (change grid size)
- Form fields (add more order details)
- Styling (tailwind classes)

---

## 💡 Tips

1. Use Redux DevTools to debug state changes
2. Check browser network tab to verify API calls
3. Test with mock data if backend not ready
4. Use React DevTools to verify hook values
5. Test role switching by changing user in database

---

## 📞 Common Issues

**Issue:** "Access Denied" message appears

- **Solution:** Check user role in database

**Issue:** No orders showing

- **Solution:** Check backend API returns data

**Issue:** Status update not working

- **Solution:** Verify backend endpoint `/api/orders/:id/status`

**Issue:** Form not submitting

- **Solution:** Check all required fields filled (customer name, items)

---

## Summary

You now have a complete role-based order management system with:

- ✅ Admin can manage all orders
- ✅ Cashier can create direct orders
- ✅ Kitchen can prepare orders
- ✅ All with Redux state management
- ✅ Auto-refreshing active orders
- ✅ Role-based access control
- ✅ Real-time status updates

Next step: Add routes and test with different user roles!
