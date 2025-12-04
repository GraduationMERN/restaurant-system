import DesktopNav from "./DesktopNav";
import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
   
       <div className="lg:mx-20 md:ml-20 min-h-screen bg-white pb-10 transition-all dark:bg-gray-900 dark:text-white select-none">
    
      {!isAdmin && <DesktopNav />}

      {/* Main content with correct spacing */}
      <div className="w-full flex">
        <div className="w-full px-0 md:px-0">
          {children}
        </div>
      </div>

      {/* Mobile bottom navbar */}
      {!isAdmin && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
            <div className="w-full h-16 flex justify-between items-center px-4">
              <Navbar />
            </div>
        </div>
      )}
  </div>

  );
}