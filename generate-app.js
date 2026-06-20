const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'app');

function mkdir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function write(file, content) {
    fs.writeFileSync(file, content);
}

// 1. (public) layout and pages
const pubDir = path.join(appDir, '(public)');
mkdir(pubDir);
write(path.join(pubDir, 'PublicLayoutClient.tsx'), `'use client';
import Header from '../../components/layout/header';
import Navbar from '../../components/layout/navbar';
import Footer from '../../components/layout/footer';

export default function PublicLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
        </div>
    );
}
`);
write(path.join(pubDir, 'layout.tsx'), `import PublicLayoutClient from './PublicLayoutClient';
export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return <PublicLayoutClient>{children}</PublicLayoutClient>;
}
`);
write(path.join(pubDir, 'page.tsx'), `import Home from '../../pages-content/common/home';
export default function HomePage() { return <Home />; }
`);

const publicPages = [
    { path: 'about', component: '../../pages-content/common/aboutUs', title: 'About Us' },
    { path: 'contact', component: '../../pages-content/common/contactUs', title: 'Contact Us' },
    { path: 'ipr', component: '../../pages-content/IPRComponents/ipr', title: 'IPR' },
    { path: 'resnova', component: '../../pages-content/resnovaComponents/resnova', title: 'ResNova' },
    { path: 'books', component: '../../pages-content/textBookPublications/productBooks', title: 'Books' },
    { path: 'bookpublications', component: '../../pages-content/bookPublications/bookPublications', title: 'Book Publications' },
    { path: 'bookchapters', component: '../../pages-content/resnovaComponents/bookChapter', title: 'Book Chapters' },
    { path: 'webappdevelopment', component: '../../pages-content/ProjectsComponents/webAppDevelopment', title: 'Web App Development' },
    { path: 'mobileappdevelopment', component: '../../pages-content/ProjectsComponents/mobileAppDevelopment', title: 'Mobile App Development' },
    { path: 'students-internship-program', component: '../../pages-content/ProjectsComponents/studentsInternshipProgram', title: 'Internship Program' },
    { path: 'book-chapter-manuscript', component: '../../pages-content/resnovaComponents/bookChapterManuscript', title: 'Book Chapter Manuscript' },
    { path: 'book-manuscript', component: '../../pages-content/textBookPublications/bookManuscript', title: 'Book Manuscript' },
    { path: 'recruitment', component: '../../pages-content/recruitmentSubmission/recruitmentForm', title: 'Recruitment' },
    { path: 'forms/projects-internships/web-development', component: '../../../../pages-content/ProjectsComponents/webDevelopmentForm', title: 'Web Dev Form' },
    { path: 'forms/projects-internships/mobile-development', component: '../../../../pages-content/ProjectsComponents/mobileDevelopmentForm', title: 'Mobile Dev Form' },
    { path: 'forms/projects-internships/student-internship', component: '../../../../pages-content/ProjectsComponents/studentsInternshipForm', title: 'Student Internship Form' },
];

publicPages.forEach(p => {
    const dir = path.join(pubDir, p.path);
    mkdir(dir);
    write(path.join(dir, 'page.tsx'), `import type { Metadata } from 'next';
import Component from '${p.component}';

export const metadata: Metadata = {
    title: '${p.title}',
};

export default function Page() { return <Component />; }
`);
});

// Dynamic SEO pages (basic wrappers for now to get it building, SEO logic can be refined later)
const dynamicPages = [
    { path: 'bookchapter/[id]/[[...slug]]', component: '../../../../../pages-content/resnovaComponents/bookChapterDetail' },
    { path: 'book/[id]/[[...slug]]', component: '../../../../../pages-content/textBookPublications/booksDetail' },
    { path: 'author/[id]/[[...slug]]', component: '../../../../../pages-content/resnovaComponents/AuthorDetail' },
    { path: 'editor/[id]/[[...slug]]', component: '../../../../../pages-content/resnovaComponents/EditorDetail' },
];

dynamicPages.forEach(p => {
    const dir = path.join(pubDir, p.path);
    mkdir(dir);
    write(path.join(dir, 'page.tsx'), `import Component from '${p.component}';
export default function Page() { return <Component />; }
`);
});


// 2. (auth) layout and pages
const authDir = path.join(appDir, '(auth)');
mkdir(authDir);
write(path.join(authDir, 'layout.tsx'), `export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <main>{children}</main>;
}`);

const authPages = [
    { path: 'login', component: '../../../components/common/login' },
    { path: 'forgot-password', component: '../../../components/common/forgotPassword' },
    { path: 'user/register', component: '../../../../components/common/register' },
    { path: 'auth/google/callback', component: '../../../../pages-content/auth/GoogleCallbackHandler' },
    { path: 'impersonate', component: '../../../pages-content/auth/ImpersonateHandler' },
];
authPages.forEach(p => {
    const dir = path.join(authDir, p.path);
    mkdir(dir);
    write(path.join(dir, 'page.tsx'), `import Component from '${p.component}';
export default function Page() { return <Component />; }
`);
});

// 3. (dashboard) layout and pages
const dashDir = path.join(appDir, '(dashboard)');
mkdir(dashDir);
write(path.join(dashDir, 'layout.tsx'), `'use client';
import UserDashboard from '../../components/layout/userPages/userDashboard';
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <UserDashboard>{children}</UserDashboard>;
}
`);

const dashPages = [
    { path: 'dashboard', component: '../../../pages-content/dashboard/dashboard' },
    { path: 'dashboard/profile', component: '../../../../pages-content/dashboard/ProfilePage' },
    { path: 'dashboard/profile/edit', component: '../../../../../pages-content/dashboard/ProfileEditPage' },
    { path: 'dashboard/admin', component: '../../../../pages-content/dashboard/adminDashboard' },
    // A simplified map of other dashboard routes to ensure build passes, these match the Outlet structure
];
dashPages.forEach(p => {
    const dir = path.join(dashDir, p.path);
    mkdir(dir);
    write(path.join(dir, 'page.tsx'), `import Component from '${p.component}';
export default function Page() { return <Component />; }
`);
});

console.log('App directory generated.');
