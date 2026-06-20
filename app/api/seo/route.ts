import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.brpublications.com';

async function fetchAPI(endpoint: string) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const urlPath = request.nextUrl.searchParams.get('path') || request.nextUrl.pathname;
  
  // Redirect padded numbers (e.g. 03 or chapter-02) for SEO canonicalization
  const pathSegments = urlPath.split('/');
  let needsRedirect = false;
  const cleanSegments = pathSegments.map(segment => {
    if (/^0+\d+$/.test(segment)) {
      needsRedirect = true;
      return parseInt(segment, 10).toString();
    }
    const chapMatch = segment.match(/^(chapter[-_ \s]*)0+(\d+)$/i);
    if (chapMatch) {
      needsRedirect = true;
      return `${chapMatch[1]}${chapMatch[2]}`;
    }
    return segment;
  });

  if (needsRedirect) {
    const cleanUrl = cleanSegments.join('/');
    // Check if it has query params
    const searchParams = request.nextUrl.search;
    return new Response('Moved Permanently', {
      status: 301,
      headers: {
        'Location': `${request.nextUrl.origin}${cleanUrl}${searchParams}`
      }
    });
  }

  const indexPath = path.join(process.cwd(), 'public', 'react', 'index.html');
  let html = '';
  try {
    html = fs.readFileSync(indexPath, 'utf8');
  } catch (err) {
    return new Response('React SPA not found' + err, { status: 500 });
  }

  let metaTags = '';
  let title = '';

  try {
    if (urlPath.startsWith('/bookchapter/') && !urlPath.includes('/chapter-')) {
      // It's a book chapter details page: /bookchapter/:id/:slug
      const parts = urlPath.split('/');
      const id = parts[2];
      if (id) {
         const book = await fetchAPI(`/api/book-chapter-publishing/${id}`);
         if (book) {
            title = `${book.title} | BR Publications`;
            metaTags = `
              <meta name="description" content="${(book.description || book.abstract || '').slice(0, 160)}">
              <meta name="citation_title" content="${book.title}">
              <meta name="citation_isbn" content="${book.isbn || ''}">
            `;
            if (book.author) metaTags += `<meta name="citation_author" content="${book.author}">`;
            if (book.editors) {
               let editorsList: string[] = [];
               if (typeof book.editors === 'string') {
                   try {
                       const parsed = JSON.parse(book.editors);
                       if (Array.isArray(parsed)) editorsList = parsed;
                       else editorsList = [book.editors];
                   } catch {
                       editorsList = book.editors.split(',').map((e: string) => e.trim());
                   }
               } else if (Array.isArray(book.editors)) {
                   editorsList = book.editors;
               }
               editorsList.forEach((ed: string) => {
                  if (ed) metaTags += `<meta name="citation_editor" content="${ed}">`;
               });
            }
         }
      }
    } else if (urlPath.startsWith('/book/')) {
      // Could be /book/:id/:slug or /book/:id/chapter-:num/:slug
      const parts = urlPath.split('/');
      const id = parts[2];
      const chapterPart = parts[3]; // e.g. chapter-04
      
      const book = await fetchAPI(`/api/book-chapter-publishing/${id}`);
      if (book) {
         if (chapterPart && chapterPart.startsWith('chapter-')) {
            // It's a chapter
            const chapterNum = chapterPart.replace('chapter-', '');
            const chapter = book.chapters?.find((c: any) => String(c.chapterNumber).padStart(2, '0') === chapterNum.padStart(2, '0'));
            if (chapter) {
               title = `${chapter.title} | ${book.title}`;
               metaTags = `
                 <meta name="description" content="${(chapter.abstract || '').slice(0, 160)}">
                 <meta name="citation_title" content="${chapter.title}">
                 <meta name="citation_inbook_title" content="${book.title}">
                 <meta name="citation_isbn" content="${book.isbn || ''}">
               `;
               if (chapter.authors) metaTags += `<meta name="citation_author" content="${chapter.authors}">`;
               if (chapter.pages) {
                  const pagesStr = String(chapter.pages);
                  if (pagesStr.includes('-')) {
                      const [first, last] = pagesStr.split('-');
                      if (first) metaTags += `<meta name="citation_firstpage" content="${first.trim()}">`;
                      if (last) metaTags += `<meta name="citation_lastpage" content="${last.trim()}">`;
                  } else {
                      metaTags += `<meta name="citation_firstpage" content="${pagesStr}">`;
                  }
               }
            }
         } else {
            // It's just a book
            title = `${book.title} | BR Publications`;
            metaTags = `
              <meta name="description" content="${(book.description || '').slice(0, 160)}">
              <meta name="citation_title" content="${book.title}">
              <meta name="citation_isbn" content="${book.isbn || ''}">
            `;
         }
      }
    } else if (urlPath.startsWith('/author/')) {
      const parts = urlPath.split('/');
      const id = parts[2];
      // Note: adjust API endpoint if different
      const authors = await fetchAPI(`/api/book-chapter-publishing/authors?name=${id}`);
      if (authors && authors.length > 0) {
         title = `${authors[0].name} - Author | BR Publications`;
         metaTags = `
           <meta name="description" content="Publications and profile for ${authors[0].name}">
         `;
      }
    } else if (urlPath.startsWith('/editor/')) {
      const parts = urlPath.split('/');
      const id = parts[2];
      const editor = await fetchAPI(`/api/book-chapter-publishing/editors/${id}`);
      if (editor) {
         title = `${editor.name} - Editor | BR Publications`;
         metaTags = `
           <meta name="description" content="Editorial profile for ${editor.name}">
         `;
      }
    } else if (urlPath === '/books' || urlPath === '/bookchapters') {
       title = `Books & Chapters | BR Publications`;
       metaTags = `
         <meta name="description" content="Browse our collection of published books and chapters.">
       `;
    } else if (urlPath === '/about') {
       title = `About Us | BR Publications`;
       metaTags = `
         <meta name="description" content="Learn more about BR Publications, our mission, and our commitment to academic excellence.">
       `;
    } else if (urlPath === '/contact') {
       title = `Contact Us | BR Publications`;
       metaTags = `
         <meta name="description" content="Get in touch with BR Publications for inquiries, support, and publication services.">
       `;
    } else if (urlPath === '/ipr') {
       title = `Intellectual Property Rights (IPR) | BR Publications`;
       metaTags = `
         <meta name="description" content="Protect your intellectual property with our comprehensive IPR, patent, and copyright services.">
       `;
    } else if (urlPath === '/resnova') {
       title = `BR ResNova | BR Publications`;
       metaTags = `
         <meta name="description" content="BR ResNova Academic Press: Fostering innovative academic research and publications.">
       `;
    }
  } catch (err) {
    console.error('SEO Proxy Error:', err);
  }

  // Inject meta tags
  if (metaTags || title) {
    // Add canonical URL
    const canonical = `https://www.brpublications.com${urlPath}`;
    metaTags += `\n    <link rel="canonical" href="${canonical}">`;
    
    // Replace the <title> tag in the React HTML if we generated a specific one
    if (title) {
        html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    } else {
        html = html.replace(/<title>.*?<\/title>/, `<title>BR Publications</title>`);
    }

    html = html.replace('</head>', `${metaTags}\n  </head>`);
  }

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
