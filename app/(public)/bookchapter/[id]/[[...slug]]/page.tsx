import { Suspense } from 'react';
import Component from '@/pages-content/resnovaComponents/bookChapterDetail';
import type { Metadata } from 'next';
import { bookChapterService } from '@/services/bookChapterService';
import { toBookNameSlug } from '@/utils/stringUtils';

interface PageProps {
  params: Promise<{ id: string; slug?: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  let numericId: number | null = null;
  const isNumeric = /^\d+$/.test(id);
  if (isNumeric) {
    numericId = parseInt(id, 10);
  } else {
    try {
      const allBooks = await bookChapterService.getAllBooks();
      const matchedBook = allBooks.find(b => b.uid && b.uid.toLowerCase() === id.toLowerCase());
      if (matchedBook) {
        numericId = matchedBook.id;
      }
    } catch (e) {
      console.error("Metadata resolution: uid mapping failed", e);
    }
  }

  if (!numericId) {
    return {
      title: { absolute: 'Book Not Found' },
      robots: 'noindex, follow',
    };
  }

  const book = await bookChapterService.getBookById(numericId);
  if (!book) {
    return {
      title: { absolute: 'Book Not Found' },
      robots: 'noindex, follow',
    };
  }

  const displayTitle = `${book.title}${book.editors && book.editors.length > 0 ? ` by ${book.editors.join(', ')}` : book.author ? ` by ${book.author}` : ''}`;
  // Include brand suffix — prevents duplicate <title> from root layout default
  const pageTitle = `${displayTitle} | BR Publications`;
  const editorsStr = book && Array.isArray(book.editors) && book.editors.length > 0
    ? `Editors: ${book.editors.join(', ')}.`
    : book.author ? `By ${book.author}.` : '';

  let metaDescription = 'Detailed information about academic book chapters and research publications from BR Publications.';
  if (book.description) {
    metaDescription = book.description.replace(/<[^>]+>/g, '').trim().slice(0, 160);
  } else if (book.synopsis) {
    metaDescription = Object.values(book.synopsis).join(' ').replace(/<[^>]+>/g, '').trim().slice(0, 160);
  } else {
    metaDescription = `${book.title}. ${editorsStr} Published by BR ResNova Academic Press.`;
  }

  const identifier = book.uid ? book.uid.toLowerCase() : book.id;
  const bookSlug = book.title ? toBookNameSlug(book.title) : '';
  const canonicalUrlFull = bookSlug
    ? `https://www.brpublications.com/bookchapter/${identifier}/${bookSlug}`
    : `https://www.brpublications.com/bookchapter/${identifier}`;

  // Build a clean keyword string — skip DB keywords that look like test/placeholder data
  const rawKeywords = book.keywords && book.keywords.length > 0 ? book.keywords.join(', ') : '';
  const looksLikeTestData = rawKeywords.length > 0 && rawKeywords.split(',').every(k => k.trim().length < 8 || /^[a-z]{3,8}$/i.test(k.trim()));
  const cleanKeywords = (!rawKeywords || looksLikeTestData)
    ? `${book.title}, ${(book.editors ?? [book.author ?? '']).join(', ')}, ${book.isbn}, book chapter, academic research, BR Publications, BR ResNova`
    : rawKeywords;

  const editorsList = Array.isArray(book.editors) && book.editors.length > 0 ? book.editors : [];
  const authorEntry = !editorsList.length && book.author ? [book.author] : [];
  const publishYear = (book.publishedDate || book.releaseDate || '').split('-')[0] || '';

  return {
    title: {
      absolute: pageTitle
    },
    description: metaDescription,
    alternates: {
      canonical: canonicalUrlFull,
    },
    openGraph: {
      title: book.title || undefined,
      description: metaDescription,
      type: 'book',
      url: canonicalUrlFull,
      images: book.coverImage ? [{ url: book.coverImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: book.title || undefined,
      description: metaDescription,
      images: book.coverImage ? [book.coverImage] : [],
    },
    other: {
      'keywords': cleanKeywords,
      // Google Scholar citation tags
      'citation_title': book.title || '',
      // citation_editor for edited volumes, citation_author for single-author books
      ...(editorsList.length > 0 ? { 'citation_editor': editorsList } : {}),
      ...(authorEntry.length > 0 ? { 'citation_author': authorEntry } : {}),
      ...(publishYear ? { 'citation_publication_date': publishYear } : {}),
      'citation_isbn': book.isbn || '',
      'citation_publisher': 'BR ResNova Academic Press',
      'citation_language': 'en',
      'citation_abstract_html_url': canonicalUrlFull,
      'citation_fulltext_html_url': canonicalUrlFull,
      // TOC PDF — uses numeric book ID only (not uid)
      'citation_pdf_url': `https://api-dev.brpublications.com/api/book-chapter-publishing/${numericId}/extra-pdf/Detailed%20Table%20of%20Contents`,
      ...(book.doi ? { 'citation_doi': book.doi } : {}),
      // Dublin Core — picked up by DOAJ, EBSCO, and other academic indexers
      'dc.title': book.title || '',
      ...(editorsList.length > 0 ? { 'dc.contributor': editorsList } : {}),
      ...(authorEntry.length > 0 ? { 'dc.creator': authorEntry } : {}),
      'dc.publisher': 'BR ResNova Academic Press',
      ...(publishYear ? { 'dc.date': publishYear } : {}),
      'dc.identifier': book.doi ? [book.isbn, book.doi] : (book.isbn || ''),
      'dc.type': 'Book',
      'dc.language': 'en',
      'dc.description': metaDescription,
    }
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <Component />
    </Suspense>
  );
}
