import { useDispatch } from "react-redux";
import { logout, logoutUser } from "../../../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function LogoutButton({ isOpen }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      dispatch(logout());
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <button
      onClick={handleLogout}
      title="Logout"
      className={`
        mt-auto mx-2 relative overflow-hidden
        flex items-center gap-3 font-semibold
        text-red-600 dark:text-red-400
        transition-all duration-300
        ${isOpen ? "px-4 py-3 rounded-xl" : "p-3 rounded-full justify-center"}

        group
      `}
    >
      {/* GLOW BACKGROUND */}
      <span
        className="
          absolute inset-0 opacity-0 group-hover:opacity-100
          bg-red-600/15 rounded-xl blur-md
          transition-all duration-300
        "
      />

      {/* ICON */}
      <LogOut
        size={20}
        className="relative z-10 group-hover:scale-110 transition-transform duration-300 group-hover:text-red-700 dark:group-hover:text-red-300"
      />

      {/* LABEL (only when sidebar expanded) */}
      {isOpen && (
        <span className="relative z-10 text-sm group-hover:text-red-700 dark:group-hover:text-red-300">
          Logout
        </span>
      )}
    </button>
  );
}
