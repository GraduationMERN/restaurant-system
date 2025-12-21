import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { NotificationProvider } from "../../context/NotificationContext";
import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";


const LayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // RTL: use margin-right instead of margin-left
  const marginClass = isRTL
    ? isExpanded || isHovered ? "lg:mr-[290px]" : "lg:mr-[90px]"
    : isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";

  return (
    <div className="safe-area-top bg-default min-h-screen xl:flex dark:bg-gray-900">

      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${marginClass}`}>
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
