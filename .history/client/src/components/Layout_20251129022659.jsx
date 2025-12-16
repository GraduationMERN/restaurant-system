import DesktopNav from "./desktopNav";
import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      <div className={`w-full flex justify-center md:block md:ml-64`}>
        <div className={`w-full max-w-xl px-4 py-6 md:max-w-none md:px-8 md:py-8`}>
          {children}
        </div>
      </div>

      {!isAdmin && (
        <div className="w-full max-w-xl mx-auto h-20 flex justify-between items-center px-4 md:hidden pb-4">
          <Navbar />
        </div>
      )}
      {!isAdmin && <DesktopNav />}
    </div>
  );
}