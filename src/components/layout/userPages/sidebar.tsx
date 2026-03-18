// components/dashboard/DashboardSidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { type MenuItem } from '../../../config/navigationConfig';

interface DashboardSidebarProps {
  sidebarItems: MenuItem[];
  /** Mobile drawer open state */
  mobileOpen?: boolean;
  /** Called when the mobile drawer backdrop / close button is clicked */
  onMobileClose?: () => void;
}

export default function DashboardSidebar({
  sidebarItems,
  mobileOpen = false,
  onMobileClose,
}: DashboardSidebarProps) {
  const location = useLocation();

  if (!sidebarItems || sidebarItems.length === 0) return null;

  const navItems = sidebarItems.map((item) => {
    const isActive = location.pathname === item.link;
    return (
      <Link
        key={item.name}
        to={item.link || '#'}
        onClick={onMobileClose}
        aria-label={item.name}
        className={`
          relative group flex flex-col lg:flex-row items-center justify-start
          lg:justify-center w-full lg:w-14 h-auto lg:h-14
          px-4 lg:px-0 py-3 lg:py-0
          rounded-xl transition-all duration-200
          gap-3 lg:gap-0
          ${isActive
            ? 'bg-[#1e5292] text-white shadow-lg'
            : 'text-gray-300 hover:bg-white/10 hover:text-white'
          }
        `}
      >
        {/* Icon */}
        <span className="flex-shrink-0 w-6 h-6 lg:w-auto lg:h-auto flex items-center justify-center">
          {item.icon}
        </span>

        {/* Label — visible on mobile drawer only */}
        <span className="text-sm font-medium lg:hidden leading-tight">{item.name}</span>

        {/* Desktop tooltip */}
        <span className="
          hidden lg:block
          absolute left-full ml-4 px-3 py-2
          bg-gray-900 text-white text-sm rounded-lg
          whitespace-nowrap
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200 pointer-events-none z-50 shadow-xl
        ">
          {item.name}
          <span className="
            absolute right-full top-1/2 -translate-y-1/2
            border-8 border-transparent border-r-gray-900
          " />
        </span>

        {/* Active indicator */}
        {isActive && (
          <span className="
            absolute left-0 top-1/2 -translate-y-1/2
            w-1 h-8 bg-white rounded-r-full
          " />
        )}
      </Link>
    );
  });

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="w-20 bg-[#2c3e50] text-white min-h-screen hidden lg:block shadow-xl z-40 relative flex-shrink-0">
        <div className="h-3" />
        <div className="sticky top-20">
          <nav className="flex flex-col items-center py-4 space-y-2">
            {navItems}
          </nav>
        </div>
      </aside>

      {/* ── Mobile drawer ────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-[998] lg:hidden
          transition-opacity duration-300
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#2c3e50] text-white z-[999] lg:hidden
          shadow-2xl flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
          <span className="text-base font-semibold text-white">Navigation</span>
          <button
            onClick={onMobileClose}
            className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer nav items */}
        <nav className="flex flex-col py-3 px-2 space-y-1 overflow-y-auto flex-1">
          {navItems}
        </nav>
      </aside>
    </>
  );
}