# Role-Based Order Management System - Implementation Guide

## Overview

This document explains the role-based order management system implemented for your restaurant dashboard, supporting **Admin**, **Cashier**, **Kitchen**, and **Customer** roles.

---

## Architecture

### 1. **Role Definition (Server-Side)**

Defined in `server/src/modules/user/model/User.js`:

```javascript
role: {
  type: String,
  enum: ["customer", "cashier", "kitchen", "admin"],
  default: "customer",
}
```

### 2. **Role-Based Utilities (Client-Side)**

Location: `client/src/hooks/useRole.js`

```javascript
// Hook to get user roles
useRole(); // Returns { isAdmin, isCashier, isKitchen, isCustomer, user }

// Hook to check specific role(s)
useHasRole(requiredRoles); // Pass string or array of roles

// Hook to check if user is staff
useIsStaff(); // Returns true if cashier or admin
```

### 3. **Redux State Management**

Location: `client/src/redux/slices/orderSlice.js`

New thunks added:

- `fetchActiveOrders()` - For kitchen/cashier to see active orders
- Existing thunks already support role-based operations

---

## Role-Based Functionality

### **ADMIN**

**Access Level:** Full control

**Pages:**

- `/admin/orders` - View all orders, update status, export CSV

**Capabilities:**

- ✅ View all orders (all statuses)
- ✅ Update order status (pending → preparing → ready → completed)
- ✅ View order details
- ✅ Export orders to CSV
- ✅ View cashier direct orders
- ✅ Create direct orders (cashier function)

**Key Component:** `client/src/pages/admin/Orders.jsx`

---

### **CASHIER**

**Access Level:** Create and manage direct orders

**Pages:**

- `/admin/cashier-orders` - Create direct orders, view active orders

**Capabilities:**

- ✅ Create direct orders (without cart)
  - Customer name
  - Optional email
  - Multiple items with prices
  - Automatic total calculation
- ✅ View active orders (pending/preparing/ready)
- ✅ View order details
- ✅ Auto-refresh orders every 10 seconds

**Key Component:** `client/src/pages/admin/CashierOrders.jsx`

**Direct Order Payload:**

```javascript
{
  customerName: string,    // Required
  customerEmail: string,   // Optional
  items: [                 // Required (min 1)
    {
      name: string,
      price: number,
      quantity: number
    }
  ],
  totalAmount: number      // Auto-calculated
}
```

---

### **KITCHEN**

**Access Level:** Prepare orders only

**Pages:**

- `/admin/kitchen-orders` - View and prepare active orders

**Capabilities:**

- ✅ View only active orders (pending/preparing/ready)
- ✅ Update order status:
  - pending → preparing
  - preparing → ready
- ✅ View order details and items
- ✅ Filter by status
- ✅ Auto-refresh orders every 5 seconds
- ❌ Cannot create orders
- ❌ Cannot cancel orders
- ❌ Cannot mark as completed

**Key Component:** `client/src/pages/admin/KitchenOrders.jsx`

**Features:**

- Card-based layout (not table) for better kitchen UX
- Large status badges
- Item list with quantities
- Quick action buttons
- Color-coded by status

---

### **CUSTOMER**

**Access Level:** View own orders only

**Pages:**

- Regular checkout and tracking pages
- Cannot access admin/staff pages

---

## File Structure

```
client/src/
├── hooks/
│   └── useRole.js                    # New: Role checking hooks
│
├── redux/slices/
│   └── orderSlice.js                 # Updated: Added fetchActiveOrders thunk
│
└── pages/admin/
    ├── Orders.jsx                    # Updated: Admin orders page (Redux)
    ├── CashierOrders.jsx             # New: Cashier orders page
    └── KitchenOrders.jsx             # New: Kitchen orders page
```

---

## Implementation Steps

### 1. **Update Routes** (If using separate admin routes)

In your route configuration, add guards using `useRole()`:

```javascript
// Example route configuration
import { useRole } from "../hooks/useRole";

// In your routing component:
const { isAdmin, isCashier, isKitchen } = useRole();

// Admin routes
{
  isAdmin && <Route path="/admin/orders" component={AdminOrders} />;
}

// Cashier routes
{
  (isCashier || isAdmin) && (
    <Route path="/admin/cashier-orders" component={CashierOrders} />
  );
}

// Kitchen routes
{
  (isKitchen || isAdmin) && (
    <Route path="/admin/kitchen-orders" component={KitchenOrders} />
  );
}
```

### 2. **Update Navigation** (Admin sidebar/menu)

Show different menu items based on role:

```javascript
import { useRole } from "../../hooks/useRole";

export function AdminNav() {
  const { isAdmin, isCashier, isKitchen } = useRole();

  return (
    <nav>
      {isAdmin && <NavLink to="/admin/orders">Orders</NavLink>}
      {(isCashier || isAdmin) && (
        <NavLink to="/admin/cashier-orders">Cashier</NavLink>
      )}
      {(isKitchen || isAdmin) && (
        <NavLink to="/admin/kitchen-orders">Kitchen</NavLink>
      )}
    </nav>
  );
}
```

### 3. **Use Role Hooks in Components**

```javascript
import { useRole } from "../../hooks/useRole";

export function SomeComponent() {
  const { isAdmin, isCashier, isKitchen } = useRole();

  return (
    <>
      {isAdmin && <AdminPanel />}
      {isCashier && <CashierPanel />}
      {isKitchen && <KitchenPanel />}
    </>
  );
}
```

---

## Order Status Flow

```
pending (new order)
   ↓ (Kitchen starts)
preparing (kitchen preparing)
   ↓ (Kitchen finishes)
ready (waiting for pickup)
   ↓ (Customer pickup or delivery)
completed (order done)

   Or at any point:
   ↓
canceled (order canceled)
```

---

## Redux State Structure

```javascript
{
  order: {
    userOrders: [],        // Customer's orders
    allOrders: [],         // All orders (admin only)
    activeOrders: [],      // Active orders (kitchen/cashier)
    singleOrder: null,     // Currently viewing order
    loading: false,
    error: null,
    successMessage: null
  }
}
```

---

## Backend Integration

Your backend already has:

✅ **Order Routes:**

- `GET /api/orders` - Fetch all (admin, cashier)
- `GET /api/orders/kitchen/active` - Fetch active orders
- `POST /api/orders/direct` - Create direct order (cashier, admin)
- `PATCH /api/orders/:id/status` - Update status (cashier, admin)

✅ **Middleware:**

- `roleMiddleware("cashier", "admin")` - Protect cashier/admin routes
- Backend enforces role restrictions

---

## Common Tasks

### Create Direct Order (Cashier)

```javascript
import { useDispatch } from "react-redux";
import { createDirectOrder } from "../../redux/slices/orderSlice";

function CreateOrder() {
  const dispatch = useDispatch();

  const handleCreate = () => {
    dispatch(
      createDirectOrder({
        customerName: "John Doe",
        customerEmail: "john@example.com",
        items: [
          { name: "Burger", price: 10.99, quantity: 2 },
          { name: "Fries", price: 3.99, quantity: 1 },
        ],
        totalAmount: 25.97,
      })
    );
  };

  return <button onClick={handleCreate}>Create Order</button>;
}
```

### Update Order Status (Admin/Kitchen)

```javascript
import { useDispatch } from "react-redux";
import { updateOrderStatus } from "../../redux/slices/orderSlice";

function UpdateStatus() {
  const dispatch = useDispatch();

  const handleUpdate = (orderId) => {
    dispatch(
      updateOrderStatus({
        orderId,
        status: "preparing", // or "ready", "completed"
      })
    );
  };

  return (
    <button onClick={() => handleUpdate("order123")}>Start Preparing</button>
  );
}
```

### Fetch Active Orders (Kitchen/Cashier)

```javascript
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveOrders } from "../../redux/slices/orderSlice";
import { useEffect } from "react";

function ActiveOrders() {
  const dispatch = useDispatch();
  const { activeOrders } = useSelector(state => state.order);

  useEffect(() => {
    dispatch(fetchActiveOrders());
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      dispatch(fetchActiveOrders());
    }, 10000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return <div>{activeOrders.map(order => ...)}</div>;
}
```

---

## Security Notes

1. **Backend Validation:** Always rely on backend `roleMiddleware` for authorization
2. **Frontend Guard:** Use `useRole()` for UI visibility only, not security
3. **Token:** Access token in cookies contains user info with role
4. **Admin Override:** Admins bypass all restrictions - use carefully

---

## Testing Checklist

- [ ] Admin can see all orders and update status
- [ ] Cashier can create direct orders
- [ ] Cashier cannot see completed orders from past
- [ ] Kitchen can only see pending/preparing/ready orders
- [ ] Kitchen cannot create or delete orders
- [ ] Status transitions work correctly
- [ ] Export CSV works (admin only)
- [ ] Role checks prevent unauthorized access
- [ ] Orders auto-refresh in kitchen/cashier views

---

## Future Enhancements

1. **Order Notifications:** WebSocket for real-time updates
2. **Print Kitchen Tickets:** Direct thermal printer integration
3. **Time Tracking:** Measure prep time per order
4. **Customer Display System:** Show order readiness
5. **Analytics:** Orders per hour, average prep time
6. **Queue Management:** Priority orders, special requests
7. **Staff Management:** Assign chef to order

---

## Support

For questions about:

- **Role checking:** See `useRole.js`
- **Order API:** See `server/src/modules/order.module/order.routes.js`
- **Redux state:** See `orderSlice.js`
- **Components:** Check `AdminOrders.jsx`, `CashierOrders.jsx`, `KitchenOrders.jsx`
