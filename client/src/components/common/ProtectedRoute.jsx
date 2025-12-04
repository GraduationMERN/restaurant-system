import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useRole } from "../../hooks/useRole";

export default function ProtectedRoute({ children, roles = [] }) {
  const { user } = useSelector((state) => state.auth || {});
  const { isAdmin, isCashier, isKitchen } = useRole();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length === 0) return children;

  // Admins have full access
  if (isAdmin) return children;

  const allowed = roles.some((r) => {
    if (r === "cashier") return isCashier;
    if (r === "kitchen") return isKitchen;
    return false;
  });

  if (!allowed) return <div className="p-8">Access Denied</div>;

  return children;
}
