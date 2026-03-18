import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../../assets/BR_logo.png';
import Search from '../common/search';
import type { AlertType } from '../common/alertPopup';
import AlertPopup from '../common/alertPopup';
import NotificationBell from '../common/Notification/NotificationBell';
import { recruitmentService } from '../../services/recruitment.service';
import { bookChapterService } from '../../services/bookChapterSumission.service';
import * as textBookService from '../../services/textBookService';

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userProfilePicture?: string;
  onLogout?: () => void;
}

export default function Header({
  isLoggedIn = false,
  userName = "John Doe",
  userEmail = "john.doe@example.com",
  userRole = "user",
  userProfilePicture,
  onLogout
}: HeaderProps) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);
  const [hasRecruitmentSubmissions, setHasRecruitmentSubmissions] = useState(false);
  const [hasBookChapters, setHasBookChapters] = useState(false);
  const [hasTextBooks, setHasTextBooks] = useState(false);

  useEffect(() => {
    const checkRecruitment = async () => {
      if (isLoggedIn && userRole === 'user') {
        try {
          const apps = await recruitmentService.getMyApplications();
          setHasRecruitmentSubmissions(apps && apps.length > 0);
        } catch (error) {
          console.error('Error checking recruitment submissions:', error);
        }
      }
    };

    const checkAuthorSubmissions = async () => {
      if (isLoggedIn && userRole?.toLowerCase() === 'author') {
        try {
          const [bcRes, tbRes] = await Promise.all([
            bookChapterService.getMySubmissions({ limit: 1 }),
            textBookService.getMySubmissions({ limit: 1 })
          ]);

          // bcRes is ApiResponse, tbRes is the data part directly (PaginatedResponse)
          const hasBC = !!(bcRes.data?.submissions && bcRes.data.submissions.length > 0);
          const hasTB = !!(tbRes.submissions && tbRes.submissions.length > 0);

          setHasBookChapters(hasBC);
          setHasTextBooks(hasTB);
        } catch (error) {
          console.error('Error checking author submissions:', error);
        }
      }
    };

    checkRecruitment();
    checkAuthorSubmissions();
  }, [isLoggedIn, userRole]);



  // Check if we're on the home page
  const isHomePage = location.pathname !== '/dashboard';

  const isUser = userRole !== 'user';

  const getDashboardPath = () => {
    switch (userRole?.toLowerCase()) {
      case 'author':
        if (hasBookChapters) return '/dashboard/author/submissions';
        if (hasTextBooks) return '/dashboard/author/textbooks';
        return '/dashboard/author/submissions';
      case 'editor':
        return '/dashboard/editor/submissions';
      case 'reviewer':
        return '/dashboard/reviewer/submissions';
      case 'admin':
        return '/dashboard/admin';
      case 'student':
        return '/dashboard/user/projectsinternships';
      case 'developer':
        return '/dashboard/admin';
      default:
        return '/dashboard';
    }
  };

  const dashboardPath = getDashboardPath();



  // Get user initials
  const getUserInitials = () => {
    if (!userName) return 'U';
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }

      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    // Global listener for app-wide alerts (e.g. from interceptors)
    const handleAppAlert = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, title, message } = customEvent.detail;
      showAlert(type, title, message);
    };

    window.addEventListener('app-alert', handleAppAlert);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('app-alert', handleAppAlert);
    };
  }, []);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    setIsMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message
    });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };
  return (
    <>
      <header className="bg-[#1e5292] text-white relative z-[1001] shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
        <div className="max-w-[1316px] mx-auto px-[18px] py-[clamp(0.47rem,0.94vw+0.18rem,0.94rem)] flex items-center justify-between gap-[10px]">
          {/* Logo Section */}
          <a href="/" className="flex items-center gap-[clamp(9px,1.4vw,18px)] min-w-0 no-underline text-white">
            <img
              src={logo}
              alt="BR Publications Logo"
              className="w-[clamp(30px,4.7vw+5px,61px)] h-[clamp(30px,4.7vw+5px,61px)] rounded-full shrink-0 object-cover"
            />
            <div className="flex flex-col">
              <h1 className="text-[clamp(14px,2vw+5px,30px)] font-bold whitespace-nowrap m-0">
                BR Publications
              </h1>
              <p className="text-[clamp(6.5px,0.65vw+3.7px,11.2px)] text-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.15)] px-[6px] py-[2px] rounded-[3px] inline-block uppercase w-fit">
                Registered under Ministry of MSME, Government of India
              </p>
            </div>
          </a>

          {/* Right Section */}
          <nav className="flex items-center gap-[10px]">
            {!isLoggedIn ? (
              <>
                {/* LOGGED OUT STATE */}
                <div className="hidden min-[769px]:flex gap-[10px]">
                  <button onClick={() => setIsSearchOpen(true)} className="bg-transparent border-none cursor-pointer text-white text-[clamp(13px,0.9vw+5px,17px)] font-semibold px-[10px] py-[6px] whitespace-nowrap no-underline hover:text-gray-200 text-left">Search</button>
                  <a href="/login" className="text-white text-[clamp(13px,0.9vw+5px,17px)] font-semibold px-[10px] py-[6px] whitespace-nowrap no-underline hover:text-gray-200">Register / Login</a>
                </div>

                <div className="hidden min-[371px]:max-[768px]:flex gap-[8px]">
                  <button onClick={() => setIsSearchOpen(true)} className="bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.3)] rounded-[6px] w-[34px] h-[34px] flex items-center justify-center cursor-pointer hover:bg-white/20 transition">
                    <img src="https://cdn-icons-png.flaticon.com/512/54/54481.png" alt="Search" className="w-[16px] h-[16px] brightness-0 invert" />
                  </button>
                  <a href="/login" className="bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.3)] rounded-[6px] w-[34px] h-[34px] flex items-center justify-center cursor-pointer hover:bg-white/20 transition">
                    <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" alt="Login" className="w-[16px] h-[16px] brightness-0 invert" />
                  </a>
                </div>
              </>
            ) : (
              <>
                {/* LOGGED IN STATE - Desktop (> 768px) */}
                <div className="hidden min-[769px]:flex items-center gap-[10px]">
                  <NotificationBell />
                  <button onClick={() => setIsSearchOpen(true)} className="bg-transparent border-none cursor-pointer text-white text-[clamp(13px,0.9vw+5px,17px)] font-semibold px-[10px] py-[6px] whitespace-nowrap no-underline hover:text-gray-200 text-left">Search</button>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      ref={profileBtnRef}
                      onClick={() => {

                        setIsProfileMenuOpen(!isProfileMenuOpen);
                      }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden border border-white/20">
                        {userProfilePicture ? (
                          <img src={userProfilePicture} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                          getUserInitials()
                        )}
                      </div>
                      <span className="text-sm font-medium">{userName}</span>
                      <svg className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileMenuOpen && (
                      <div
                        ref={profileMenuRef}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                          <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                        </div>

                        {/* Menu Items */}
                        {isHomePage && isUser && (
                          <a
                            href={dashboardPath}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Your Dashboard
                          </a>
                        )}

                        <a
                          href="/dashboard/profile"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          My Profile
                        </a>
                        {['user'].includes(userRole) && hasRecruitmentSubmissions && (
                          <a
                            href="/dashboard/user/recruitment"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Recruitment Status
                          </a>
                        )}

                        <a
                          href="/dashboard/profile/edit"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Edit Your Profile
                        </a>

                        <a
                          href="/contact"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Help & Support
                        </a>

                        {/* Logout Button */}
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* LOGGED IN STATE - Tablet (371px - 768px) */}
                <div className="hidden min-[371px]:max-[768px]:flex items-center gap-[8px]">
                  <NotificationBell />
                  <button onClick={() => setIsSearchOpen(true)} className="bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.3)] rounded-[6px] w-[34px] h-[34px] flex items-center justify-center cursor-pointer hover:bg-white/20 transition">
                    <img src="https://cdn-icons-png.flaticon.com/512/54/54481.png" alt="Search" className="w-[14px] h-[14px] brightness-0 invert" />
                  </button>

                  <button
                    ref={profileBtnRef}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="w-[34px] h-[34px] rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs cursor-pointer hover:bg-blue-700 transition-colors overflow-hidden border border-white/20 p-0"
                  >
                    {userProfilePicture ? (
                      <img src={userProfilePicture} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      getUserInitials()
                    )}
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      ref={profileMenuRef}
                      className="absolute right-4 top-full mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                      </div>

                      {isHomePage && isUser && (
                        <a href={dashboardPath} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline" onClick={() => setIsProfileMenuOpen(false)}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Your Dashboard
                        </a>
                      )}

                      <a href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline" onClick={() => setIsProfileMenuOpen(false)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </a>

                      <a href="/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline" onClick={() => setIsProfileMenuOpen(false)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </a>

                      <a href="/help" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline" onClick={() => setIsProfileMenuOpen(false)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Help & Support
                      </a>

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer text-left"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* LOGGED IN STATE - Mobile (< 370px) */}
                <div className="hidden max-[370px]:flex items-center gap-[8px]">
                  <button onClick={() => setIsSearchOpen(true)} className="bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.3)] rounded-[6px] w-[30px] h-[30px] flex items-center justify-center cursor-pointer hover:bg-white/20 transition">
                    <img src="https://cdn-icons-png.flaticon.com/512/54/54481.png" alt="Search" className="w-[14px] h-[14px] brightness-0 invert" />
                  </button>

                  <button
                    ref={btnRef}
                    className="flex flex-col gap-[4px] p-[5px] bg-transparent border-none cursor-pointer"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle Menu"
                  >
                    <span className="w-[22px] h-[2px] bg-white rounded-[2px] transition-all duration-300"></span>
                    <span className="w-[22px] h-[2px] bg-white rounded-[2px] transition-all duration-300"></span>
                    <span className="w-[22px] h-[2px] bg-white rounded-[2px] transition-all duration-300"></span>
                  </button>

                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute top-full left-0 right-0 bg-[#1e4470] py-[10px] border-t border-[rgba(255,255,255,0.1)] shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                    >
                      <div className="px-[20px] py-[12px] border-b border-[rgba(255,255,255,0.05)]">
                        <p className="text-sm font-semibold text-white truncate">{userName}</p>
                        <p className="text-xs text-[rgba(255,255,255,0.7)] truncate">{userEmail}</p>
                      </div>

                      <div className="px-[20px] py-[4px] border-b border-[rgba(255,255,255,0.05)] hover:bg-white/10">
                        <NotificationBell />
                      </div>

                      {isHomePage && isUser && (
                        <a href={dashboardPath} className="w-full px-[20px] py-[12px] text-left text-white text-sm font-medium border-b border-[rgba(255,255,255,0.05)] hover:bg-white/10 flex items-center gap-3 no-underline" onClick={() => setIsMenuOpen(false)}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Your Dashboard
                        </a>
                      )}

                      <a href="/profile" className="w-full px-[20px] py-[12px] text-left text-white text-sm font-medium border-b border-[rgba(255,255,255,0.05)] hover:bg-white/10 flex items-center gap-3 no-underline" onClick={() => setIsMenuOpen(false)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </a>

                      <a href="/settings" className="w-full px-[20px] py-[12px] text-left text-white text-sm font-medium border-b border-[rgba(255,255,255,0.05)] hover:bg-white/10 flex items-center gap-3 no-underline" onClick={() => setIsMenuOpen(false)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </a>

                      <a href="/help" className="w-full px-[20px] py-[12px] text-left text-white text-sm font-medium border-b border-[rgba(255,255,255,0.05)] hover:bg-white/10 flex items-center gap-3 no-underline" onClick={() => setIsMenuOpen(false)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Help & Support
                      </a>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-[20px] py-[12px] text-left text-red-400 text-sm font-medium hover:bg-red-50/10 flex items-center gap-3 border-none bg-transparent cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>
        </div>
      </header>
      <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AlertPopup
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />
    </>
  );
}