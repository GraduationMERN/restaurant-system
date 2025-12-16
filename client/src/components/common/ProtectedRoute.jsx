import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children, roles = [] }) {
  const authState = useSelector((state) => state.auth || {});
  const { user, loadingGetMe } = authState;

  if (!user) {
    if (loadingGetMe || (typeof window !== 'undefined' && window.localStorage.getItem('hasSession') === 'true')) {
      return (
        <div className="p-8 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return <Navigate to="/login" replace />;
  }

  // For demo: allow all authenticated users access to everything
  return children;
}
