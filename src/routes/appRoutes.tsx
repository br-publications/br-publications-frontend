import { Routes, Route } from "react-router-dom";
import Dashboard from "../components/layout/dashboard";
import Home from "../pages/components/home";
import Login from "../components/common/login";
import { lazy, Suspense } from "react";

// ─── Eagerly loaded (critical path: always needed on first visit) ───────────
import ForgotPassword from "../components/common/forgotPassword";
import Register from "../components/common/register";
import UserDashboard from "../components/layout/userPages/userDashboard";
import NotFound from "../pages/components/notFound/NotFound";
import ImpersonateHandler from "../pages/auth/ImpersonateHandler";
import GoogleCallbackHandler from "../pages/auth/GoogleCallbackHandler";

// ─── Lazy loaded (public pages — load when first visited) ───────────────────
const ContactUs = lazy(() => import('../pages/components/contactUs'));
const AboutUs = lazy(() => import('../pages/components/aboutUs'));
const IPR = lazy(() => import('../pages/IPRComponents/ipr'));
const ResNova = lazy(() => import('../pages/resnovaComponents/resnova'));
const BookPublications = lazy(() => import('../pages/bookPublications/bookPublications'));
const BookChapterManuscript = lazy(() => import('../pages/forms/bookChapterManuscript'));
const BookManuscript = lazy(() => import('../pages/forms/bookManuscript'));
const RecruitmentForm = lazy(() => import('../pages/forms/recruitmentForm/recruitmentForm'));
const ProductBooks = lazy(() => import('../pages/textBookPublications/productBooks'));
const ProductBookChapter = lazy(() => import('../pages/resnovaComponents/bookChapter'));
const BookChapterDetail = lazy(() => import('../pages/resnovaComponents/bookChapterDetail'));
const ChapterDetail = lazy(() => import('../pages/resnovaComponents/chapterDetail'));
const BooksDetail = lazy(() => import('../pages/textBookPublications/booksDetail'));
const WebAppDevelopment = lazy(() => import('../pages/ProjectsComponents/webAppDevelopment'));
const MobileAppDevelopment = lazy(() => import('../pages/ProjectsComponents/mobileAppDevelopment'));
const StudentsInternshipProgram = lazy(() => import('../pages/ProjectsComponents/studentsInternshipProgram'));

// ─── Lazy loaded (forms) ────────────────────────────────────────────────────
const WebDevelopmentForm = lazy(() => import('../pages/forms/projectsInternships/WebDevelopmentForm'));
const MobileDevelopmentForm = lazy(() => import('../pages/forms/projectsInternships/MobileDevelopmentForm'));
const StudentInternshipForm = lazy(() => import('../pages/forms/projectsInternships/StudentInternshipForm'));

// ─── Lazy loaded (authenticated / dashboard pages) ──────────────────────────
const AuthorDashboard = lazy(() => import('../pages/bookChapterSubmission/author/authorDashboard'));
const AdminDashboard = lazy(() => import('../pages/bookChapterSubmission/admin/adminDashboard'));
const ReviewerDashboard = lazy(() => import('../pages/bookChapterSubmission/reviewer/reviewerDashboard'));
const EditorDashboard = lazy(() => import('../pages/bookChapterSubmission/editor/editorDashboard'));
const AuthorSubmissionDetailsPage = lazy(() => import('../pages/bookChapterSubmission/author/authorSubmissionDetailsPage'));
const UserRoleManagement = lazy(() => import('../pages/dashboard/admin/userRoleManagement'));
const BookManagement = lazy(() => import('../components/bookManagement').then(m => ({ default: m.BookManagement })));
const AuthorTextBookDashboard = lazy(() => import('../pages/textBookSubmission/authorDashboard/authorTextBookDashboard'));
const AdminTextBookDashboard = lazy(() => import('../pages/textBookSubmission/adminDashboard/AdminTextBookDashboard'));
const PublishedChapterManager = lazy(() => import('../pages/bookChapterSubmission/bookChapterManager/PublishedChapterManager'));
const UserRecruitmentDashboard = lazy(() => import('../pages/recruitmentSubmission/UserRecruitmentDashboard'));
const AdminRecruitmentDashboard = lazy(() => import("../pages/recruitmentSubmission/AdminRecruitmentDashboard"));
const RecruitmentDetailView = lazy(() => import("../pages/recruitmentSubmission/RecruitmentDetailView"));
const ReviewerManagement = lazy(() => import("../pages/dashboard/editor/ReviewerManagement"));
const AdminDirectPublishingPage = lazy(() => import("../pages/textBookSubmission/adminDashboard/AdminDirectPublishingPage"));
const TextBookBulkUpload = lazy(() => import("../pages/textBookSubmission/bulkUpload/TextBookBulkUpload"));
const PublishedBookManager = lazy(() => import("../pages/textBookSubmission/adminDashboard/PublishedBookManager"));
const ManualPublishingAdminPage = lazy(() => import("../pages/bookChapterSubmission/admin/ManualPublishingAdminPage"));
const BookChapterBulkUpload = lazy(() => import("../components/submissions/Bulk upload/BookChapterBulkUpload"));
const CommunicationTemplatesPage = lazy(() => import("../pages/dashboard/admin/CommunicationTemplatesPage"));
const ProfilePage = lazy(() => import("../pages/dashboard/shared/ProfilePage"));
const ProfileEditPage = lazy(() => import("../pages/dashboard/shared/ProfileEditPage"));
const AdminContactDashboard = lazy(() => import("../pages/contactInquiries/AdminContactDashboard"));
const AdminStatsDashboard = lazy(() => import('../pages/dashboard/admin/AdminStatsDashboard'));
const ConferencePage = lazy(() => import('../pages/conference/conference'));
const ConferenceDetails = lazy(() => import('../pages/conference/conferenceDetails'));
const ConferenceArticle = lazy(() => import('../pages/conference/conferenceArticle'));
const ConferenceManager = lazy(() => import('../pages/conference/conferenceManager/ConferenceManager'));
const ConferenceBulkUpload = lazy(() => import('../pages/conference/bulkUpload/ConferenceBulkUpload'));
const ProductFinder = lazy(() => import('../pages/common/ProductFinder'));
const UserProjectDashboard = lazy(() => import('../pages/projectsInternshipSubmission/UserProjectDashboard'));
const AdminProjectDashboard = lazy(() => import('../pages/projectsInternshipSubmission/AdminProjectDashboard'));
const ProjectDetailView = lazy(() => import('../pages/projectsInternshipSubmission/ProjectDetailView'));

export default function AppRoutes() {
  return (
    <Suspense fallback={null}>
    <Routes>
      <Route element={<Dashboard />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/user/register" element={<Register />} />
        <Route path="/ipr" element={<IPR />} />
        <Route path="/resnova" element={<ResNova />} />
        <Route path="/bookchapter/:id/:slug?" element={<BookChapterDetail />} />
        <Route path="/book/:id/chapter/:chapterId" element={<ChapterDetail />} />
        <Route path="/bookchapters" element={<ProductBookChapter />} />
        <Route path="/book/:id/:slug?" element={<BooksDetail />} />
        <Route path="/bookpublications" element={<BookPublications />} />
        <Route path="/books" element={<ProductBooks />} />
        <Route path="/product/find/:isbn" element={<ProductFinder />} />
        <Route path="/conference" element={<ConferencePage />} />
        <Route path="/conference/:id" element={<ConferenceDetails />} />
        <Route path="/conference/:id/article/:articleId" element={<ConferenceArticle />} />
        <Route path="/webappdevelopment" element={<WebAppDevelopment />} />
        <Route path="/mobileappdevelopment" element={<MobileAppDevelopment />} />
        <Route path="/students-internship-program" element={<StudentsInternshipProgram />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/book-chapter-manuscript" element={<BookChapterManuscript />} />
        <Route path="/book-manuscript" element={<BookManuscript />} />
        {/* Projects & Internships & Recruitment*/}
        <Route path="/forms/projects-internships/web-development" element={<WebDevelopmentForm />} />
        <Route path="/forms/projects-internships/mobile-development" element={<MobileDevelopmentForm />} />
        <Route path="/forms/projects-internships/student-internship" element={<StudentInternshipForm />} />
        <Route path="/recruitment" element={<RecruitmentForm />} />
      </Route>

      <Route path="/dashboard" element={<UserDashboard />} />
      <Route element={<UserDashboard />} >
        <Route path="/dashboard/author/submissions" element={<AuthorDashboard />} />
        <Route path="/dashboard/author/textbooks" element={<AuthorTextBookDashboard />} />
        <Route path="/dashboard/user/recruitment" element={<UserRecruitmentDashboard />} />
        <Route path="/dashboard/user/projectsinternships" element={<UserProjectDashboard />} />
        <Route path="/dashboard/author/submissions/:id" element={<AuthorSubmissionDetailsPage />} />
        <Route path="/dashboard/admin/submissions" element={<AdminDashboard />} />
        <Route path="/dashboard/admin/users" element={<UserRoleManagement />} />
        <Route path="/dashboard/admin/book-chapters" element={<BookManagement />} />
        <Route path="/dashboard/admin/textbooks" element={<AdminTextBookDashboard />} />
        <Route path="/dashboard/admin/book-publishing" element={<AdminDirectPublishingPage />} />
        <Route path="/dashboard/admin/textbooks/bulk-upload" element={<TextBookBulkUpload />} />
        <Route path="/dashboard/admin/bookchapterbulkupload" element={<BookChapterBulkUpload />} />
        <Route path="/dashboard/admin/recruitment" element={<AdminRecruitmentDashboard />} />
        <Route path="/dashboard/user/projects-internships/view/:id" element={<ProjectDetailView />} />
        <Route path="/dashboard/admin/projects-internships" element={<AdminProjectDashboard />} />
        <Route path="/dashboard/admin/projects-internships/view/:id" element={<ProjectDetailView />} />
        <Route path="/recruitment/id/:id" element={<RecruitmentDetailView />} />
        <Route path="/dashboard/editor/submissions" element={<EditorDashboard />} />
        <Route path="/dashboard/editor/reviewers" element={<ReviewerManagement />} />
        <Route path="/dashboard/reviewer/submissions" element={<ReviewerDashboard />} />
        <Route path="/dashboard/admin/textbooksmanager" element={<PublishedBookManager />} />
        <Route path="/dashboard/admin/bookchaptermanager" element={<PublishedChapterManager />} />
        <Route path="/dashboard/admin/conferences" element={<ConferenceManager />} />
        <Route path="/dashboard/admin/conferences/bulk-upload" element={<ConferenceBulkUpload />} />
        <Route path="/dashboard/admin/individualbookchapterpublish" element={<ManualPublishingAdminPage />} />
        <Route path="/dashboard/admin/emailtemplates" element={<CommunicationTemplatesPage />} />
        <Route path="/dashboard/admin/contactinquiries" element={<AdminContactDashboard />} />
        <Route path="/dashboard/admin" element={<AdminStatsDashboard />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/dashboard/profile/edit" element={<ProfileEditPage />} />
        {/* Dashboard 404 fallback */}
        <Route path="/dashboard/*" element={<NotFound />} />
      </Route>

      {/* Impersonation Handler Route */}
      <Route path="/impersonate" element={<ImpersonateHandler />} />

      {/* Google OAuth Callback Route */}
      <Route path="/auth/google/callback" element={<GoogleCallbackHandler />} />

      {/* Wildcard 404 Route - must be last */}
      <Route path="*" element={<Dashboard />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
