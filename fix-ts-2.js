const fs = require('fs');
const path = require('path');

const seoDir = path.join(__dirname);

function replaceInFile(filePath, regex, replacement) {
    const fullPath = path.join(seoDir, filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    const newContent = content.replace(regex, replacement);
    if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
    }
}

function replaceAllInFile(filePath, replacements) {
    const fullPath = path.join(seoDir, filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    let orig = content;
    for (let r of replacements) {
        content = content.replace(r.regex, r.replacement);
    }
    if (orig !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
    }
}

// 1. Fix missing navigate
const navigateFixes = [
    { regex: /navigate\(/g, replacement: "router.push(" },
    { regex: /import { useNavigate } from 'react-router-dom';/g, replacement: "import { useRouter } from 'next/navigation';" },
    { regex: /const navigate = useNavigate\(\);/g, replacement: "const router = useRouter();" }
];
replaceAllInFile('pages-content/forms/projectsInternships/WebDevelopmentForm.tsx', navigateFixes);
replaceAllInFile('pages-content/forms/recruitmentForm/recruitmentForm.tsx', navigateFixes);
replaceAllInFile('pages-content/recruitmentSubmission/UserRecruitmentDashboard.tsx', navigateFixes);


// 2. Remove state from router.push
replaceInFile('pages-content/HomePageComponents/bookCarousel.tsx', /, \{ state: [^\}]+\} \}/g, "");
replaceInFile('pages-content/HomePageComponents/subjects.tsx', /, \{ state: [^\}]+\} \}/g, "");
replaceInFile('pages-content/HomePageComponents/textBookCarousel.tsx', /, \{ state: [^\}]+\} \}/g, "");
replaceInFile('pages-content/resnovaComponents/bookChapter.tsx', /, \{ state: [^\}]+\} \}/g, "");
replaceInFile('pages-content/textBookPublications/productBooks.tsx', /, \{ state: [^\}]+\} \}/g, "");

// 3. Fix Link in ipr.tsx
replaceInFile('pages-content/IPRComponents/ipr.tsx', /import React from 'react';/, "import React from 'react';\nimport Link from 'next/link';");

// 4. Fix hash in ipr.tsx (location.hash doesn't exist on usePathname, but window.location.hash does)
replaceInFile('pages-content/IPRComponents/ipr.tsx', /location\.hash/g, "window.location.hash");

// 5. Fix type number assignable to string (router.push expects string)
replaceInFile('pages-content/projectsInternshipSubmission/ProjectDetailView.tsx', /router\.push\(([^)]+)\.id\)/g, "router.push(String($1.id))");
replaceInFile('pages-content/recruitmentSubmission/RecruitmentDetailView.tsx', /router\.push\(([^)]+)\.id\)/g, "router.push(String($1.id))");
replaceInFile('pages-content/resnovaComponents/chapterDetail.tsx', /router\.push\(\-1\)/g, "router.back()"); // back should be router.back() not router.push(-1)
replaceInFile('pages-content/resnovaComponents/bookChapterDetail.tsx', /router\.push\(\-1\)/g, "router.back()");
replaceInFile('pages-content/projectsInternshipSubmission/ProjectDetailView.tsx', /router\.push\(\-1\)/g, "router.back()");
replaceInFile('pages-content/recruitmentSubmission/RecruitmentDetailView.tsx', /router\.push\(\-1\)/g, "router.back()");


// 6. NavigateFunction in productUtils.ts
replaceInFile('utils/productUtils.ts', /NavigateFunction/g, "any");

// 7. defaultContact path missing .json
replaceInFile('services/contactService.ts', /defaultContact/g, "defaultContact.json");

// 8. Fix missing state mapping in productBooks.tsx & bookChapter.tsx
const stateFix = { regex: /const state = \(location\.state as any\) \|\| \{\};/g, replacement: "const state: any = {}; // state passed via route is not supported in app router" };
replaceInFile('pages-content/textBookPublications/productBooks.tsx', stateFix.regex, stateFix.replacement);
replaceInFile('pages-content/resnovaComponents/bookChapter.tsx', stateFix.regex, stateFix.replacement);

console.log("TS fixes pass 2 applied.");
