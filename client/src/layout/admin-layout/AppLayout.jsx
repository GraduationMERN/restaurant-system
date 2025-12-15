import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { NotificationProvider } from "../../context/NotificationContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <div>
          <AppSidebar />
          <Backdrop />
        </div>
        
        {/* Main Content Area */}
        <div
          className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${
            isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
        >
          <AppHeader />
          
          {/* Mobile Controls Bar - Only on small/medium screens */}
          <div className="lg:hidden">
            <div className="px-4 py-3 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Mobile controls are now in the header for better UX */}
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-4 w-full md:px-6 md:py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
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