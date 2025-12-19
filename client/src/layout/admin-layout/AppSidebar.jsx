import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import { ChevronDownIcon, GridIcon, HorizontaLDots, UserCircleIcon, BoxIconLine, TaskIcon, ShootingStarIcon, DollarLineIcon, SettingsGearIcon, GroupIcon } from "../../icons/admin-icons";
import { useSidebar } from "../../context/SidebarContext";
import { useSettings } from "../../context/SettingContext";

const navItems = [
  { icon: <GridIcon />, name: "Dashboard", path: "/admin/dashboard" },
  { icon: <BoxIconLine />, name: "Orders", path: "/admin/orders" },
  { icon: <TaskIcon />, name: "Menu Management", path: "/admin/menu" },
  { icon: <TaskIcon />, name: "Categories", path: "/admin/categories" },
  { icon: <ShootingStarIcon />, name: "Reviews", path: "/admin/reviews" },
  { icon: <DollarLineIcon />, name: "Rewards", path: "/admin/rewards" },
  { icon: <DollarLineIcon />, name: "Reward Orders", path: "/admin/reward-orders" },
  { icon: <DollarLineIcon />, name: "Offers", path: "/admin/offers" },
  { icon: <DollarLineIcon />, name: "Coupons", path: "/admin/coupons" },
  { icon: <UserCircleIcon />, name: "Users", path: "/admin/users" },
  { icon: <BoxIconLine />, name: "Kitchen", path: "/kitchen" },
  { icon: <GroupIcon />, name: "Cashier", path: "/cashier" },
  { icon: <SettingsGearIcon />, name: "Settings", path: "/admin/settings" },
];

const othersItems = [];

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { settings } = useSettings();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({});

  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType, index });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index, menuType) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items, menuType) => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              } ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "text-brand-500 dark:text-brand-400"
                    : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="ml-3">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500 dark:text-brand-400"
                      : "text-gray-400"
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                onClick={() => { if (isMobileOpen) toggleMobileSidebar(); }}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive(nav.path)
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                } ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                  }`}
              >
                <span
                  className={`flex items-center justify-center w-5 h-5 ${
                    isActive(nav.path)
                      ? "text-brand-500 dark:text-brand-400"
                      : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="ml-3">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="py-2 space-y-1 ml-11">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      onClick={() => { if (isMobileOpen) toggleMobileSidebar(); }}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive(subItem.path)
                          ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-900/10"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              isActive(subItem.path)
                                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              isActive(subItem.path)
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed flex flex-col top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out z-50
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }
        lg:translate-x-0 lg:top-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo - Hidden on small and medium screens (below lg) */}
      <div className={`hidden lg:flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-800 ${
        !isExpanded && !isHovered ? "lg:justify-center" : "justify-between"
      }`}>
        <div className="flex items-center gap-2">
          {isExpanded || isHovered ? (
            <>
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 shadow-sm flex-shrink-0">
                <img
                  src={settings.branding?.logoUrl || "/images/logo/logo.svg"}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                  {settings.restaurantName || "Restaurant"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</span>
              </div>
            </>
          ) : (
            <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 shadow-sm">
              <img
                src={settings.branding?.logoUrl || "/images/logo/logo-icon.svg"}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        {(isExpanded || isHovered) && (
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white text-gray-600 dark:text-gray-400 transition-all duration-200 group"
            title="Open Site"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      {/* Alternative: Show minimal logo on mobile when sidebar is open */}
      {isMobileOpen && (
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 shadow-sm">
              <img
                src={settings.branding?.logoUrl || "/images/logo/logo-icon.svg"}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {settings.restaurantName || "Restaurant"}
            </span>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white text-gray-600 dark:text-gray-400 transition-all duration-200"
            title="Open Site"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 lg:py-6">
        <nav className="space-y-6">
          <div>
            <h2
              className={`mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
                !isExpanded && !isHovered ? "lg:hidden" : "px-4"
              }`}
            >
              {isExpanded || isHovered || isMobileOpen ? (
                "Menu"
              ) : (
                <div className="flex justify-center">
                  <HorizontaLDots className="w-5 h-5" />
                </div>
              )}
            </h2>
            {renderMenuItems(navItems, "main")}
          </div>
          
          {othersItems.length > 0 && (
            <div>
              <h2
                className={`mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:hidden" : "px-4"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <div className="flex justify-center">
                    <HorizontaLDots className="w-5 h-5" />
                  </div>
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;