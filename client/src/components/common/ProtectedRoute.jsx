import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useRole } from "../../hooks/useRole";

export default function ProtectedRoute({ children, roles = [] }) {
  const authState = useSelector((state) => state.auth || {});
  const { user, loadingGetMe } = authState;
  const { isAdmin, isCashier, isKitchen } = useRole();

  // Debug logs to help trace why access may be redirected
  // These will appear in the browser console when ProtectedRoute renders
  // (Useful while testing; remove when issue is confirmed resolved)
  // eslint-disable-next-line no-console
  console.log("[ProtectedRoute] authState:", authState);
  // eslint-disable-next-line no-console
  console.log("[ProtectedRoute] user:", user, "roles param:", roles, "isAdmin:", isAdmin, "isCashier:", isCashier, "isKitchen:", isKitchen);
  // eslint-disable-next-line no-console
  console.log("[ProtectedRoute] localStorage.hasSession:", typeof window !== 'undefined' ? window.localStorage.getItem('hasSession') : null, "loadingGetMe:", loadingGetMe);

  if (!user) {
    // If we are currently restoring the session (getMe), don't redirect yet — show a small loader
    if (loadingGetMe || (typeof window !== 'undefined' && window.localStorage.getItem('hasSession') === 'true')) {
      // eslint-disable-next-line no-console
      console.log('[ProtectedRoute] Waiting for session restore to complete (showing loader)');
      return (
        <div className="p-8 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    // eslint-disable-next-line no-console
    console.warn("[ProtectedRoute] No user in auth state — redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  if (roles.length === 0) return children;

  // Admins have full access
  if (isAdmin) {
    // eslint-disable-next-line no-console
    console.log("[ProtectedRoute] Access granted because user is admin");
    return children;
  }

  const allowed = roles.some((r) => {
    if (r === "cashier") return isCashier;
    if (r === "kitchen") return isKitchen;
    return false;
  });

  if (!allowed) {
    // eslint-disable-next-line no-console
    console.warn("[ProtectedRoute] Access denied — required roles:", roles);
    return <div className="p-8">Access Denied</div>;
  }

  return children;
}
