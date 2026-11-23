import { MetadataRoute } from 'next';

/**
 * Converts a string into a URL-friendly slug.
 * Example: "Hello World! @2024" -> "hello-world-2024"
 */
const toSlug = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars (except -)
    .replace(/--+/g, '-')           // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

/**
 * Converts a book title into a clean SEO-friendly slug.
 * Truncates at max 60 characters and aligns to natural word boundaries.
 */
const toBookNameSlug = (text: string): string => {
  if (!text) return '';
  const slug = toSlug(text);
  if (slug.length <= 60) return slug;
  
  // Truncate to 60 characters
  let truncated = slug.slice(0, 60);
  
  // Back up to the last complete word/hyphen boundary to avoid cutting a word in half
  const lastHyphenIndex = truncated.lastIndexOf('-');
  if (lastHyphenIndex > 0) {
    truncated = truncated.slice(0, lastHyphenIndex);
  }
  
  return truncated.replace(/-+$/, '');
};

/**
 * Returns the most reliable "last changed" date of a record, or undefined.
 * We deliberately never fall back to `new Date()`: a lastmod that changes on
 * every build makes Google ignore lastmod for the entire sitemap.
 */
const pickDate = (item: any): Date | undefined => {
  if (!item) return undefined;
  for (const key of ['updatedAt', 'publishedAt', 'publishDate', 'createdAt']) {
    if (item[key]) {
      const d = new Date(item[key]);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return undefined;
};

/**
 * Static pages: bump the matching date ONLY when that page's content really
 * changes (YYYY-MM-DD). Listing pages use the newest record date at runtime.
 */
const STATIC_LASTMOD = {
  contact: new Date('2026-01-01'),
  about: new Date('2026-01-01'),
  ipr: new Date('2026-01-01'),
  resnova: new Date('2026-01-01'),
};

const latest = (dates: (Date | undefined)[], fallback?: Date): Date | undefined => {
  const valid = dates.filter((d): d is Date => !!d);
  if (!valid.length) return fallback;
  return new Date(Math.max(...valid.map((d) => d.getTime())));
};

export const revalidate = 43200; // 12 hours in seconds

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.brpublications.com';
  const BASE_URL = 'https://www.brpublications.com';
  
  const urls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: undefined, // set below from newest record
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/books`,
      lastModified: undefined, // set below from newest book
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/bookchapters`,
      lastModified: undefined, // set below from newest book chapter
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: STATIC_LASTMOD.contact,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: STATIC_LASTMOD.about,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/ipr`,
      lastModified: STATIC_LASTMOD.ipr,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/resnova`,
      lastModified: STATIC_LASTMOD.resnova,
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  ];

  const bookDates: (Date | undefined)[] = [];
  const bcDates: (Date | undefined)[] = [];

  try {
    // 1. Fetch Books
    const booksRes = await fetch(`${API_URL}/api/books?limit=500`, { next: { revalidate: 43200 } });
    if (booksRes.ok) {
      const booksData = await booksRes.json();
      const books = booksData.data?.books || booksData.books || [];
      books.forEach((book: any) => {
        let identifierStr = book.uid ? String(book.uid).toLowerCase() : String(book.id);
        if (/^\d+$/.test(identifierStr)) {
          identifierStr = parseInt(identifierStr, 10).toString();
        }
        
        const slug = book.title ? toBookNameSlug(book.title) : '';
        bookDates.push(pickDate(book));
        urls.push({
          url: `${BASE_URL}/book/${identifierStr}/${slug}`,
          lastModified: pickDate(book),
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      });
    }

    // 2. Fetch BookChapters and their nested chapters
    const bcRes = await fetch(`${API_URL}/api/book-chapter-publishing?limit=500`, { next: { revalidate: 43200 } });
    if (bcRes.ok) {
      const bcData = await bcRes.json();
      // The endpoint might return paginated { data: { items: [] } } or { data: [] }
      let bookChapters = [];
      if (Array.isArray(bcData.data)) {
        bookChapters = bcData.data;
      } else if (bcData.data?.items && Array.isArray(bcData.data.items)) {
        bookChapters = bcData.data.items;
      } else if (bcData.items && Array.isArray(bcData.items)) {
        bookChapters = bcData.items;
      } else if (Array.isArray(bcData)) {
        bookChapters = bcData;
      }
      
      await Promise.all(bookChapters.map(async (bc: any) => {
        let identifierStr = bc.uid ? String(bc.uid).toLowerCase() : String(bc.id);
        if (/^\d+$/.test(identifierStr)) {
          identifierStr = parseInt(identifierStr, 10).toString();
        }
        
        const slug = bc.title ? toBookNameSlug(bc.title) : '';
        bcDates.push(pickDate(bc));
        
        urls.push({
          url: `${BASE_URL}/bookchapter/${identifierStr}/${slug}`,
          lastModified: pickDate(bc),
          changeFrequency: 'monthly',
          priority: 0.8,
        });

        // Add individual chapters for this bookchapter
        let chaptersList = [];
        if (bc.chapters && Array.isArray(bc.chapters) && bc.chapters.length > 0) {
          chaptersList = bc.chapters;
        } else if (typeof bc.tableContents === 'string') {
          try {
            chaptersList = JSON.parse(bc.tableContents);
          } catch (e) {}
        } else if (Array.isArray(bc.tableContents)) {
          chaptersList = bc.tableContents;
        }

        // If list response lacks chapters, fetch detail endpoint
        if ((!chaptersList || chaptersList.length === 0) && bc.id) {
          try {
            const detailRes = await fetch(`${API_URL}/api/book-chapter-publishing/${bc.id}`, { next: { revalidate: 43200 } });
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              const detailBc = detailData.data || detailData;
              if (detailBc.chapters && Array.isArray(detailBc.chapters)) {
                chaptersList = detailBc.chapters;
              } else if (typeof detailBc.tableContents === 'string') {
                try { chaptersList = JSON.parse(detailBc.tableContents); } catch (e) {}
              } else if (Array.isArray(detailBc.tableContents)) {
                chaptersList = detailBc.tableContents;
              }
            }
          } catch (e) {
            console.error(`Failed to fetch details for bookchapter ${bc.id} in sitemap`);
          }
        }

        if (chaptersList && Array.isArray(chaptersList)) {
          chaptersList.forEach((chapter: any, index: number) => {
             // Use parseInt to remove leading zeros (e.g. "01" -> "1")
             const rawNum = chapter.chapterNumber || String(index + 1);
             const chapterNumStr = parseInt(rawNum, 10).toString();
             const chapterSlug = chapter.title ? toBookNameSlug(chapter.title) : '';
             
             urls.push({
               url: `${BASE_URL}/book/${identifierStr}/chapter-${chapterNumStr}/${chapterSlug}`,
               lastModified: pickDate(chapter) ?? pickDate(bc),
               changeFrequency: 'monthly',
               priority: 0.7,
             });
          });
        }
      }));
    }

    // 3. Fetch Authors
    const authRes = await fetch(`${API_URL}/api/book-chapter-publishing/authors`, { next: { revalidate: 43200 } });
    if (authRes.ok) {
      const authData = await authRes.json();
      let authors = [];
      if (Array.isArray(authData.data)) {
        authors = authData.data;
      } else if (Array.isArray(authData)) {
        authors = authData;
      }
      authors.forEach((author: any) => {
        const slug = author.name ? toBookNameSlug(author.name) : '';
        urls.push({
          url: `${BASE_URL}/author/${author.id}/${slug}`,
          lastModified: pickDate(author),
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      });
    }

    // 4. Fetch Editors
    const editRes = await fetch(`${API_URL}/api/book-chapter-publishing/editors`, { next: { revalidate: 43200 } });
    if (editRes.ok) {
      const editData = await editRes.json();
      let editors = [];
      if (Array.isArray(editData.data)) {
        editors = editData.data;
      } else if (Array.isArray(editData)) {
        editors = editData;
      }
      editors.forEach((editor: any) => {
        const slug = editor.name ? toBookNameSlug(editor.name) : '';
        urls.push({
          url: `${BASE_URL}/editor/${editor.id}/${slug}`,
          lastModified: pickDate(editor),
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      });
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  // Listing pages change when their newest item changes.
  const newestBook = latest(bookDates);
  const newestBc = latest(bcDates);
  urls[0].lastModified = latest([newestBook, newestBc]);
  urls[1].lastModified = newestBook;
  urls[2].lastModified = newestBc;

  return urls;
}
