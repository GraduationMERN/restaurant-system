# Code Examples - Role-Based Order Management

## Using Role Hooks

### Example 1: Conditional Rendering Based on Role

```javascript
import { useRole } from "../../hooks/useRole";

export function Dashboard() {
  const { isAdmin, isCashier, isKitchen, isCustomer } = useRole();

  return (
    <div>
      {isAdmin && (
        <div>
          <h2>Admin Dashboard</h2>
          <p>Welcome Admin! You have full access.</p>
        </div>
      )}

      {isCashier && (
        <div>
          <h2>Cashier Dashboard</h2>
          <p>Create and manage direct orders</p>
        </div>
      )}

      {isKitchen && (
        <div>
          <h2>Kitchen Display System</h2>
          <p>Prepare orders and update status</p>
        </div>
      )}

      {isCustomer && (
        <div>
          <h2>My Orders</h2>
          <p>View your orders and track status</p>
        </div>
      )}
    </div>
  );
}
```

---

### Example 2: Route Protection

```javascript
import { useRole } from "./hooks/useRole";
import { Navigate } from "react-router-dom";

// Protected route component
export function ProtectedRoute({ component: Component, requiredRole }) {
  const { user } = useRole();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <Component />;
}

// Usage in routes
<Route
  path="/admin/orders"
  element={<ProtectedRoute component={AdminOrders} requiredRole="admin" />}
/>

<Route
  path="/admin/cashier"
  element={<ProtectedRoute component={CashierOrders} requiredRole={["cashier", "admin"]} />}
/>

<Route
  path="/admin/kitchen"
  element={<ProtectedRoute component={KitchenOrders} requiredRole={["kitchen", "admin"]} />}
/>
```

---

### Example 3: Conditional Actions Based on Role

```javascript
import { useRole } from "../../hooks/useRole";
import { useDispatch } from "react-redux";
import { updateOrderStatus } from "../../redux/slices/orderSlice";

export function OrderActions({ orderId, currentStatus }) {
  const dispatch = useDispatch();
  const { isAdmin, isCashier, isKitchen } = useRole();

  const handleStatusChange = (newStatus) => {
    dispatch(updateOrderStatus({ orderId, status: newStatus }));
  };

  return (
    <div className="flex gap-2">
      {/* Admin can do everything */}
      {isAdmin && (
        <>
          <button onClick={() => handleStatusChange("pending")}>
            Reset to Pending
          </button>
          <button onClick={() => handleStatusChange("preparing")}>
            Mark Preparing
          </button>
          <button onClick={() => handleStatusChange("ready")}>
            Mark Ready
          </button>
          <button onClick={() => handleStatusChange("completed")}>
            Mark Completed
          </button>
          <button onClick={() => handleStatusChange("canceled")}>
            Cancel Order
          </button>
        </>
      )}

      {/* Kitchen can only move forward */}
      {isKitchen && !isAdmin && (
        <>
          {currentStatus === "pending" && (
            <button onClick={() => handleStatusChange("preparing")}>
              Start Preparing
            </button>
          )}
          {currentStatus === "preparing" && (
            <button onClick={() => handleStatusChange("ready")}>
              Mark Ready
            </button>
          )}
          {currentStatus === "ready" && (
            <p className="text-success-600 font-semibold">Ready for Pickup</p>
          )}
        </>
      )}

      {/* Cashier can view but limited actions */}
      {isCashier && !isAdmin && (
        <>
          <button onClick={() => handleStatusChange("preparing")}>
            Notify Kitchen
          </button>
        </>
      )}
    </div>
  );
}
```

---

## Working with Redux Orders

### Example 4: Fetch and Display Admin Orders

```javascript
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllOrders,
  clearOrderMessages,
} from "../../redux/slices/orderSlice";
import { useRole } from "../../hooks/useRole";

export function AdminOrdersList() {
  const dispatch = useDispatch();
  const { isAdmin } = useRole();
  const { allOrders, loading, error, successMessage } = useSelector(
    (state) => state.order
  );

  useEffect(() => {
    // Fetch orders only if user is admin
    if (isAdmin) {
      dispatch(fetchAllOrders());
    }
  }, [dispatch, isAdmin]);

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearOrderMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p className="text-error-500">{error}</p>;

  return (
    <div>
      {successMessage && (
        <div className="bg-success-100 text-success-700 p-4 mb-4 rounded">
          {successMessage}
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {allOrders.map((order) => (
            <tr key={order._id}>
              <td>{order._id}</td>
              <td>{order.customerName}</td>
              <td>${order.totalAmount}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### Example 5: Create Direct Order (Cashier)

```javascript
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createDirectOrder,
  clearOrderMessages,
} from "../../redux/slices/orderSlice";

export function CreateDirectOrderForm() {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector(
    (state) => state.order
  );

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    items: [],
    totalAmount: 0,
  });

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", price: 0, quantity: 1 }],
    }));
  };

  const removeItem = (idx) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...form.items];
    newItems[idx][field] =
      field === "price" || field === "quantity"
        ? parseFloat(value) || 0
        : value;

    const total = newItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    setForm((prev) => ({
      ...prev,
      items: newItems,
      totalAmount: total,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.customerName.trim()) {
      alert("Customer name is required");
      return;
    }

    if (form.items.length === 0) {
      alert("Add at least one item");
      return;
    }

    dispatch(
      createDirectOrder({
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        items: form.items,
        totalAmount: form.totalAmount,
      })
    );

    // Reset form on success
    setForm({
      customerName: "",
      customerEmail: "",
      items: [],
      totalAmount: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="bg-error-100 text-error-700 p-3 rounded">{error}</div>
      )}

      {successMessage && (
        <div className="bg-success-100 text-success-700 p-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Customer Name *
          </label>
          <input
            type="text"
            value={form.customerName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customerName: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
            placeholder="John Doe"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={form.customerEmail}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customerEmail: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
            placeholder="john@example.com"
          />
        </div>
      </div>

      {/* Items */}
      <div>
        <label className="block text-sm font-medium mb-2">Items *</label>
        {form.items.length === 0 ? (
          <p className="text-gray-500 text-sm mb-2">No items added yet</p>
        ) : (
          <div className="space-y-2 mb-3">
            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => updateItem(idx, "name", e.target.value)}
                  className="border rounded px-2 py-1"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => updateItem(idx, "price", e.target.value)}
                  className="border rounded px-2 py-1"
                  step="0.01"
                  required
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  className="border rounded px-2 py-1"
                  min="1"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="bg-error-100 text-error-600 rounded px-2 py-1"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addItem}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm"
        >
          + Add Item
        </button>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
        <span className="font-semibold">Total:</span>
        <span className="text-lg font-bold text-brand-600">
          ${form.totalAmount.toFixed(2)}
        </span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-500 text-white py-2 rounded font-semibold disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Order"}
      </button>
    </form>
  );
}
```

---

### Example 6: Kitchen Display System

```javascript
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchActiveOrders,
  updateOrderStatus,
} from "../../redux/slices/orderSlice";

export function KitchenDisplaySystem() {
  const dispatch = useDispatch();
  const { activeOrders, loading } = useSelector((state) => state.order);
  const [filterStatus, setFilterStatus] = useState("pending");

  useEffect(() => {
    // Fetch orders immediately
    dispatch(fetchActiveOrders());

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      dispatch(fetchActiveOrders());
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const filteredOrders = activeOrders.filter((order) => {
    if (filterStatus === "all") {
      return ["pending", "preparing", "ready"].includes(order.status);
    }
    return order.status === filterStatus;
  });

  const handleStartPrep = (orderId) => {
    dispatch(updateOrderStatus({ orderId, status: "preparing" }));
  };

  const handleMarkReady = (orderId) => {
    dispatch(updateOrderStatus({ orderId, status: "ready" }));
  };

  return (
    <div className="p-6">
      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        {["pending", "preparing", "ready", "all"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded font-semibold ${
              filterStatus === status
                ? "bg-brand-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {status.toUpperCase()} ({filteredOrders.length})
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <div
            key={order._id}
            className={`p-4 rounded-lg border-2 ${
              order.status === "pending"
                ? "border-yellow-400 bg-yellow-50"
                : order.status === "preparing"
                ? "border-blue-400 bg-blue-50"
                : "border-green-400 bg-green-50"
            }`}
          >
            {/* Order Number - Large */}
            <h2 className="text-4xl font-bold mb-2">
              #{order._id?.substring(0, 6).toUpperCase()}
            </h2>

            {/* Customer Name */}
            {order.customerName && (
              <p className="text-lg font-semibold mb-3">
                {order.customerName.toUpperCase()}
              </p>
            )}

            {/* Items */}
            <div className="bg-white p-3 rounded mb-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">ITEMS:</p>
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between py-1 border-b last:border-0"
                >
                  <span className="font-medium">
                    {item.quantity}x {item.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Status & Actions */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Status:{" "}
                <span className="font-bold">{order.status.toUpperCase()}</span>
              </p>

              {order.status === "pending" && (
                <button
                  onClick={() => handleStartPrep(order._id)}
                  className="w-full bg-blue-500 text-white py-2 rounded font-bold text-lg"
                >
                  START PREPARING
                </button>
              )}

              {order.status === "preparing" && (
                <button
                  onClick={() => handleMarkReady(order._id)}
                  className="w-full bg-green-500 text-white py-2 rounded font-bold text-lg"
                >
                  MARK READY
                </button>
              )}

              {order.status === "ready" && (
                <p className="text-center bg-green-600 text-white py-2 rounded font-bold">
                  READY FOR PICKUP
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-center mt-6 text-gray-500">Updating...</p>}
      {!loading && filteredOrders.length === 0 && (
        <p className="text-center mt-6 text-gray-500">No orders to prepare</p>
      )}
    </div>
  );
}
```

---

## Best Practices

### 1. Always Check Role Before Sensitive Operations

```javascript
const { isAdmin } = useRole();

// Bad ❌
const handleDelete = (id) => {
  dispatch(deleteOrder(id));
};

// Good ✅
const handleDelete = (id) => {
  if (!isAdmin) {
    alert("Only admins can delete orders");
    return;
  }
  dispatch(deleteOrder(id));
};
```

### 2. Handle Loading and Error States

```javascript
const { loading, error } = useSelector((state) => state.order);

return (
  <>
    {loading && <Spinner />}
    {error && <ErrorAlert message={error} />}
    {!loading && !error && <Content />}
  </>
);
```

### 3. Auto-Refresh with Proper Cleanup

```javascript
useEffect(() => {
  dispatch(fetchOrders());

  const interval = setInterval(() => {
    dispatch(fetchOrders());
  }, 10000); // 10 seconds

  // Important: cleanup on unmount
  return () => clearInterval(interval);
}, [dispatch]);
```

### 4. Clear Messages After Display

```javascript
useEffect(() => {
  if (message) {
    const timer = setTimeout(() => {
      dispatch(clearOrderMessages());
    }, 3000);

    return () => clearTimeout(timer);
  }
}, [message, dispatch]);
```

---

These examples cover the most common use cases for your role-based order management system!
