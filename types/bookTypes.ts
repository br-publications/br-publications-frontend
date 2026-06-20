// src/types/book.types.ts

export interface Book {
  id: number;
  uid?: string;
  title: string;
  author: string;
  "co-authors"?: string;
  editors?: string[];
  keywords?: string[];
  primaryEditor?: string;
  editorDetails?: PublishedEditor[];
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
  editorBiographies?: EditorBiographiesSection;
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
  pdfUniqueId?: string;
  chapters?: Chapter[];
  frontmatterPdfs?: Record<string, { pdfKey?: string; mimeType?: string; name?: string; }>;
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
  doi?: string;
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

export interface PublishedEditor {
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



export interface AuthorBiography {
  authorName: string;
  biography: string;
  affiliation?: string;
  email?: string;
}

export type AuthorBiographiesSection =
  | { [key: string]: AuthorBiography }
  | AuthorBiography[];

export interface EditorBiography {
  editorName: string;
  biography: string;
  affiliation?: string;
  email?: string;
}

export type EditorBiographiesSection =
  | { [key: string]: EditorBiography }
  | EditorBiography[];

export type TableOfContentsSection =
  | { [key: string]: string }
  | any[];

export interface ArchivesSection {
  [key: string]: string;
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