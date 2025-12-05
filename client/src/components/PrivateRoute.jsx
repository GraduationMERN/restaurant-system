import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PrivateRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated, loadingGetMe } = useSelector(
    (state) => state.auth
  );

  // 1. While checking token from server
  if (loadingGetMe) return <div>Loading...</div>;

  // 2. User not logged in
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // 3. Role check (prevent crash from user = null)
  if (
    allowedRoles.length > 0 &&
    (!user?.role || !allowedRoles.includes(user?.role))
  ) {
    return <Navigate to="/" replace />;
  }

  // 4. Pass
  return <Outlet />;
}
