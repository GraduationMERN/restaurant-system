import { Link } from "react-router-dom";
import { User } from "lucide-react";

export default function LoginButton({ isOpen }) {
  return (
    <Link
      to="/login"
      title="Login"
      className={`
        mt-auto mx-2 relative overflow-hidden
        flex items-center gap-3 font-semibold
        text-blue-600 dark:text-blue-400
        transition-all duration-300
        ${isOpen ? "px-4 py-3 rounded-xl" : "p-3 rounded-full justify-center"}
        group
      `}
    >
      {/* GLOW BACKGROUND */}
      <span
        className="
          absolute inset-0 opacity-0 group-hover:opacity-100
          bg-blue-600/15 rounded-xl blur-md
          transition-all duration-300
        "
      />

      {/* ICON */}
      <User
        size={20}
        className="relative z-10 group-hover:scale-110 transition-transform duration-300 group-hover:text-blue-700 dark:group-hover:text-blue-300"
      />

      {/* LABEL */}
      {isOpen && (
        <span className="relative z-10 text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300">
          Login
        </span>
      )}
    </Link>
  );
}
