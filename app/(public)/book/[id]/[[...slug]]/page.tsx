import { Suspense } from 'react';
import BooksDetail from '@/pages-content/textBookPublications/booksDetail';
import ChapterDetail from '@/pages-content/resnovaComponents/chapterDetail';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productBooksService } from '@/services/productbooksservice';
import { bookChapterService } from '@/services/bookChapterService';
import { toBookNameSlug } from '@/utils/stringUtils';

interface PageProps {
  params: Promise<{ id: string; slug?: string[] }>;
}

const getAuthorsList = (authorStr?: string, coAuthorStr?: string): string[] => {
  const list: string[] = [];
  if (authorStr) {
    authorStr.split(/, and | and |,/).forEach(a => {
      const trimmed = a.trim();
      if (trimmed) list.push(trimmed);
    });
  }
  if (coAuthorStr) {
    coAuthorStr.split(/, and | and |,/).forEach(a => {
      const trimmed = a.trim();
      if (trimmed) list.push(trimmed);
    });
  }
  return list;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const slug = resolvedParams.slug;
  const isChapter = slug && slug.length > 0 && String(slug[0]).toLowerCase().startsWith('chapter');

  const isNumeric = /^\d+$/.test(id);

  // --- Non-chapter book metadata ---
  if (!isChapter) {
    // productBooksService.getBookById accepts both numeric IDs and uid strings
    // so we can pass the raw `id` directly — no uid scan needed.
    const book = await productBooksService.getBookById(id);
    if (!book) {
      notFound();
    }

    const title = book.title || '';
    // Include brand in title — prevents duplicate <title> from root layout default
    const pageTitle = title ? `${title} | BR Publications` : 'BR Publications';
    let description = 'Detailed information about academic books and research publications from BR Publications.';
    if (book.description) {
      description = book.description.replace(/<[^>]+>/g, '').trim().slice(0, 160);
    } else if (book.synopsis) {
      description = Object.values(book.synopsis).join(' ').replace(/<[^>]+>/g, '').trim().slice(0, 160);
    } else {
      description = `${book.title} by ${book.author} — published by BR Publications.`;
    }

    const authorsList = getAuthorsList(book.author, book["co-authors"]);
    const identifier = book.uid ? book.uid.toLowerCase() : book.id;
    const bookSlug = book.title ? toBookNameSlug(book.title) : '';
    const canonical = bookSlug
      ? `https://www.brpublications.com/book/${identifier}/${bookSlug}`
      : `https://www.brpublications.com/book/${identifier}`;

    // Detect garbage/test keywords and replace with meaningful auto-generated ones
    const rawKeywords = book.keywords && book.keywords.length > 0 ? book.keywords.join(', ') : '';
    const looksLikeTestData = rawKeywords.length > 0 && rawKeywords.split(',').every(k => k.trim().length < 8 || /^[a-z]{3,8}$/i.test(k.trim()));
    const cleanKeywords = (!rawKeywords || looksLikeTestData)
      ? `${book.title}, ${book.author ?? ''}, ${book.isbn}, academic book, BR Publications, peer-reviewed`
      : rawKeywords;

    const publishYear = (book.publishedDate || '').split('-')[0] || '';

    return {
      title: {
        absolute: pageTitle
      },
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title: book.title || undefined,
        description,
        type: 'book',
        url: canonical,
        images: book.coverImage ? [{ url: book.coverImage }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: book.title || undefined,
        description,
        images: book.coverImage ? [book.coverImage] : [],
      },
      other: {
        'keywords': cleanKeywords,
        // Google Scholar citation tags
        'citation_title': book.title || '',
        ...(authorsList.length > 0 ? { 'citation_author': authorsList } : {}),
        ...(publishYear ? { 'citation_publication_date': publishYear } : {}),
        'citation_isbn': book.isbn || '',
        'citation_publisher': 'BR Publications',
        'citation_language': 'en',
        'citation_abstract_html_url': canonical,
        'citation_fulltext_html_url': canonical,
        ...(book.id && book.pdfUniqueId ? {
          'citation_pdf_url': `https://api-dev.brpublications.com/api/books/${book.id}/pdf/${book.pdfUniqueId}`,
        } : {}),
        ...(book.doi ? { 'citation_doi': book.doi } : {}),
        // Dublin Core — picked up by DOAJ, EBSCO, BASE, and other academic indexers
        'dc.title': book.title || '',
        ...(authorsList.length > 0 ? { 'dc.creator': authorsList } : {}),
        'dc.publisher': 'BR Publications',
        ...(publishYear ? { 'dc.date': publishYear } : {}),
        'dc.identifier': book.doi ? [book.isbn, book.doi] : (book.isbn || ''),
        'dc.type': 'Book',
        'dc.language': 'en',
        'dc.description': description,
      }
    };
  }

  // --- Chapter metadata: needs numeric book ID ---
  let numericId: number | null = null;
  if (isNumeric) {
    numericId = parseInt(id, 10);
  } else {
    // For chapter paths, resolve uid -> numeric id via bookChapterService
    try {
      const allBooks = await bookChapterService.getAllBooks();
      const matchedBook = allBooks.find(b => b.uid && b.uid.toLowerCase() === id.toLowerCase());
      if (matchedBook) {
        numericId = matchedBook.id;
      }
    } catch (e) {
      console.error("Metadata resolution: chapter uid mapping failed", e);
    }
  }

  if (!numericId) {
    notFound();
  }

  const fetchedBook = await bookChapterService.getBookById(numericId);
  if (!fetchedBook || !fetchedBook.chapters) {
    notFound();
  }
  let chapterIdStr = slug[0].toLowerCase().trim();
  if (chapterIdStr === 'chapter' && slug.length > 1) {
    chapterIdStr = `chapter-${slug[1]}`;
  }
  const rawParam = chapterIdStr;
  const cleanParam = rawParam.replace(/^chapter[-_ \s]*/, '');
  const parsedParamInt = parseInt(cleanParam, 10);

  const chapter = fetchedBook.chapters.find(c => {
    const rawChapNum = String(c.chapterNumber).toLowerCase().trim();
    const cleanChapNum = rawChapNum.replace(/^chapter[-_ \s]*/, '').replace(/\s+/g, '');
    const parsedChapInt = parseInt(cleanChapNum, 10);
    return (
      rawChapNum === rawParam ||
      cleanChapNum === cleanParam ||
      (!isNaN(parsedParamInt) && !isNaN(parsedChapInt) && parsedParamInt === parsedChapInt)
    );
  });

  if (!chapter) {
    notFound();
  }

  const authorNames = chapter.authorDetails && chapter.authorDetails.length > 0
    ? chapter.authorDetails.map(a => a.name).join(', ')
    : chapter.authors || '';

  // Include brand suffix — prevents duplicate <title> from root layout default
  const title = `${chapter.title} | ${fetchedBook.title} | BR Publications`;
  const description = chapter.abstract
    ? chapter.abstract.slice(0, 155)
    : `${chapter.title} — a chapter from "${fetchedBook.title}" published by BR Publications.`;

  const bookIdentifier = fetchedBook.uid ? fetchedBook.uid.toLowerCase() : fetchedBook.id;
  const cleanChapterNum = String(chapter.chapterNumber).toLowerCase().trim().replace(/^chapter[-_ \s]*/, '');
  const chapterSlugSegment = `chapter-${cleanChapterNum}`;
  const chapterTitleSlug = chapter.title ? toBookNameSlug(chapter.title) : '';
  const canonical = chapterTitleSlug
    ? `https://www.brpublications.com/book/${bookIdentifier}/${chapterSlugSegment}/${chapterTitleSlug}`
    : `https://www.brpublications.com/book/${bookIdentifier}/${chapterSlugSegment}`;

  return {
    title: {
      absolute: title
    },
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: chapter.title || undefined,
      description,
      type: 'article',
      url: canonical,
      images: fetchedBook.coverImage ? [{ url: fetchedBook.coverImage }] : [],
    },
    other: {
      'keywords': `${chapter.title}, ${authorNames}, ${fetchedBook.title}, ${fetchedBook.isbn}, book chapter, academic research, BR Publications`,
      'citation_title': chapter.title || '',
      ...(chapter.authorDetails && chapter.authorDetails.length > 0 ? {
        'citation_author': chapter.authorDetails.map(a => a.name),
      } : (chapter.authors ? { 'citation_author': [chapter.authors] } : {})),
      ...((fetchedBook.publishedDate || fetchedBook.releaseDate) ? {
        'citation_publication_date': fetchedBook.publishedDate || fetchedBook.releaseDate,
      } : {}),
      'citation_inbook_title': fetchedBook.title || '',
      ...(fetchedBook.editors && fetchedBook.editors.length > 0 ? {
        'citation_editor': fetchedBook.editors,
      } : {}),
      'citation_publisher': 'BR Publications',
      'citation_isbn': fetchedBook.isbn || '',
      'citation_language': 'en',
      'citation_abstract_html_url': canonical,
      'citation_fulltext_html_url': canonical,
      ...(chapter.pages && String(chapter.pages).includes('-') ? {
        'citation_firstpage': String(chapter.pages).split('-')[0].trim(),
        'citation_lastpage': String(chapter.pages).split('-')[1].trim(),
      } : (chapter.pages ? { 'citation_firstpage': chapter.pages } : {})),
      'citation_pdf_url': `https://api-dev.brpublications.com/api/book-chapter-publishing/${numericId}/toc/${Math.max(0, parseInt(cleanChapterNum, 10) - 1)}/pdf`,
      ...(chapter.doi ? { 'citation_doi': chapter.doi } : {}),
    }
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const slug = resolvedParams.slug;
  const isChapter = slug && slug.length > 0 && String(slug[0]).toLowerCase().startsWith('chapter');
  
  // Permanent Redirect to enforce Canonical URL
  const currentSlugStr = slug ? slug.join('/') : '';
  const { permanentRedirect } = await import('next/navigation');
  
  let bookData = null;
  let chapterData = null;

  if (!isChapter) {
    try {
      const book = await productBooksService.getBookById(id);
      bookData = book;
      if (book) {
        const expectedIdentifier = book.uid ? book.uid.toLowerCase() : String(book.id);
        const expectedSlug = book.title ? toBookNameSlug(book.title) : '';
        
        if (id.toLowerCase() !== expectedIdentifier || currentSlugStr !== expectedSlug) {
          const canonicalUrl = expectedSlug ? `/book/${expectedIdentifier}/${expectedSlug}` : `/book/${expectedIdentifier}`;
          permanentRedirect(canonicalUrl);
        }
      } else {
        notFound();
      }
    } catch (e) {
      if ((e as any).digest === 'NEXT_REDIRECT' || (e as any).digest === 'NEXT_NOT_FOUND') {
        throw e;
      }
      notFound();
    }
  } else {
    let chapterIdStr = String(slug[0]).toLowerCase().trim();
    if (chapterIdStr === 'chapter' && slug.length > 1) {
      chapterIdStr = `chapter-${slug[1]}`;
    }
    const cleanParam = chapterIdStr.replace(/^chapter[-_ \s]*/, '');
    let numericId: number | null = null;
    if (/^\d+$/.test(id)) {
      numericId = parseInt(id, 10);
    } else {
      try {
        const allBooks = await bookChapterService.getAllBooks();
        const matchedBook = allBooks.find(b => b.uid && b.uid.toLowerCase() === id.toLowerCase());
        if (matchedBook) numericId = matchedBook.id;
      } catch (e) {}
    }
    
    if (numericId) {
      try {
        const fetchedBook = await bookChapterService.getBookById(numericId);
        if (fetchedBook && fetchedBook.chapters) {
          const parsedParamInt = parseInt(cleanParam, 10);
          const chapter = fetchedBook.chapters.find(c => {
            const rawChapNum = String(c.chapterNumber).toLowerCase().trim();
            const cleanChapNum = rawChapNum.replace(/^chapter[-_ \s]*/, '').replace(/\s+/g, '');
            const parsedChapInt = parseInt(cleanChapNum, 10);
            return (
              rawChapNum === chapterIdStr ||
              cleanChapNum === cleanParam ||
              (!isNaN(parsedParamInt) && !isNaN(parsedChapInt) && parsedParamInt === parsedChapInt)
            );
          });

          if (chapter) {
            bookData = fetchedBook;
            chapterData = chapter;
            const bookIdentifier = fetchedBook.uid ? fetchedBook.uid.toLowerCase() : String(fetchedBook.id);
            const expectedChapterNum = String(chapter.chapterNumber).toLowerCase().trim().replace(/^chapter[-_ \s]*/, '');
            const expectedSlug0 = `chapter-${expectedChapterNum}`;
            const chapterTitleSlug = chapter.title ? toBookNameSlug(chapter.title) : '';
            const expectedSlugStr = chapterTitleSlug ? `${expectedSlug0}/${chapterTitleSlug}` : expectedSlug0;
            
            if (id.toLowerCase() !== bookIdentifier || currentSlugStr !== expectedSlugStr) {
              const canonicalUrl = `/book/${bookIdentifier}/${expectedSlugStr}`;
              permanentRedirect(canonicalUrl);
            }
          } else {
            notFound();
          }
        } else {
          notFound();
        }
      } catch (e) {
        if ((e as any).digest === 'NEXT_REDIRECT' || (e as any).digest === 'NEXT_NOT_FOUND') {
          throw e;
        }
        notFound();
      }
    } else {
      notFound();
    }
  }

  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      {isChapter ? <ChapterDetail initialBook={bookData} initialChapter={chapterData} /> : <BooksDetail initialData={bookData} />}
    </Suspense>
  );
}
