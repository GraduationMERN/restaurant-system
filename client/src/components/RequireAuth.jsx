import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Simple RequireAuth that checks user role from redux state
export default function RequireAuth({ allowedRoles = [] }) {
  const user = useSelector(state => state.user?.current);
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    // redirect based on role
    if (user.role === 'super_admin') return <Navigate to="/supadmin" replace />;
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}
