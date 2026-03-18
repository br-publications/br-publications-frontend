// Publishing-specific types for Text Book Publishing Form

export interface PublishingPricing {
    softCopyPrice: number;
    hardCopyPrice: number;
    bundlePrice: number;
}

export interface PublishingMetadata {
    indexedIn: string[]; // e.g., ['Scopus', 'Google Scholar', 'DBLP']
    keywords: string[];
    category: string;
    description: string;
    pages: number;
    copyright: string;
    releaseDate: string;
}

export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PublishingFormData {
    // Book Information (prefilled from submission)
    // Book Information (prefilled from submission)
    bookTitle: string;
    // For direct_admin mode, we need full author details
    mainAuthor: string | {
        title: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        institute: string;
        city: string;
        state: string;
        country: string;
        biography?: string;
    };
    coAuthors: (string | {
        title: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber?: string;
        institute: string;
        city?: string;
        state?: string;
        country?: string;
    })[];

    // Files for direct publishing
    contentFile?: File | null;
    fullTextFile?: File | null;

    // Metadata (some prefilled, some admin-entered)
    isbn: string;
    doi: string;
    pages: number;
    copyright: string;
    releaseDate: string;
    indexedIn: string[];
    keywords: string[];
    category: string;
    description: string;

    // Pricing (admin-entered)
    pricing: PublishingPricing;

    // Selling Links (optional)
    googleLink?: string;
    flipkartLink?: string;
    amazonLink?: string;

    // Cover Image (admin uploads and crops)
    coverImage: File | null;
    croppedCoverImage: Blob | null;
    cropArea: CropArea | null;
}

export interface PublishBookRequest {
    submissionId: number;
    publishingData: PublishingFormData;
}
