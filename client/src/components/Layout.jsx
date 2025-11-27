import DesktopNav from "./desktopNav";
import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      <div className={` w-full flex justify-center md:block`}>
        <div className={`w-full  max-w-xl px-4 md:max-w-none md:px-0`}>
          {children}
        </div>
      </div>

      {!isAdmin && (
        <div className="w-full max-w-xl mx-auto h-20 flex justify-between items-center px-4 md:hidden">
          <Navbar />
        </div>
      )}
      {!isAdmin && <DesktopNav />}
    </div>
  );
}
