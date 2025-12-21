import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { NotificationProvider } from "../../context/NotificationContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";


const LayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="safe-area-top bg-default min-h-screen xl:flex dark:bg-gray-900">

      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-70" : ""
        }`}>
        <AppHeader />
        <div className="p-4 md:p-6 w-full">
          <Outlet />
        </div>
      </div>

      {/* Scroll to Top Button */}

    </div >
  );
};

const AppLayout = () => {
  return (
    <SidebarProvider>
      <NotificationProvider>
        <LayoutContent />
      </NotificationProvider>
    </SidebarProvider>
  );
};

export default AppLayout;

