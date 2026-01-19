import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/supadmin', label: 'Dashboard' },
  { to: '/supadmin/restaurants', label: 'Restaurants' },
  { to: '/supadmin/subscriptions', label: 'Subscriptions' },
  { to: '/supadmin/users', label: 'Users' },
  { to: '/supadmin/analytics', label: 'Analytics' },
];

export default function SupAdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className={`flex-shrink-0 bg-gradient-to-b from-indigo-900 via-purple-800 to-purple-700 text-white ${collapsed ? 'w-20' : 'w-64'} transition-width duration-200`}>
        <div className="h-full flex flex-col">
          <div className="px-4 py-6 flex items-center justify-between">
            <div className={`text-lg font-bold ${collapsed ? 'text-center w-full' : ''}`}>BrandBite</div>
            <button onClick={() => setCollapsed(!collapsed)} className="ml-2 p-1 rounded hover:bg-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 px-2 pb-6">
            {navItems.map((item) => {
              const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
              return (
                <Link key={item.to} to={item.to} className={`flex items-center gap-3 rounded-md px-3 py-2 my-1 hover:bg-white/10 ${active ? 'bg-white/10' : ''}`}>
                  <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">{item.label[0]}</div>
                  {!collapsed && <span className="flex-1">{item.label}{item.label === 'Restaurants' && <span className="ml-2 inline-block bg-indigo-600 text-xs px-2 py-0.5 rounded">0</span>}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-white/10">
            {!collapsed && (
              <div className="text-sm">
                <div className="font-semibold">Super Admin</div>
                <div className="text-xs text-white/70">admin@platform.com</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded bg-gray-100" onClick={() => setCollapsed(!collapsed)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-lg font-semibold">SupAdmin</div>
          </div>

          <div className="flex items-center gap-4">
            <button className="px-3 py-1 rounded bg-indigo-600 text-white">Add New Restaurant</button>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded hover:bg-gray-100">🔔</button>
              <div className="flex items-center gap-2">
                <img src="/images/avatar-placeholder.png" alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                <button className="text-sm text-gray-700">Logout</button>
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="text-sm text-gray-600">Dashboard / <span className="font-medium">Overview</span></div>
        </div>

        {/* Content Outlet */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
