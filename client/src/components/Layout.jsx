import DesktopNav from "./DesktopNav";
import Navbar from "./Navbar";
import Chatbot from "./chatbot/Chatbot";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const hiddenPaths = [
    "/admin",
    "/login",
    "/register",
    "/cashier",
    "/kitchen",
    "/reset-password",
    "/forgot-password",
    "/404"
  ];
  const shouldHideUI = hiddenPaths.some(path =>
    location.pathname.startsWith(path)
  );
  return (

    <div className={`lg:mx-5 min-h-screen pb-10 transition-all dark:bg-gray-900 dark:text-white select-none ${shouldHideUI ? "md:pl-0" : "md:pl-18"}`}>

      {!shouldHideUI && <DesktopNav />}

      {/* Main content with correct spacing */}
      <div className="w-full flex">
        <div className="w-full px-0 md:px-0">
          {children}
        </div>
      </div>

      {/* Mobile bottom navbar */}
      {!shouldHideUI && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-primary/60 z-[100000] dark:bg-gray-900 dark:text-white">
          <div className="w-full h-16 flex justify-between items-center px-4">
            <Navbar />
          </div>
        </div>
      )}
      {/* Hiding Chatbot */}
      {!shouldHideUI && <Chatbot />}
    </div>

  );
}
