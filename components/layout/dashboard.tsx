'use client';
import { useState, useEffect } from 'react';
import { Outlet, useRouter, usePathname } from 'next/navigation';
import Header from './header';
import Navbar from './navbar';
import Footer from './footer';
import { authService } from '../../services';
import { getAuthToken, getStoredUser, setStoredUser, removeAuthToken } from '../../services/api.config';

export default function Dashboard() {
  const router = useRouter();
  const location = { pathname: usePathname(), state: {}, search: "" };
  const [user, setUser] = useState({
    isLoggedIn: false,
    userName: '',
    email: '',
    role: 'user',
    profilePicture: ''
  });

  // Check auth function
  const checkAuth = () => {
    const token = getAuthToken();
    const userData = getStoredUser();

    // 1. Optimistic update from storage — runs synchronously, no API delay
    if (token && userData) {
      setUser({
        isLoggedIn: true,
        userName: userData.username || userData.fullName || '',
        email: userData.email || '',
        role: userData.role || 'user',
        profilePicture: userData.profilePicture || ''
      });
    } else {
      setUser({ isLoggedIn: false, userName: '', email: '', role: 'user', profilePicture: '' });
    }

    // 2. Refresh from API in the background — does NOT block paint
    if (token) {
      authService.getCurrentUser().then(response => {
        if (response.success && response.data) {
          setStoredUser(response.data);
          setUser({
            isLoggedIn: true,
            userName: response.data.username || response.data.fullName || '',
            email: response.data.email || '',
            role: response.data.role || 'user',
            profilePicture: response.data.profilePicture || ''
          });
        }
      }).catch((error: any) => {
        const errorMessage = error?.message?.toLowerCase() || '';
        if (
          errorMessage.includes('user not found') ||
          errorMessage.includes('token has expired') ||
          errorMessage.includes('invalid token') ||
          errorMessage.includes('authentication required')
        ) {
          handleLogout();
        }
      });
    }
  };

  // Initial check on mount and when route changes
  useEffect(() => {
    checkAuth();

    // Listen for custom auth change events
    const handleAuthChange = () => {

      checkAuth();
    };

    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('storage', checkAuth); // Listen for storage changes

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('storage', checkAuth);
    };
  }, [location.pathname]); // Re-check when route changes

  const handleLogout = async (explicit = false) => {
    try {
      await authService.logout();
    } catch {
      // Continue with logout even if API fails
    } finally {
      // Clear all auth storage via centralized function
      removeAuthToken();

      // Update state immediately
      setUser({ isLoggedIn: false, userName: '', email: '', role: 'user', profilePicture: '' });

      // Dispatch custom event for other components
      window.dispatchEvent(new Event('auth-changed'));

      // Only navigate to home if it's an explicit logout or we're in a dashboard route
      if (explicit || location.pathname.startsWith('/dashboard')) {
        router.push('/', { replace: true });
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header
        isLoggedIn={user.isLoggedIn}
        userName={user.userName}
        userEmail={user.email}
        userRole={user.role}
        userProfilePicture={user.profilePicture}
        onLogout={handleLogout}
      />
      <div className="sticky top-0 z-[1000]">
        <Navbar />
      </div>
      <main className="flex-grow w-full max-w-[240mm] mx-auto bg-white shadow-xl my-8 p-[10px] min-h-auto">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}