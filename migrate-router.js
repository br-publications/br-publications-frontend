const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, 'components'),
    path.join(__dirname, 'pages-content')
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Prepend 'use client' if it imports react hooks or router or context
    if (content.match(/from ['"]react['"]/) || content.match(/from ['"]react-router-dom['"]/) || content.match(/@mui/)) {
        if (!content.includes("'use client'") && !content.includes('"use client"')) {
            content = "'use client';\n" + content;
        }
    }

    // 2. Handle Link imports
    if (content.includes("Link") && content.match(/from ['"]react-router-dom['"]/)) {
        // Remove Link from react-router-dom import if it's there
        content = content.replace(/(import\s*{[^}]*)(,\s*Link|Link\s*,|\s*Link\s*)([^}]*}\s*from\s*['"]react-router-dom['"];?)/g, (match, p1, p2, p3) => {
             const cleanP1 = p1.replace(/,\s*$/, '').trim();
             const cleanP3 = p3.replace(/^,/, '').trim();
             if (cleanP1 === 'import {' && cleanP3.startsWith('}')) {
                 return ''; // removed the whole import if it's empty
             }
             return cleanP1 + ' ' + cleanP3;
        });
        
        // Add next/link import if not present
        if (!content.includes("import Link from 'next/link'") && !content.includes('import Link from "next/link"')) {
            // Add after the last import
            content = content.replace(/(import.*?;?\n)(?!import)/s, "$1import Link from 'next/link';\n");
        }
    }

    // 3. Handle useNavigate -> useRouter
    if (content.includes('useNavigate')) {
        content = content.replace(/useNavigate/g, 'useRouter');
        content = content.replace(/navigate\(/g, 'router.push(');
        content = content.replace(/const navigate\s*=\s*useRouter\(\)/g, 'const router = useRouter()');
        content = content.replace(/navigate\./g, 'router.');
    }

    // 4. Handle useLocation -> usePathname
    if (content.includes('useLocation')) {
        content = content.replace(/useLocation/g, 'usePathname');
        content = content.replace(/const location\s*=\s*usePathname\(\)/g, 'const location = { pathname: usePathname(), state: {}, search: "" }');
    }

    // 5. Replace react-router-dom imports with next/navigation
    content = content.replace(/from ['"]react-router-dom['"]/g, "from 'next/navigation'");

    // 6. Handle Link to -> Link href
    content = content.replace(/<Link([^>]*?)to=/g, '<Link$1href=');

    // 7. Handle location.state manually since nextjs doesn't have it (this is a rough fix to prevent crashes)
    // Most location.state usage will be broken and need manual fixing, but this prevents compile errors
    // We already shimmed `location` in step 4.

    // 8. Clean up empty imports from next/navigation
    content = content.replace(/import\s*{\s*}\s*from\s*['"]next\/navigation['"];?/g, '');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

dirs.forEach(walkDir);
console.log('Migration script complete.');
