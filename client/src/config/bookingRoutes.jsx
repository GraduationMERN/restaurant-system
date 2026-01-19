/**
 * Table Booking Routes Setup
 * 
 * This file provides routing configuration for the table booking module.
 * Import these routes in your App.jsx or main routing file.
 * 
 * Example usage in App.jsx:
 * ```jsx
 * import { bookingRoutes } from './config/bookingRoutes';
 * 
 * // Inside your Routes component:
 * {bookingRoutes.map(route => (
 *   <Route key={route.path} {...route} />
 * ))}
 * ```
 */

import { CustomerBookingPage } from "../pages/CustomerBookingPage";
import { AdminTableManagementPage } from "../pages/AdminTableManagementPage";
import { CashierManagementPage } from "../pages/CashierManagementPage";
import PrivateRoute from "../components/PrivateRoute";

/**
 * Booking Module Routes
 * These routes are organized by role for better access control
 */
export const bookingRoutes = [
  // Customer Routes
  {
    path: "/booking",
    element: (
      <PrivateRoute requiredRole="customer">
        <CustomerBookingPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/bookings/customer",
    element: (
      <PrivateRoute requiredRole="customer">
        <CustomerBookingPage />
      </PrivateRoute>
    ),
  },

  // Admin Routes
  {
    path: "/admin/tables",
    element: (
      <PrivateRoute requiredRole={["admin", "super-admin"]}>
        <AdminTableManagementPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/table-management",
    element: (
      <PrivateRoute requiredRole={["admin", "super-admin"]}>
        <AdminTableManagementPage />
      </PrivateRoute>
    ),
  },

  // Cashier Routes
  {
    path: "/cashier/bookings",
    element: (
      <PrivateRoute requiredRole="cashier">
        <CashierManagementPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/cashier/dashboard",
    element: (
      <PrivateRoute requiredRole="cashier">
        <CashierManagementPage />
      </PrivateRoute>
    ),
  },
];

/**
 * Navigation Links for Different Roles
 * Use these in your navigation components
 */
export const bookingNavLinks = {
  customer: [
    {
      path: "/booking",
      label: "Book a Table",
      icon: "BookOpen",
    },
  ],
  admin: [
    {
      path: "/admin/tables",
      label: "Table Management",
      icon: "Grid",
    },
  ],
  cashier: [
    {
      path: "/cashier/bookings",
      label: "Bookings",
      icon: "Calendar",
    },
  ],
  "super-admin": [
    {
      path: "/admin/tables",
      label: "Table Management",
      icon: "Grid",
    },
  ],
};

/**
 * Protected Route Component
 * Wraps routes that require specific roles
 * 
 * Usage in your routing:
 * ```jsx
 * <Route 
 *   path="/admin/tables" 
 *   element={
 *     <ProtectedBookingRoute requiredRole="admin">
 *       <AdminTableManagementPage />
 *     </ProtectedBookingRoute>
 *   } 
 * />
 * ```
 */
export const ProtectedBookingRoute = ({ children, requiredRole }) => {
  const userRole = localStorage.getItem("userRole"); // Adjust based on your auth
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!roles.includes(userRole)) {
    return <div className="p-8"><p>You don't have permission to access this page.</p></div>;
  }

  return children;
};

export default bookingRoutes;
