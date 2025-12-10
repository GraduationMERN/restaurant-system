import DesktopNav from "./desktopNav";
import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      <div className={`w-full flex justify-center md:block`}>
        <div className={`w-full max-w-xl px-4 py-6 md:max-w-4xl md:px-8 md:pt-[calc(10vh+7rem)] md:pb-8`}>
          {children}
        </div>
      </div>

      {!isAdmin && (
        <div className="md:hidden pb-4">
          {/* Mobile navbar is now in bottom as before */}
        </div>
      )}
      {!isAdmin && <DesktopNav />}
    </div>
  );
}