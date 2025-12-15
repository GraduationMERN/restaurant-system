import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { NotificationProvider } from "../../context/NotificationContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex dark:bg-gray-900 ml-0">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1  transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}>
        <AppHeader />
        <div className="px-0 py-4 w-full md:px-0 md:py-6">
          <Outlet />
        </div>
      </div>
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
