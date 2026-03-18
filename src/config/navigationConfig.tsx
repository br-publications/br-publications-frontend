import type { JSX } from "react";

export type UserRole = 'admin' | 'author' | 'editor' | 'reviewer' | 'user' | 'developer';

export interface MenuItem {
  name: string;
  link: string;
  icon?: JSX.Element;
  children?: MenuItem[]; // For dropdown menus
}

// ============================================================================
// ICONS (SVG Components)
// ============================================================================

export const Icons = {
  Home: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),

  BookChapter: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),

  ResNova: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),

  BookPublications: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),

  IPR: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),

  Research: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),

  About: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),

  Contact: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),

  Settings: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),

  Users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),

  Submissions: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),

  Reviewers: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),

  Dashboard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  ),

  Roles: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),

  MySubmissions: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),

  Assignments: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),

  Empty: (<svg></svg>),
};

// ============================================================================
// ADMIN NAVIGATION
// ============================================================================

export const adminNavbarItems: MenuItem[] = [
  {
    name: 'ResNova Academic Press',
    link: '#',
    children: [
      { name: 'Add Book Chapters', link: '/dashboard/admin/book-chapters' },
      { name: 'publish Book Chapters', link: '/dashboard/admin/individualbookchapterpublish' },
      { name: 'Bulk Uploads', link: '/dashboard/admin/bookchapterbulkupload' },
      { name: 'Manage Published Chapters', link: '/dashboard/admin/bookchaptermanager' },
    ],
  },
  {
    name: 'Book Publications',
    link: '#',
    children: [
      { name: 'Book Submissions', link: '/dashboard/admin/textbooks' },
      { name: 'Publish Books', link: '/dashboard/admin/book-publishing' },
      { name: 'Bulk Uploads', link: '/dashboard/admin/textbooks/bulk-upload' },
      { name: 'Manage Published Books', link: '/dashboard/admin/textbooksmanager' },
    ],
  },
  {
    name: 'Conferences',
    link: '#',
    children: [
      { name: 'Manage Conferences', link: '/dashboard/admin/conferences' },
      { name: 'Bulk Upload', link: '/dashboard/admin/conferences/bulk-upload' },
      { name: 'View Public Listing', link: '/conference' },
    ],
  },
  {
    name: 'Settings',
    link: '#',
    children: [
      { name: 'Contact Settings', link: '/contact' },
      { name: 'Email Templates', link: '/dashboard/admin/emailtemplates' },
    ],
  },
];

export const adminSidebarItems: MenuItem[] = [
  // {
  //   name: 'Dashboard',
  //   link: '/admin/dashboard',
  //   icon: Icons.Dashboard,
  // },
  {
    name: 'Analytics & Reports',
    link: '/dashboard/admin',
    icon: Icons.Dashboard, // You can change this to a specific chart icon later if desired
  },
  {
    name: 'Book Chapter Submissions',
    link: '/dashboard/admin/submissions',
    icon: Icons.Submissions,
  },
  {
    name: 'Text Book Submissions',
    link: '/dashboard/admin/textbooks',
    icon: Icons.BookPublications,
  },
  {
    name: 'Manage Recruitements',
    link: '/dashboard/admin/recruitment',
    icon: Icons.Reviewers,
  },
  {
    name: 'Projects & Internships',
    link: '/dashboard/admin/projects-internships',
    icon: Icons.Assignments, // Using Assignments icon for now
  },
  {
    name: 'Contact Enquiries',
    link: '/dashboard/admin/contactinquiries',
    icon: Icons.Contact,
  },
  {
    name: 'Manage Users',
    link: '/dashboard/admin/users',
    icon: Icons.Users,
  },
];

// ============================================================================
// AUTHOR NAVIGATION
// ============================================================================

export const authorNavbarItems: MenuItem[] = [];

export const authorSidebarItems: MenuItem[] = []; // No sidebar for author

// ============================================================================
// EDITOR NAVIGATION
// ============================================================================

export const editorNavbarItems: MenuItem[] = [
  {
    name: 'Book Chapter Submissions',
    link: '/dashboard/editor/submissions',
  },
  {
    name: 'Manage Reviewers',
    link: '/dashboard/editor/reviewers',
  }
];

export const editorSidebarItems: MenuItem[] = [];

// ============================================================================
// REVIEWER NAVIGATION
// ============================================================================

export const reviewerNavbarItems: MenuItem[] = [];

export const reviewerSidebarItems: MenuItem[] = []; // No sidebar for reviewer

// ============================================================================
// REGULAR USER NAVIGATION
// ============================================================================

export const userNavbarItems: MenuItem[] = [];

export const userSidebarItems: MenuItem[] = [];

// ============================================================================
// DEVELOPER NAVIGATION
// ============================================================================

export const developerNavbarItems: MenuItem[] = adminNavbarItems; // Developers get admin navigation
export const developerSidebarItems: MenuItem[] = adminSidebarItems; // Developers get admin sidebar

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getNavigationByRole = (role: UserRole): {
  navbarItems: MenuItem[];
  sidebarItems: MenuItem[];
} => {
  switch (role) {
    case 'admin':
      return {
        navbarItems: adminNavbarItems,
        sidebarItems: adminSidebarItems,
      };
    case 'developer':
      return {
        navbarItems: developerNavbarItems,
        sidebarItems: developerSidebarItems,
      };
    case 'author':
      return {
        navbarItems: authorNavbarItems,
        sidebarItems: authorSidebarItems,
      };
    case 'editor':
      return {
        navbarItems: editorNavbarItems,
        sidebarItems: editorSidebarItems,
      };
    case 'reviewer':
      return {
        navbarItems: reviewerNavbarItems,
        sidebarItems: reviewerSidebarItems,
      };
    case 'user':
    default:
      return {
        navbarItems: userNavbarItems,
        sidebarItems: userSidebarItems,
      };
  }
};