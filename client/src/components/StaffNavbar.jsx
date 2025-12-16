import { useDispatch, useSelector } from "react-redux";
import { logoutUser, logout } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function StaffNavbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth || {});

  async function handleSignOut() {
    try {
      await dispatch(logoutUser());
      dispatch(logout());
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex items-center justify-between w-full px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {user?.role === 'cashier' ? 'Cashier Dashboard' : 'Kitchen Dashboard'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Welcome, {user?.name || 'Staff'}
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}