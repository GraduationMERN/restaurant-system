import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useRole } from "../../hooks/useRole";

export default function ProtectedRoute({ children, roles = [] }) {
  const authState = useSelector((state) => state.auth || {});
  const { user, loadingGetMe } = authState;
  const { isAdmin, isCashier, isKitchen } = useRole();
  const location = useLocation(); 

  if (!user) {
    if (loadingGetMe || (typeof window !== 'undefined' && window.localStorage.getItem('hasSession') === 'true')) {
      return (
        <div className="p-8 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
   return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length === 0) return children;

  // Admins have full access
  if (isAdmin) {
    return children;
  }

  const allowed = roles.some((r) => {
    if (r === "cashier") return isCashier;
    if (r === "kitchen") return isKitchen;
    return false;
  });

  if (!allowed) {
    return <Navigate to="/404" replace />;
  }

  return children;
}
