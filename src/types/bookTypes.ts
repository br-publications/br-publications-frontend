// src/types/book.types.ts

export interface Book {
  id: number;
  title: string;
  author: string;
  "co-authors"?: string;
  editors?: string[];
  primaryEditor?: string;
  coverImage: string;
  category: string;
  description: string;
  indexedIn?: string;
  releaseDate?: string;
  copyright?: string;
  doi?: string;
  isbn: string;
  publishedDate: string;
  pages: number;
  synopsis?: SynopsisSection;
  scope?: ScopeSection;
  tableContents?: TableOfContentsSection;
  authorBiographies?: AuthorBiographiesSection;
  archives?: ArchivesSection;
  pricing?: {
    softCopyPrice?: number;
    hardCopyPrice?: number;
    combinedPrice?: number;
    bundlePrice?: number;
  };
  googleLink?: string;
  flipkartLink?: string;
  amazonLink?: string;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string | number; // normalized chapters use numeric IDs
  chapterNumber: string; // e.g., "Chapter 1"
  title: string;
  authors: string;
  abstract: string;
  price: number;
  pages: string;
  pdfUrl?: string;
  views?: number;
  authorDetails?: PublishedAuthor[];
}

export interface PublishedAuthor {
  id: number;
  name: string;
  email?: string;
  affiliation?: string;
  biography?: string;
}

export interface SynopsisSection {
  [key: string]: string; // paragraph_1, paragraph_2, etc.
}

export interface ScopeSection {
  [key: string]: string; // paragrapgh_1, list_1, list_2, etc.
}

export interface TableOfContentsSection {
  [key: string]: string; // list_1, list_2, etc.
}

export interface AuthorBiography {
  authorName: string;
  biography: string;
}

export interface AuthorBiographiesSection {
  [key: string]: AuthorBiography; // author_1, author_2, etc.
}

export interface ArchivesSection {
  [key: string]: string; // paragrapgh_1, list_1, list_2, etc.
}

export interface BooksResponse {
  books: Book[];
  total: number;
}

export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

// Helper type to determine if a key contains list items
export type SectionContent = {
  paragraphs: string[];
  lists: string[];
};