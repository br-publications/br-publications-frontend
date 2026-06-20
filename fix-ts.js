const fs = require('fs');
const path = require('path');

const seoDir = path.join(__dirname);

function replaceInFile(filePath, regex, replacement) {
    const fullPath = path.join(seoDir, filePath);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');
    const newContent = content.replace(regex, replacement);
    if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
    }
}

// 1. Fix location.state and query params in bookChapter and productBooks
replaceInFile('pages-content/resnovaComponents/bookChapter.tsx', /const queryParams = new URLSearchParams\(location\.search\);/g, "const searchParams = useSearchParams(); const queryParams = { get: (k) => searchParams.get(k) };");
replaceInFile('pages-content/resnovaComponents/bookChapter.tsx', /import { usePathname } from 'next\/navigation';/g, "import { usePathname, useSearchParams } from 'next/navigation';");
// Also productBooks
replaceInFile('pages-content/textBookPublications/productBooks.tsx', /const queryParams = new URLSearchParams\(location\.search\);/g, "const searchParams = useSearchParams(); const queryParams = { get: (k) => searchParams.get(k) };");
replaceInFile('pages-content/textBookPublications/productBooks.tsx', /import { usePathname } from 'next\/navigation';/g, "import { usePathname, useSearchParams } from 'next/navigation';");

// Fix the location.state object mapping error: Property 'searchQuery' does not exist on type '{}'
// They used `const state = location.state || {}` then `state.searchQuery`
replaceInFile('pages-content/resnovaComponents/bookChapter.tsx', /const state = location\.state \|\| \{\};/g, "const state = (location.state as any) || {};");
replaceInFile('pages-content/textBookPublications/productBooks.tsx', /const state = location\.state \|\| \{\};/g, "const state = (location.state as any) || {};");

// 2. Fix next/navigation useSearchParams tuple issue in dashboards
const dash1 = 'pages-content/textBookSubmission/adminDashboard/AdminTextBookDashboard.tsx';
const dash2 = 'pages-content/textBookSubmission/authorDashboard/authorTextBookDashboard.tsx';

replaceInFile(dash1, /const \[searchParams, setSearchParams\] = useSearchParams\(\);/g, "const searchParams = useSearchParams();");
replaceInFile(dash1, /setSearchParams\(/g, "/* setSearchParams is not supported in Next.js useSearchParams, use router.push instead */ router.push('?' + new URLSearchParams(");
replaceInFile(dash1, /import { usePathname } from 'next\/navigation';/g, "import { usePathname, useSearchParams } from 'next/navigation';");

replaceInFile(dash2, /const \[searchParams, setSearchParams\] = useSearchParams\(\);/g, "const searchParams = useSearchParams();");
replaceInFile(dash2, /setSearchParams\(/g, "/* setSearchParams is not supported */ router.push('?' + new URLSearchParams(");
replaceInFile(dash2, /import { usePathname } from 'next\/navigation';/g, "import { usePathname, useSearchParams } from 'next/navigation';");


// 3. Fix navigate options `{ state: { book } }` missing in router.push
replaceInFile('pages-content/resnovaComponents/bookChapter.tsx', /, \{ state: \{ book \} \}/g, "");
replaceInFile('pages-content/textBookPublications/productBooks.tsx', /, \{ state: \{ book \} \}/g, "");
replaceInFile('pages-content/resnovaComponents/bookChapterDetail.tsx', /, \{ replace: true \}/g, "");
replaceInFile('pages-content/resnovaComponents/chapterDetail.tsx', /, \{ replace: true \}/g, "");


// 4. Fix ImportMeta env in details pages
replaceInFile('pages-content/resnovaComponents/chapterDetail.tsx', /import\.meta\.env\.VITE_API_BASE_URL \|\| import\.meta\.env\.VITE_API_URL/g, "process.env.NEXT_PUBLIC_API_BASE_URL");
replaceInFile('pages-content/textBookPublications/booksDetail.tsx', /import\.meta\.env\.VITE_API_BASE_URL \|\| import\.meta\.env\.VITE_API_URL/g, "process.env.NEXT_PUBLIC_API_BASE_URL");


// 5. Fix type issue for `chapter.pages` which might be string|number
replaceInFile('pages-content/resnovaComponents/chapterDetail.tsx', /<meta key="firstpage" name="citation_firstpage" content={chapter\.pages\.split\('-'\)\[0\]\.trim\(\)} \/>/g, '<meta key="firstpage" name="citation_firstpage" content={String(chapter.pages).split("-")[0].trim()} />');
replaceInFile('pages-content/resnovaComponents/chapterDetail.tsx', /<meta key="lastpage" name="citation_lastpage" content={chapter\.pages\.split\('-'\)\[1\]\.trim\(\)} \/>/g, '<meta key="lastpage" name="citation_lastpage" content={String(chapter.pages).split("-")[1].trim()} />');
replaceInFile('pages-content/resnovaComponents/chapterDetail.tsx', /chapter\.pages\.includes\('-'\)/g, "String(chapter.pages).includes('-')");

replaceInFile('pages-content/resnovaComponents/bookChapterDetail.tsx', /<meta key="firstpage" name="citation_firstpage" content={chapter\.pages\.split\('-'\)\[0\]\.trim\(\)} \/>/g, '<meta key="firstpage" name="citation_firstpage" content={String(chapter.pages).split("-")[0].trim()} />');
replaceInFile('pages-content/resnovaComponents/bookChapterDetail.tsx', /<meta key="lastpage" name="citation_lastpage" content={chapter\.pages\.split\('-'\)\[1\]\.trim\(\)} \/>/g, '<meta key="lastpage" name="citation_lastpage" content={String(chapter.pages).split("-")[1].trim()} />');
replaceInFile('pages-content/resnovaComponents/bookChapterDetail.tsx', /chapter\.pages\.includes\('-'\)/g, "String(chapter.pages).includes('-')");


// 6. Fix missing defaultContact module
replaceInFile('services/contactService.ts', /\.\.\/assets\/defaultContact/g, "../public/react/assets/defaultContact");

// 7. Fix textBookTypes import
replaceInFile('services/textBookService.ts', /\.\.\/pages\/textBookSubmission\/types\/textBookTypes/g, "../pages-content/textBookSubmission/types/textBookTypes");
replaceInFile('utils/bulkPublisher.ts', /\.\.\/pages\/textBookSubmission\/types\/textBookTypes/g, "../pages-content/textBookSubmission/types/textBookTypes");
replaceInFile('utils/textBookSubmission.hooks.ts', /\.\.\/pages\/textBookSubmission\/types\/textBookTypes/g, "../pages-content/textBookSubmission/types/textBookTypes");

// 8. Fix react-router-dom in utils/productUtils.ts
replaceInFile('utils/productUtils.ts', /from 'react-router-dom';/g, "from 'next/navigation';");
replaceInFile('utils/productUtils.ts', /useLocation/g, "usePathname");

// 9. Fix types/index.ts duplicate exports
replaceInFile('types/index.ts', /export \* from '.\/bookChapterManuscriptTypes';/g, "// export * from './bookChapterManuscriptTypes';");
replaceInFile('types/index.ts', /export \* from '.\/chapterTypes';/g, "// export * from './chapterTypes';");

// 10. `book` missing from state
replaceInFile('pages-content/resnovaComponents/bookChapterDetail.tsx', /const stateBook = location\.state\?\.book/g, "const stateBook = (location.state as any)?.book");
replaceInFile('pages-content/textBookPublications/booksDetail.tsx', /const stateBook = location\.state\?\.book/g, "const stateBook = (location.state as any)?.book");

console.log("Typescript fixes applied.");
