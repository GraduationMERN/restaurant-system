import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className={`flex-grow w-full ${isAdmin ? "" : "flex justify-center"}`}>
        <div className={`w-full ${isAdmin ? "max-w-none px-0" : "max-w-xl px-4"}`}>
          {children}
        </div>
      </div>

      {!isAdmin && (
        <div className="w-full max-w-xl mx-auto h-20 flex justify-between items-center px-4">
          <Navbar />
        </div>
      )}
    </div>
  );
}
