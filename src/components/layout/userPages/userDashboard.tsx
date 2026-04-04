// components/dashboard/UserDashboard.tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isAuthenticated } from '../../../services/api.config';
import DashboardHeader from './header';
import DashboardNavbar from './navbar';
import DashboardSidebar from './sidebar';
import { type UserRole, getNavigationByRole, Icons } from '../../../config/navigationConfig';
import { getSubmissionStats } from '../../../services/textBookService';
import { bookChapterService } from '../../../services/bookChapterSumission.service';
import { projectInternshipService } from '../../../services/projectInternship.service';

interface UserData {
  id: number;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  profilePicture?: string;
}

export default function UserDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [hasTextbookSubmissions, setHasTextbookSubmissions] = useState(false);
  const [hasBookChapterSubmissions, setHasBookChapterSubmissions] = useState(false);
  const [hasProjectSubmissions, setHasProjectSubmissions] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/login', { 
        replace: true, 
        state: { message: "Please login to access the dashboard." } 
      });
      return;
    }

    const impersonating = sessionStorage.getItem('isImpersonating') === 'true';
    setIsImpersonating(impersonating);

    const userDataStr = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (userDataStr) {
      try {
        const parsedUser = JSON.parse(userDataStr);
        setUserData(parsedUser);
        const role = (parsedUser.role || 'user').toLowerCase() as UserRole;
        setUserRole(role);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const userDataStr = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (userDataStr) {
        const parsedUser = JSON.parse(userDataStr);
        setUserData(parsedUser);
        setUserRole((parsedUser.role || 'user').toLowerCase() as UserRole);
        setIsImpersonating(sessionStorage.getItem('isImpersonating') === 'true');
      }
    };
    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  useEffect(() => {
    if (userRole === 'author') {
      const fetchData = async () => {
        try {
          const tbStats = await getSubmissionStats();
          if (tbStats?.aggregated?.all > 0) setHasTextbookSubmissions(true);

          const chapResponse = await bookChapterService.getMySubmissions({ limit: 1 });
          if (chapResponse.success && chapResponse.data) {
            const items = chapResponse.data.items || chapResponse.data.submissions || [];
            if (items.length > 0 || chapResponse.data.pagination?.total > 0) {
              setHasBookChapterSubmissions(true);
            }
          }

          const projectResponse = await projectInternshipService.getMySubmissions();
          if (projectResponse?.length > 0) setHasProjectSubmissions(true);
        } catch (error) {
          console.error('Failed to fetch author submission data:', error);
        }
      };
      fetchData();
    }
  }, [userRole]);

  const { navbarItems: baseNavbarItems, sidebarItems } = getNavigationByRole(userRole);
  let navbarItems = [...baseNavbarItems];

  if (userRole === 'author') {
    const isTextbookDashboard = location.pathname.includes('/dashboard/author/textbooks');
    const isChapterDashboard = location.pathname.includes('/dashboard/author/submissions');

    if (isTextbookDashboard) {
      if (hasBookChapterSubmissions) navbarItems.push({ name: 'Book Chapter Submissions', link: '/dashboard/author/submissions', icon: Icons.BookChapter });
      navbarItems = navbarItems.filter(item => item.name !== 'Textbooks');
    } else if (isChapterDashboard) {
      if (hasTextbookSubmissions) navbarItems.push({ name: 'Textbooks', link: '/dashboard/author/textbooks', icon: Icons.BookPublications });
      navbarItems = navbarItems.filter(item => item.link !== '/dashboard/author/submissions');
    } else {
      if (hasTextbookSubmissions && !navbarItems.some(i => i.name === 'Textbooks')) {
        navbarItems.push({ name: 'Textbooks', link: '/dashboard/author/textbooks', icon: Icons.BookPublications });
      }
      if (hasBookChapterSubmissions && !navbarItems.some(i => i.link === '/dashboard/author/submissions')) {
        navbarItems.push({ name: 'Book Chapter Submissions', link: '/dashboard/author/submissions', icon: Icons.BookChapter });
      }
    }
  }

  const isProjectDashboard = location.pathname.includes('/dashboard/user/projectsinternships') ||
    location.pathname.includes('/dashboard/user/projects-internships');
  if (hasProjectSubmissions && !isProjectDashboard) {
    if (!navbarItems.some(i => i.link === '/dashboard/user/projectsinternships' || i.link === '/dashboard/user/projects-internships')) {
      navbarItems.push({ name: 'Projects & Internships', link: '/dashboard/user/projectsinternships', icon: Icons.Assignments });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasSidebar = sidebarItems.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Impersonation banner */}
      {isImpersonating && (
        <div className="bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium shadow-md relative z-50">
          <p className="flex items-center justify-center gap-2 flex-wrap">
            ⚠️ Impersonating <strong>{userData?.fullName}</strong>. All actions will be performed as this user.
            <button
              onClick={() => { sessionStorage.clear(); window.close(); }}
              className="ml-2 underline hover:text-amber-100"
            >
              Close Session
            </button>
          </p>
        </div>
      )}

      {/* Header */}
      <DashboardHeader role={userRole.charAt(0).toUpperCase() + userRole.slice(1)} />

      {/* Sticky Navbar */}
      <DashboardNavbar
        userName={userData?.fullName || userData?.username || "User"}
        userEmail={userData?.email || "user@example.com"}
        userRole={userRole}
        userProfilePicture={userData?.profilePicture}
        navbarItems={navbarItems}
        sidebarItems={sidebarItems}
        hasSidebar={hasSidebar}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />

      {/* Layout: sidebar + content */}
      <div className="flex flex-1 min-w-0">
        {/* Sidebar (desktop icon rail + mobile slide-in drawer) */}
        <DashboardSidebar
          sidebarItems={sidebarItems}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0 p-2 sm:p-3 lg:p-5">
          <div className="w-full mx-auto min-w-0">
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-5 min-h-[calc(100vh-200px)] overflow-x-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
