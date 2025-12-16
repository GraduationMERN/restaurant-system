import DesktopNav from "./DesktopNav";
import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen">
      {/* Desktop horizontal navbar */}
      {!isAdmin && <DesktopNav />}

      {/* Main content */}
      <div className={`w-full flex justify-center ${!isAdmin ? "pt-16" : ""}`}>
        <div className="w-full max-w-xl px-4 md:max-w-none md:px-0">
          {children}
        </div>
      </div>

      {/* Mobile bottom navbar */}
      {!isAdmin && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
          <div className="w-full max-w-xl mx-auto h-16 flex justify-between items-center px-4">
            <Navbar />
          </div>
        </div>
      )}
    </div>
  );
}