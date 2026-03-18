// components/dashboard/DashboardNavbar.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../../../services';
import type { MenuItem, UserRole } from '../../../config/navigationConfig';
import NotificationBell from '../../common/Notification/NotificationBell';

interface DashboardNavbarProps {
  userName?: string;
  userEmail?: string;
  userRole: UserRole;
  userProfilePicture?: string;
  navbarItems: MenuItem[];
  /** Sidebar items — displayed in the mobile menu below nav items */
  sidebarItems?: MenuItem[];
  /** Callback to open the mobile sidebar drawer */
  onOpenSidebar?: () => void;
  hasSidebar?: boolean;
}

export default function DashboardNavbar({
  userName = "John Doe",
  userEmail = "john.doe@example.com",
  userRole,
  userProfilePicture,
  navbarItems,
  sidebarItems = [],
  onOpenSidebar,
  hasSidebar = false,
}: DashboardNavbarProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getUserInitials = () =>
    userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const toggleDropdown = (itemName: string) =>
    setActiveDropdown(activeDropdown === itemName ? null : itemName);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { }
    finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  const closeMobile = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <nav className="bg-[#2c3e50] sticky top-0 z-[999] shadow-md" ref={navRef}>
      <div className="w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-13 min-h-[52px]">

          {/* ── Left: Sidebar toggle (mobile) + hamburger + home ── */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Sidebar drawer toggle — only on mobile when sidebar has items */}
            {hasSidebar && (
              <button
                onClick={onOpenSidebar}
                className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Open sidebar navigation"
              >
                {/* Grid / apps icon */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Mobile hamburger for nav items */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>

            {/* Home Button */}
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 text-white hover:bg-white/10 px-2 sm:px-3 py-2 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:block text-sm font-medium">Home</span>
            </button>
          </div>

          {/* ── Center: Desktop nav ── */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navbarItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isActive = location.pathname === item.link ||
                item.children?.some(c => location.pathname === c.link);

              if (hasChildren) {
                return (
                  <div key={item.name} className="relative">
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isActive || activeDropdown === item.name
                          ? 'bg-white/20 text-white'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                      <span>{item.name}</span>
                      <svg className={`w-4 h-4 transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeDropdown === item.name && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl overflow-hidden z-[1000]">
                        {item.children?.map(child => (
                          <Link key={child.name} to={child.link}
                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                            onClick={() => setActiveDropdown(null)}>
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link key={item.name} to={item.link}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium no-underline ${isActive ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}>
                  {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* ── Right: Notifications + Profile ── */}
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationBell />

            <div className="relative">
              <button
                ref={profileBtnRef}
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1.5 text-white hover:bg-white/10 rounded-lg px-1.5 sm:px-2 py-2 transition-colors"
                aria-expanded={isProfileMenuOpen}
                aria-label="User menu"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {userProfilePicture
                    ? <img src={userProfilePicture} alt={userName} className="w-full h-full object-cover" />
                    : <span className="text-sm font-semibold">{getUserInitials()}</span>
                  }
                </div>
                <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">{userName}</span>
                <svg className={`w-4 h-4 transition-transform hidden sm:block ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile dropdown */}
              {isProfileMenuOpen && (
                <div ref={profileMenuRef}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl overflow-hidden z-[1000]">
                  <div className="py-2">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                      <p className="text-xs text-blue-600 mt-1 capitalize">{userRole}</p>
                    </div>

                    <Link to="/dashboard/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                      onClick={() => setIsProfileMenuOpen(false)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </Link>

                    <Link to="/dashboard/profile/edit"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                      onClick={() => setIsProfileMenuOpen(false)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Edit Profile
                    </Link>

                    <Link to="/help"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                      onClick={() => setIsProfileMenuOpen(false)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Help & Support
                    </Link>

                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-[80vh]' : 'max-h-0'}`}>
        <div className="bg-[#34495e] border-t border-white/10 px-4 py-3 space-y-1 overflow-y-auto max-h-[75vh]">

          {/* Nav items */}
          {navbarItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              return (
                <div key={item.name} className="py-1">
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className="flex items-center justify-between w-full text-left text-sm text-white py-2.5 px-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                      {item.name}
                    </span>
                    <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${activeDropdown === item.name ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {activeDropdown === item.name && (
                    <div className="pl-7 mt-1 space-y-0.5">
                      {item.children?.map(child => (
                        <Link key={child.name} to={child.link}
                          className="block text-sm text-gray-300 hover:text-white py-2 px-2 rounded-lg hover:bg-white/10 no-underline transition-colors"
                          onClick={closeMobile}>
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.name} to={item.link}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white py-2.5 px-2 rounded-lg hover:bg-white/10 no-underline transition-colors"
                onClick={closeMobile}>
                {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                {item.name}
              </Link>
            );
          })}

          {/* Sidebar items in mobile menu (if sidebar exists) */}
          {sidebarItems.length > 0 && (
            <>
              <div className="border-t border-white/20 my-2" />
              <p className="text-xs text-gray-400 uppercase tracking-widest px-2 py-1">Quick Links</p>
              {sidebarItems.map(item => (
                <Link key={item.name} to={item.link || '#'}
                  className={`flex items-center gap-2 text-sm py-2.5 px-2 rounded-lg no-underline transition-colors ${location.pathname === item.link
                      ? 'bg-[#1e5292] text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  onClick={closeMobile}>
                  <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}