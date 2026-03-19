/**
 * bcpBulkValidator.ts
 *
 * CSV parsing + validation for Book Chapter Bulk Upload.
 *
 * CSV columns expected (same order as the downloadable template):
 *   bookTitle, mainAuthorFirstName, mainAuthorLastName,
 *   mainAuthorEmail, mainAuthorDesignation, mainAuthorDepartment,
 *   mainAuthorInstitute, mainAuthorCity, mainAuthorState, mainAuthorCountry,
 *   coAuthors (comma-separated full names),
 *   isbn, doi, category, publishedYear, pages, releaseDate,
 *   indexedIn, copyright, priceSoftCopy, priceHardCopy, priceCombined,
 *   description, coverImageFilename
 *
 * Each entry is matched to an uploaded cover image file by its filename.
 */

// ────────────────────────────────────────────────────────────
// Allowed categories (enforced at validation time)
// ────────────────────────────────────────────────────────────

export const VALID_CATEGORIES = [
    'Engineering & Management',
    'Medical & Health Sciences',
    'Interdisciplinary Sciences',
] as const;

export type ValidCategory = typeof VALID_CATEGORIES[number];

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface ParsedAuthorBasic {
    firstName: string;
    lastName: string;
    designation: string;
    departmentName: string;
    instituteName: string;
    city: string;
    state: string;
    country: string;
    email: string;
    phoneNumber: string;
    isCorrespondingAuthor: boolean;
    otherDesignation: string;
}

export interface ParsedCoAuthor {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    isCorrespondingAuthor: boolean;
    designation: string;
    otherDesignation: string;
    departmentName: string;
    instituteName: string;
    city: string;
    state: string;
    country: string;
}

export interface ParsedTocChapter {
    title: string;
    chapterNumber: string;
    authors: string;
    pagesFrom: string;
    pagesTo: string;
    abstract: string;
    priceSoftCopy: number;
    priceHardCopy: number;
    priceCombined: number;
    pdfFilename: string;
    matchedPdf: File | null;
}

export interface ParsedChapterEntry {
    rowNumber: number;

    // Author
    mainAuthor: ParsedAuthorBasic;
    coAuthors: string; // raw comma-separated string from CSV (fallback)
    coAuthorsData: ParsedCoAuthor[]; // new structured data

    // Book metadata
    bookTitle: string;
    editors: string[];
    keywords: string[];
    isbn: string;
    doi: string;
    category: string;
    publishedDate: string;  // year string e.g. "2024"
    pages: number;
    releaseDate: string;
    indexedIn: string;
    copyright: string;

    // Pricing
    priceSoftCopy: number;
    priceHardCopy: number;
    priceCombined: number;
    googleLink: string;
    flipkartLink: string;
    amazonLink: string;

    // Content
    description: string;
    synopsisParagraph1: string;
    synopsisParagraph2: string;
    synopsisParagraph3: string;
    synopsisParagraph4: string;
    scopeIntro: string;

    // TOC Chapters
    tocChapters: ParsedTocChapter[];

    // Cover image — set after matchCoverImages()
    coverImageFilename: string;
    matchedCoverImage: File | null;

    // PDFs
    pdfMaps: Record<string, string>; // e.g. { Dedication: 'dedication.pdf' }
    matchedPdfs: File[]; // The actual matched file objects for this row

    // Author biographies — built from mainAuthorBiography + coAuthorNBiography columns
    authorBiographies: { authorName: string; biography: string }[];
}

export interface ChapterValidationResult {
    rowNumber: number;
    isValid: boolean;
    errors: Record<string, string>;
    warnings: string[];
}

// ────────────────────────────────────────────────────────────
// CSV row type (keyed by header names)
// ────────────────────────────────────────────────────────────

export type ChapterCSVRow = {
    bookTitle?: string;
    mainAuthorFirstName?: string;
    mainAuthorLastName?: string;
    mainAuthorEmail?: string;
    mainAuthorPhone?: string;
    mainAuthorIsCorresponding?: string; // 'yes'/'no' or 'true'/'false'
    mainAuthorDesignation?: string;
    mainAuthorOtherDesignation?: string;
    mainAuthorDepartment?: string;
    mainAuthorInstitute?: string;
    mainAuthorCity?: string;
    mainAuthorState?: string;
    mainAuthorCountry?: string;

    // Co-Author 1
    coAuthor1FirstName?: string;
    coAuthor1LastName?: string;
    coAuthor1Email?: string;
    coAuthor1Phone?: string;
    coAuthor1IsCorresponding?: string;
    coAuthor1Designation?: string;
    coAuthor1OtherDesignation?: string;
    coAuthor1Department?: string;
    coAuthor1Institute?: string;
    coAuthor1City?: string;
    coAuthor1State?: string;
    coAuthor1Country?: string;

    // Co-Author 2
    coAuthor2FirstName?: string;
    coAuthor2LastName?: string;
    coAuthor2Email?: string;
    coAuthor2Phone?: string;
    coAuthor2IsCorresponding?: string;
    coAuthor2Designation?: string;
    coAuthor2OtherDesignation?: string;
    coAuthor2Department?: string;
    coAuthor2Institute?: string;
    coAuthor2City?: string;
    coAuthor2State?: string;
    coAuthor2Country?: string;

    // Co-Author 3
    coAuthor3FirstName?: string;
    coAuthor3LastName?: string;
    coAuthor3Email?: string;
    coAuthor3Phone?: string;
    coAuthor3IsCorresponding?: string;
    coAuthor3Designation?: string;
    coAuthor3OtherDesignation?: string;
    coAuthor3Department?: string;
    coAuthor3Institute?: string;
    coAuthor3City?: string;
    coAuthor3State?: string;
    coAuthor3Country?: string;

    // Co-Author 4
    coAuthor4FirstName?: string; coAuthor4LastName?: string; coAuthor4Email?: string; coAuthor4Phone?: string;
    coAuthor4IsCorresponding?: string; coAuthor4Designation?: string; coAuthor4OtherDesignation?: string;
    coAuthor4Department?: string; coAuthor4Institute?: string; coAuthor4City?: string; coAuthor4State?: string; coAuthor4Country?: string;
    // Co-Author 5
    coAuthor5FirstName?: string; coAuthor5LastName?: string; coAuthor5Email?: string; coAuthor5Phone?: string;
    coAuthor5IsCorresponding?: string; coAuthor5Designation?: string; coAuthor5OtherDesignation?: string;
    coAuthor5Department?: string; coAuthor5Institute?: string; coAuthor5City?: string; coAuthor5State?: string; coAuthor5Country?: string;
    // Co-Author 6
    coAuthor6FirstName?: string; coAuthor6LastName?: string; coAuthor6Email?: string; coAuthor6Phone?: string;
    coAuthor6IsCorresponding?: string; coAuthor6Designation?: string; coAuthor6OtherDesignation?: string;
    coAuthor6Department?: string; coAuthor6Institute?: string; coAuthor6City?: string; coAuthor6State?: string; coAuthor6Country?: string;

    coAuthors?: string; // fallback string
    editors?: string;
    keywords?: string;
    mainAuthorBiography?: string;
    coAuthor1Biography?: string;
    coAuthor2Biography?: string;
    coAuthor3Biography?: string;
    coAuthor4Biography?: string;
    coAuthor5Biography?: string;
    coAuthor6Biography?: string;
    isbn?: string;
    doi?: string;
    category?: string;
    publishedYear?: string;
    pages?: string;
    releaseDate?: string;
    indexedIn?: string;
    copyright?: string;
    priceSoftCopy?: string;
    priceHardCopy?: string;
    priceCombined?: string;
    googleLink?: string;
    flipkartLink?: string;
    amazonLink?: string;
    description?: string;
    synopsisParagraph1?: string;
    synopsisParagraph2?: string;
    synopsisParagraph3?: string;
    synopsisParagraph4?: string;
    scopeIntro?: string;
    coverImageFilename?: string;

    // PDFfilenames
    pdfDedication?: string;
    pdfFrontmatter?: string;
    pdfToc?: string;
    pdfPreface?: string;
    pdfAcknowledgment?: string;
    pdfContributors?: string;
    pdfIndex?: string;

    // TOC Chapters 1–15
    tocChapter1Title?: string;
    tocChapter1Number?: string;
    tocChapter1Authors?: string;
    tocChapter1PagesFrom?: string;
    tocChapter1PagesTo?: string;
    tocChapter1Abstract?: string;
    tocChapter1PriceSoftCopy?: string;
    tocChapter1PriceHardCopy?: string;
    tocChapter1PriceCombined?: string;
    tocChapter1PdfFilename?: string;
    tocChapter2Title?: string;
    tocChapter2Number?: string;
    tocChapter2Authors?: string;
    tocChapter2PagesFrom?: string;
    tocChapter2PagesTo?: string;
    tocChapter2Abstract?: string;
    tocChapter2PriceSoftCopy?: string;
    tocChapter2PriceHardCopy?: string;
    tocChapter2PriceCombined?: string;
    tocChapter2PdfFilename?: string;
    tocChapter3Title?: string;
    tocChapter3Number?: string;
    tocChapter3Authors?: string;
    tocChapter3PagesFrom?: string;
    tocChapter3PagesTo?: string;
    tocChapter3Abstract?: string;
    tocChapter3PriceSoftCopy?: string;
    tocChapter3PriceHardCopy?: string;
    tocChapter3PriceCombined?: string;
    tocChapter3PdfFilename?: string;
    tocChapter4Title?: string;
    tocChapter4Number?: string;
    tocChapter4Authors?: string;
    tocChapter4PagesFrom?: string;
    tocChapter4PagesTo?: string;
    tocChapter4Abstract?: string;
    tocChapter4PriceSoftCopy?: string;
    tocChapter4PriceHardCopy?: string;
    tocChapter4PriceCombined?: string;
    tocChapter4PdfFilename?: string;
    tocChapter5Title?: string;
    tocChapter5Number?: string;
    tocChapter5Authors?: string;
    tocChapter5PagesFrom?: string;
    tocChapter5PagesTo?: string;
    tocChapter5Abstract?: string;
    tocChapter5PriceSoftCopy?: string;
    tocChapter5PriceHardCopy?: string;
    tocChapter5PriceCombined?: string;
    tocChapter5PdfFilename?: string;
    tocChapter6Title?: string;
    tocChapter6Number?: string;
    tocChapter6Authors?: string;
    tocChapter6PagesFrom?: string;
    tocChapter6PagesTo?: string;
    tocChapter6Abstract?: string;
    tocChapter6PriceSoftCopy?: string;
    tocChapter6PriceHardCopy?: string;
    tocChapter6PriceCombined?: string;
    tocChapter6PdfFilename?: string;
    tocChapter7Title?: string;
    tocChapter7Number?: string;
    tocChapter7Authors?: string;
    tocChapter7PagesFrom?: string;
    tocChapter7PagesTo?: string;
    tocChapter7Abstract?: string;
    tocChapter7PriceSoftCopy?: string;
    tocChapter7PriceHardCopy?: string;
    tocChapter7PriceCombined?: string;
    tocChapter7PdfFilename?: string;
    tocChapter8Title?: string;
    tocChapter8Number?: string;
    tocChapter8Authors?: string;
    tocChapter8PagesFrom?: string;
    tocChapter8PagesTo?: string;
    tocChapter8Abstract?: string;
    tocChapter8PriceSoftCopy?: string;
    tocChapter8PriceHardCopy?: string;
    tocChapter8PriceCombined?: string;
    tocChapter8PdfFilename?: string;
    tocChapter9Title?: string;
    tocChapter9Number?: string;
    tocChapter9Authors?: string;
    tocChapter9PagesFrom?: string;
    tocChapter9PagesTo?: string;
    tocChapter9Abstract?: string;
    tocChapter9PriceSoftCopy?: string;
    tocChapter9PriceHardCopy?: string;
    tocChapter9PriceCombined?: string;
    tocChapter9PdfFilename?: string;
    tocChapter10Title?: string;
    tocChapter10Number?: string;
    tocChapter10Authors?: string;
    tocChapter10PagesFrom?: string;
    tocChapter10PagesTo?: string;
    tocChapter10Abstract?: string;
    tocChapter10PriceSoftCopy?: string;
    tocChapter10PriceHardCopy?: string;
    tocChapter10PriceCombined?: string;
    tocChapter10PdfFilename?: string;
    tocChapter11Title?: string;
    tocChapter11Number?: string;
    tocChapter11Authors?: string;
    tocChapter11PagesFrom?: string;
    tocChapter11PagesTo?: string;
    tocChapter11Abstract?: string;
    tocChapter11PriceSoftCopy?: string;
    tocChapter11PriceHardCopy?: string;
    tocChapter11PriceCombined?: string;
    tocChapter11PdfFilename?: string;
    tocChapter12Title?: string;
    tocChapter12Number?: string;
    tocChapter12Authors?: string;
    tocChapter12PagesFrom?: string;
    tocChapter12PagesTo?: string;
    tocChapter12Abstract?: string;
    tocChapter12PriceSoftCopy?: string;
    tocChapter12PriceHardCopy?: string;
    tocChapter12PriceCombined?: string;
    tocChapter12PdfFilename?: string;
    tocChapter13Title?: string;
    tocChapter13Number?: string;
    tocChapter13Authors?: string;
    tocChapter13PagesFrom?: string;
    tocChapter13PagesTo?: string;
    tocChapter13Abstract?: string;
    tocChapter13PriceSoftCopy?: string;
    tocChapter13PriceHardCopy?: string;
    tocChapter13PriceCombined?: string;
    tocChapter13PdfFilename?: string;
    tocChapter14Title?: string;
    tocChapter14Number?: string;
    tocChapter14Authors?: string;
    tocChapter14PagesFrom?: string;
    tocChapter14PagesTo?: string;
    tocChapter14Abstract?: string;
    tocChapter14PriceSoftCopy?: string;
    tocChapter14PriceHardCopy?: string;
    tocChapter14PriceCombined?: string;
    tocChapter14PdfFilename?: string;
    tocChapter15Title?: string;
    tocChapter15Number?: string;
    tocChapter15Authors?: string;
    tocChapter15PagesFrom?: string;
    tocChapter15PagesTo?: string;
    tocChapter15Abstract?: string;
    tocChapter15PriceSoftCopy?: string;
    tocChapter15PriceHardCopy?: string;
    tocChapter15PriceCombined?: string;
    tocChapter15PdfFilename?: string;
    tocChapter16Title?: string; tocChapter16Number?: string; tocChapter16Authors?: string; tocChapter16PagesFrom?: string; tocChapter16PagesTo?: string; tocChapter16Abstract?: string; tocChapter16PriceSoftCopy?: string; tocChapter16PriceHardCopy?: string; tocChapter16PriceCombined?: string; tocChapter16PdfFilename?: string;
    tocChapter17Title?: string; tocChapter17Number?: string; tocChapter17Authors?: string; tocChapter17PagesFrom?: string; tocChapter17PagesTo?: string; tocChapter17Abstract?: string; tocChapter17PriceSoftCopy?: string; tocChapter17PriceHardCopy?: string; tocChapter17PriceCombined?: string; tocChapter17PdfFilename?: string;
    tocChapter18Title?: string; tocChapter18Number?: string; tocChapter18Authors?: string; tocChapter18PagesFrom?: string; tocChapter18PagesTo?: string; tocChapter18Abstract?: string; tocChapter18PriceSoftCopy?: string; tocChapter18PriceHardCopy?: string; tocChapter18PriceCombined?: string; tocChapter18PdfFilename?: string;
    tocChapter19Title?: string; tocChapter19Number?: string; tocChapter19Authors?: string; tocChapter19PagesFrom?: string; tocChapter19PagesTo?: string; tocChapter19Abstract?: string; tocChapter19PriceSoftCopy?: string; tocChapter19PriceHardCopy?: string; tocChapter19PriceCombined?: string; tocChapter19PdfFilename?: string;
    tocChapter20Title?: string; tocChapter20Number?: string; tocChapter20Authors?: string; tocChapter20PagesFrom?: string; tocChapter20PagesTo?: string; tocChapter20Abstract?: string; tocChapter20PriceSoftCopy?: string; tocChapter20PriceHardCopy?: string; tocChapter20PriceCombined?: string; tocChapter20PdfFilename?: string;
    tocChapter21Title?: string; tocChapter21Number?: string; tocChapter21Authors?: string; tocChapter21PagesFrom?: string; tocChapter21PagesTo?: string; tocChapter21Abstract?: string; tocChapter21PriceSoftCopy?: string; tocChapter21PriceHardCopy?: string; tocChapter21PriceCombined?: string; tocChapter21PdfFilename?: string;
    tocChapter22Title?: string; tocChapter22Number?: string; tocChapter22Authors?: string; tocChapter22PagesFrom?: string; tocChapter22PagesTo?: string; tocChapter22Abstract?: string; tocChapter22PriceSoftCopy?: string; tocChapter22PriceHardCopy?: string; tocChapter22PriceCombined?: string; tocChapter22PdfFilename?: string;
    tocChapter23Title?: string; tocChapter23Number?: string; tocChapter23Authors?: string; tocChapter23PagesFrom?: string; tocChapter23PagesTo?: string; tocChapter23Abstract?: string; tocChapter23PriceSoftCopy?: string; tocChapter23PriceHardCopy?: string; tocChapter23PriceCombined?: string; tocChapter23PdfFilename?: string;
    tocChapter24Title?: string; tocChapter24Number?: string; tocChapter24Authors?: string; tocChapter24PagesFrom?: string; tocChapter24PagesTo?: string; tocChapter24Abstract?: string; tocChapter24PriceSoftCopy?: string; tocChapter24PriceHardCopy?: string; tocChapter24PriceCombined?: string; tocChapter24PdfFilename?: string;
    tocChapter25Title?: string; tocChapter25Number?: string; tocChapter25Authors?: string; tocChapter25PagesFrom?: string; tocChapter25PagesTo?: string; tocChapter25Abstract?: string; tocChapter25PriceSoftCopy?: string; tocChapter25PriceHardCopy?: string; tocChapter25PriceCombined?: string; tocChapter25PdfFilename?: string;
};

// ────────────────────────────────────────────────────────────
// Parse a single CSV row into a ParsedChapterEntry
// ────────────────────────────────────────────────────────────

export function parseChapterCSVRow(
    row: ChapterCSVRow,
    rowNumber: number
): ParsedChapterEntry {
    const str = (v?: string) => (v ?? '').trim();
    const num = (v?: string) => {
        const n = parseFloat(str(v));
        return isNaN(n) ? 0 : n;
    };
    const bool = (v?: string) => {
        const s = str(v).toLowerCase();
        return s === 'true' || s === 'yes' || s === '1' || s === 'y';
    };

    const coAuthorsData: ParsedCoAuthor[] = [];
    // Use a generic accessor so we can loop dynamically over co-author fields
    const r = row as Record<string, string | undefined>;
    // Parse co-authors 1–6 dynamically
    for (let i = 1; i <= 6; i++) {
        const firstName = str(r[`coAuthor${i}FirstName`]);
        const lastName = str(r[`coAuthor${i}LastName`]);
        if (!firstName && !lastName) continue;
        coAuthorsData.push({
            firstName,
            lastName,
            email: str(r[`coAuthor${i}Email`]),
            phoneNumber: str(r[`coAuthor${i}Phone`]),
            isCorrespondingAuthor: bool(r[`coAuthor${i}IsCorresponding`]),
            designation: str(r[`coAuthor${i}Designation`]),
            otherDesignation: str(r[`coAuthor${i}OtherDesignation`]),
            departmentName: str(r[`coAuthor${i}Department`]),
            instituteName: str(r[`coAuthor${i}Institute`]),
            city: str(r[`coAuthor${i}City`]),
            state: str(r[`coAuthor${i}State`]),
            country: str(r[`coAuthor${i}Country`]),
        });
    }

    const pdfMaps: Record<string, string> = {};
    if (str(row.pdfDedication)) pdfMaps['Dedication'] = str(row.pdfDedication);
    if (str(row.pdfFrontmatter)) pdfMaps['Frontmatter'] = str(row.pdfFrontmatter);
    if (str(row.pdfToc)) pdfMaps['Detailed Table of Contents'] = str(row.pdfToc);
    if (str(row.pdfPreface)) pdfMaps['Preface'] = str(row.pdfPreface);
    if (str(row.pdfAcknowledgment)) pdfMaps['Acknowledgment'] = str(row.pdfAcknowledgment);
    if (str(row.pdfContributors)) pdfMaps['About the Contributors'] = str(row.pdfContributors);
    if (str(row.pdfIndex)) pdfMaps['Index'] = str(row.pdfIndex);

    // Parse TOC chapters 1–25 dynamically
    const tocChapters: ParsedTocChapter[] = [];
    for (let i = 1; i <= 25; i++) {
        const title = str(r[`tocChapter${i}Title`]);
        if (!title) break; // stop at the first empty chapter slot
        tocChapters.push({
            title,
            chapterNumber: str(r[`tocChapter${i}Number`]),
            authors: str(r[`tocChapter${i}Authors`]),
            pagesFrom: str(r[`tocChapter${i}PagesFrom`]),
            pagesTo: str(r[`tocChapter${i}PagesTo`]),
            abstract: str(r[`tocChapter${i}Abstract`]),
            priceSoftCopy: num(r[`tocChapter${i}PriceSoftCopy`]),
            priceHardCopy: num(r[`tocChapter${i}PriceHardCopy`]),
            priceCombined: num(r[`tocChapter${i}PriceCombined`]),
            pdfFilename: str(r[`tocChapter${i}PdfFilename`]),
            matchedPdf: null,
        });
    }

    return {
        rowNumber,
        mainAuthor: {
            firstName: str(row.mainAuthorFirstName),
            lastName: str(row.mainAuthorLastName),
            email: str(row.mainAuthorEmail),
            phoneNumber: str(row.mainAuthorPhone),
            isCorrespondingAuthor: bool(row.mainAuthorIsCorresponding),
            designation: str(row.mainAuthorDesignation),
            otherDesignation: str(row.mainAuthorOtherDesignation),
            departmentName: str(row.mainAuthorDepartment),
            instituteName: str(row.mainAuthorInstitute),
            city: str(row.mainAuthorCity),
            state: str(row.mainAuthorState),
            country: str(row.mainAuthorCountry),
        },
        coAuthors: str(row.coAuthors),
        coAuthorsData,
        bookTitle: str(row.bookTitle),
        editors: str(row.editors).split(',').map(s => s.trim()).filter(Boolean),
        keywords: str(row.keywords).split(',').map(s => s.trim()).filter(Boolean),
        isbn: str(row.isbn),
        doi: str(row.doi),
        category: str(row.category),
        publishedDate: str(row.publishedYear),
        pages: num(row.pages),
        releaseDate: str(row.releaseDate),
        indexedIn: str(row.indexedIn),
        copyright: str(row.copyright),
        priceSoftCopy: num(row.priceSoftCopy),
        priceHardCopy: num(row.priceHardCopy),
        priceCombined: num(row.priceCombined),
        googleLink: str(row.googleLink),
        flipkartLink: str(row.flipkartLink),
        amazonLink: str(row.amazonLink),
        description: str(row.description),
        synopsisParagraph1: str(row.synopsisParagraph1),
        synopsisParagraph2: str(row.synopsisParagraph2),
        synopsisParagraph3: str(row.synopsisParagraph3),
        synopsisParagraph4: str(row.synopsisParagraph4),
        scopeIntro: str(row.scopeIntro),
        tocChapters,
        coverImageFilename: str(row.coverImageFilename),
        matchedCoverImage: null,
        pdfMaps,
        matchedPdfs: [],
        // Build author biographies from individual biography columns
        authorBiographies: [
            ...(str(row.mainAuthorBiography) ? [{
                authorName: `${str(row.mainAuthorFirstName)} ${str(row.mainAuthorLastName)}`.trim(),
                biography: str(row.mainAuthorBiography),
            }] : []),
            ...[1, 2, 3, 4, 5, 6].flatMap(i => {
                const bio = str(r[`coAuthor${i}Biography`]);
                const fname = str(r[`coAuthor${i}FirstName`]);
                const lname = str(r[`coAuthor${i}LastName`]);
                if (!bio || (!fname && !lname)) return [];
                return [{ authorName: `${fname} ${lname}`.trim(), biography: bio }];
            }),
        ],
    };
}

// ────────────────────────────────────────────────────────────
// Match cover image files to entries by filename (case-insensitive)
// ────────────────────────────────────────────────────────────

export function matchChapterCoverImages(
    entries: ParsedChapterEntry[],
    imageFiles: File[]
): ParsedChapterEntry[] {
    const fileMap = new Map<string, File>();
    imageFiles.forEach((f) => fileMap.set(f.name.toLowerCase(), f));

    return entries.map((entry) => {
        const key = entry.coverImageFilename.toLowerCase();
        const matched = key ? (fileMap.get(key) ?? null) : null;
        return { ...entry, matchedCoverImage: matched };
    });
}

// ────────────────────────────────────────────────────────────
// Match PDF files to entries by filename (case-insensitive)
// ────────────────────────────────────────────────────────────

export function matchChapterPdfs(
    entries: ParsedChapterEntry[],
    pdfFiles: File[]
): ParsedChapterEntry[] {
    const fileMap = new Map<string, File>();
    pdfFiles.forEach((f) => fileMap.set(f.name.toLowerCase(), f));

    return entries.map((entry) => {
        // Link main document PDFs
        const matchedPdfs: File[] = [];
        Object.values(entry.pdfMaps).forEach(filename => {
            if (!filename) return;
            const key = filename.toLowerCase();
            const matchedFile = fileMap.get(key);
            if (matchedFile) matchedPdfs.push(matchedFile);
        });

        // Link individual Chapter PDFs
        entry.tocChapters.forEach(chapter => {
            if (!chapter.pdfFilename) return;
            const key = chapter.pdfFilename.toLowerCase();
            const matchedFile = fileMap.get(key);
            if (matchedFile) chapter.matchedPdf = matchedFile;
        });

        return { ...entry, matchedPdfs };
    });
}

// ────────────────────────────────────────────────────────────
// Find duplicate ISBNs within the batch
// ────────────────────────────────────────────────────────────

export function findDuplicateChapterISBNs(
    entries: ParsedChapterEntry[]
): Set<string> {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    entries.forEach((e) => {
        const isbn = e.isbn?.trim();
        if (!isbn) return;
        if (seen.has(isbn)) dupes.add(isbn);
        else seen.add(isbn);
    });
    return dupes;
}

// ────────────────────────────────────────────────────────────
// Validate a single entry
// ────────────────────────────────────────────────────────────

export function validateChapterEntry(
    entry: ParsedChapterEntry,
    hasCoverImage: boolean,
    isBatchDuplicate: boolean,
    isServerDuplicate: boolean
): ChapterValidationResult {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // ── Book title (required) ──────────────────────────────
    if (!entry.bookTitle?.trim()) {
        errors['bookTitle'] = 'Book title is required.';
    }

    // ── Editors (required) ────────────────────────────────
    if (entry.editors.length === 0) {
        errors['editors'] = 'At least one editor is required (comma-separated list).';
    }

    // ── ISBN (required + unique) ───────────────────────────
    if (!entry.isbn?.trim()) {
        errors['isbn'] = 'ISBN is required.';
    } else if (isBatchDuplicate) {
        errors['isbn'] = `Duplicate ISBN in this batch: ${entry.isbn}`;
    } else if (isServerDuplicate) {
        errors['isbn'] = `ISBN already registered in system: ${entry.isbn}`;
    }

    // DOI is now optional
    /*
    if (!entry.doi?.trim()) {
        errors['doi'] = 'DOI is required.';
    }
    */

    // ── Category (required + must be one of VALID_CATEGORIES) ────
    if (!entry.category?.trim()) {
        errors['category'] = 'Category is required.';
    } else if (!VALID_CATEGORIES.includes(entry.category as ValidCategory)) {
        errors['category'] =
            `Invalid category "${entry.category}". Must be one of: ${VALID_CATEGORIES.join(' | ')}.`;
    }

    // ── Published date / year (required) ─────────────────
    if (!entry.publishedDate?.trim()) {
        errors['publishedDate'] = 'Published year is required.';
    }

    // ── Release date (required) ───────────────────────────
    if (!entry.releaseDate?.trim()) {
        errors['releaseDate'] = 'Release date is required.';
    }

    // ── Pages (required) ──────────────────────────────────
    if (!entry.pages || entry.pages <= 0) {
        errors['pages'] = 'Pages must be a positive number.';
    }

    // ── Indexed In (required) ─────────────────────────────
    if (!entry.indexedIn?.trim()) {
        errors['indexedIn'] = 'Indexed In is required (e.g. Scopus, Google Scholar).';
    }

    // ── Copyright (required) ──────────────────────────────
    if (!entry.copyright?.trim()) {
        errors['copyright'] = 'Copyright is required.';
    }

    // ── Pricing (required) ────────────────────────────────
    if (!entry.priceSoftCopy || entry.priceSoftCopy <= 0) {
        errors['priceSoftCopy'] = 'Soft copy price is required and must be positive.';
    }
    if (!entry.priceHardCopy || entry.priceHardCopy <= 0) {
        errors['priceHardCopy'] = 'Hard copy price is required and must be positive.';
    }
    if (!entry.priceCombined || entry.priceCombined <= 0) {
        errors['priceCombined'] = 'Combined price is required and must be positive.';
    }

    // ── Description (required) ────────────────────────────
    if (!entry.description?.trim()) {
        errors['description'] = 'Short description / abstract is required.';
    }

    // ── Cover image (required) ────────────────────────────
    if (!hasCoverImage) {
        errors['coverImage'] = entry.coverImageFilename?.trim()
            ? `Cover image file "${entry.coverImageFilename}" was not found in the uploaded images.`
            : 'Cover image is required — provide a coverImageFilename in the CSV and upload the matching image file.';
    }

    // ── Main author (required fields) ─────────────────────
    if (!entry.mainAuthor.firstName?.trim() || !entry.mainAuthor.lastName?.trim()) {
        errors['mainAuthor'] = 'Main author first and last name are required.';
    }
    if (!entry.mainAuthor.email?.trim()) {
        errors['mainAuthorEmail'] = 'Main author email is required.';
    }
    if (!entry.mainAuthor.designation?.trim()) {
        errors['mainAuthorDesignation'] = 'Main author designation is required.';
    }
    if (!entry.mainAuthor.departmentName?.trim()) {
        errors['mainAuthorDepartment'] = 'Main author department is required.';
    }
    if (!entry.mainAuthor.instituteName?.trim()) {
        errors['mainAuthorInstitute'] = 'Main author institute is required.';
    }
    if (!entry.mainAuthor.city?.trim()) {
        errors['mainAuthorCity'] = 'Main author city is required.';
    }
    if (!entry.mainAuthor.state?.trim()) {
        errors['mainAuthorState'] = 'Main author state is required.';
    }
    if (!entry.mainAuthor.country?.trim()) {
        errors['mainAuthorCountry'] = 'Main author country is required.';
    }
    // Phone is intentionally optional — no validation here

    // ── Additional Fields (All Mandatory) ────────────────
    if (!entry.synopsisParagraph1?.trim()) errors['synopsisParagraph1'] = 'Synopsis Paragraph 1 is required.';
    if (!entry.scopeIntro?.trim()) errors['scopeIntro'] = 'Scope Intro is required.';

    const mainAuthorBio = entry.authorBiographies.find(b => b.authorName === `${entry.mainAuthor.firstName} ${entry.mainAuthor.lastName}`.trim());
    if (!mainAuthorBio || !mainAuthorBio.biography?.trim()) {
        errors['mainAuthorBiography'] = 'Main author biography is required.';
    }

    // ── Co-Authors (All mandatory if row exists) ─────────
    entry.coAuthorsData.forEach((ca, idx) => {
        const label = `Co-Author ${idx + 1}`;
        if (!ca.firstName?.trim() || !ca.lastName?.trim()) errors[`coAuthor${idx + 1}Name`] = `${label} first and last name are required.`;
        if (!ca.email?.trim()) errors[`coAuthor${idx + 1}Email`] = `${label} email is required.`;
        if (!ca.designation?.trim()) errors[`coAuthor${idx + 1}Designation`] = `${label} designation is required.`;
        if (!ca.departmentName?.trim()) errors[`coAuthor${idx + 1}Department`] = `${label} department is required.`;
        if (!ca.instituteName?.trim()) errors[`coAuthor${idx + 1}Institute`] = `${label} institute is required.`;
        if (!ca.city?.trim()) errors[`coAuthor${idx + 1}City`] = `${label} city is required.`;
        if (!ca.state?.trim()) errors[`coAuthor${idx + 1}State`] = `${label} state is required.`;
        if (!ca.country?.trim()) errors[`coAuthor${idx + 1}Country`] = `${label} country is required.`;

        const caBio = entry.authorBiographies.find(b => b.authorName === `${ca.firstName} ${ca.lastName}`.trim());
        if (!caBio || !caBio.biography?.trim()) {
            errors[`coAuthor${idx + 1}Biography`] = `${label} biography is required.`;
        }
    });

    // ── TOC Chapters — each must have all fields + PDF ───────────────
    if (entry.tocChapters.length === 0) {
        errors['tocChapters'] = 'At least one TOC chapter is required.';
    } else {
        entry.tocChapters.forEach((chapter, idx) => {
            const label = `Chapter ${idx + 1} (${chapter.title || 'Untitled'})`;
            if (!chapter.title?.trim()) errors[`tocChapter${idx + 1}Title`] = `${label}: title is required.`;
            if (!chapter.chapterNumber?.trim()) errors[`tocChapter${idx + 1}Number`] = `${label}: chapter number is required.`;
            if (!chapter.authors?.trim()) errors[`tocChapter${idx + 1}Authors`] = `${label}: authors are required.`;
            if (!chapter.pagesFrom?.trim()) errors[`tocChapter${idx + 1}PagesFrom`] = `${label}: pagesFrom is required.`;
            if (!chapter.pagesTo?.trim()) errors[`tocChapter${idx + 1}PagesTo`] = `${label}: pagesTo is required.`;
            if (!chapter.abstract?.trim()) errors[`tocChapter${idx + 1}Abstract`] = `${label}: abstract is required.`;
            if (!chapter.priceSoftCopy || chapter.priceSoftCopy <= 0) errors[`tocChapter${idx + 1}PriceSoftCopy`] = `${label}: soft copy price is required.`;
            if (!chapter.priceHardCopy || chapter.priceHardCopy <= 0) errors[`tocChapter${idx + 1}PriceHardCopy`] = `${label}: hard copy price is required.`;
            if (!chapter.priceCombined || chapter.priceCombined <= 0) errors[`tocChapter${idx + 1}PriceCombined`] = `${label}: combined price is required.`;

            if (!chapter.pdfFilename?.trim()) {
                errors[`tocChapter${idx + 1}Pdf`] =
                    `${label}: a PDF filename is required in column "tocChapter${idx + 1}PdfFilename". ` +
                    `Enter the exact filename of the PDF you will upload (e.g. chapter${idx + 1}.pdf).`;
            } else if (!chapter.matchedPdf) {
                errors[`tocChapter${idx + 1}Pdf`] =
                    `${label}: the PDF file "${chapter.pdfFilename}" was not found among uploaded PDFs. ` +
                    `Make sure you upload a file named exactly "${chapter.pdfFilename}" in the PDF dropzone.`;
            }
        });
    }

    // ── Frontmatter PDFs — optional, warn if referenced but missing ──
    const expectedPdfCount = Object.keys(entry.pdfMaps).length;
    if (expectedPdfCount > 0 && entry.matchedPdfs.length < expectedPdfCount) {
        warnings.push(
            `Matched ${entry.matchedPdfs.length} of ${expectedPdfCount} referenced frontmatter PDFs.`
        );
    }

    return {
        rowNumber: entry.rowNumber,
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings,
    };
}



// ────────────────────────────────────────────────────────────
// CSV template columns (for download)
// ────────────────────────────────────────────────────────────

export const CHAPTER_CSV_TEMPLATE_HEADERS: string[] = [
    'bookTitle',
    'editors',
    'keywords',
    'mainAuthorFirstName',
    'mainAuthorLastName',
    'mainAuthorEmail',
    'mainAuthorPhone',
    'mainAuthorIsCorresponding',
    'mainAuthorDesignation',
    'mainAuthorOtherDesignation',
    'mainAuthorDepartment',
    'mainAuthorInstitute',
    'mainAuthorCity',
    'mainAuthorState',
    'mainAuthorCountry',
    'coAuthor1FirstName',
    'coAuthor1LastName',
    'coAuthor1Email',
    'coAuthor1Phone',
    'coAuthor1IsCorresponding',
    'coAuthor1Designation',
    'coAuthor1OtherDesignation',
    'coAuthor1Department',
    'coAuthor1Institute',
    'coAuthor1City',
    'coAuthor1State',
    'coAuthor1Country',
    'coAuthor2FirstName',
    'coAuthor2LastName',
    'coAuthor2Email',
    'coAuthor2Phone',
    'coAuthor2IsCorresponding',
    'coAuthor2Designation',
    'coAuthor2OtherDesignation',
    'coAuthor2Department',
    'coAuthor2Institute',
    'coAuthor2City',
    'coAuthor2State',
    'coAuthor2Country',
    'coAuthor3FirstName',
    'coAuthor3LastName',
    'coAuthor3Email',
    'coAuthor3Phone',
    'coAuthor3IsCorresponding',
    'coAuthor3Designation',
    'coAuthor3OtherDesignation',
    'coAuthor3Department',
    'coAuthor3Institute',
    'coAuthor3City',
    'coAuthor3State',
    'coAuthor3Country',
    // Co-Author 4
    'coAuthor4FirstName', 'coAuthor4LastName', 'coAuthor4Email', 'coAuthor4Phone',
    'coAuthor4IsCorresponding', 'coAuthor4Designation', 'coAuthor4OtherDesignation',
    'coAuthor4Department', 'coAuthor4Institute', 'coAuthor4City', 'coAuthor4State', 'coAuthor4Country',
    // Co-Author 5
    'coAuthor5FirstName', 'coAuthor5LastName', 'coAuthor5Email', 'coAuthor5Phone',
    'coAuthor5IsCorresponding', 'coAuthor5Designation', 'coAuthor5OtherDesignation',
    'coAuthor5Department', 'coAuthor5Institute', 'coAuthor5City', 'coAuthor5State', 'coAuthor5Country',
    // Co-Author 6
    'coAuthor6FirstName', 'coAuthor6LastName', 'coAuthor6Email', 'coAuthor6Phone',
    'coAuthor6IsCorresponding', 'coAuthor6Designation', 'coAuthor6OtherDesignation',
    'coAuthor6Department', 'coAuthor6Institute', 'coAuthor6City', 'coAuthor6State', 'coAuthor6Country',
    'coAuthors',
    'mainAuthorBiography',
    'coAuthor1Biography',
    'coAuthor2Biography',
    'coAuthor3Biography',
    'coAuthor4Biography',
    'coAuthor5Biography',
    'coAuthor6Biography',
    'isbn',
    'doi',
    'category',
    'publishedYear',
    'pages',
    'releaseDate',
    'indexedIn',
    'copyright',
    'priceSoftCopy',
    'priceHardCopy',
    'priceCombined',
    'googleLink',
    'flipkartLink',
    'amazonLink',
    'description',
    'synopsisParagraph1',
    'synopsisParagraph2',
    'synopsisParagraph3',
    'synopsisParagraph4',
    'scopeIntro',
    'coverImageFilename',
    'pdfDedication',
    'pdfFrontmatter',
    'pdfToc',
    'pdfPreface',
    'pdfAcknowledgment',
    'pdfContributors',
    'pdfIndex',
    // TOC chapters 1–15
    ...Array.from({ length: 25 }, (_, i) => i + 1).flatMap(n => [
        `tocChapter${n}Title`,
        `tocChapter${n}Number`,
        `tocChapter${n}Authors`,
        `tocChapter${n}PagesFrom`,
        `tocChapter${n}PagesTo`,
        `tocChapter${n}Abstract`,
        `tocChapter${n}PriceSoftCopy`,
        `tocChapter${n}PriceHardCopy`,
        `tocChapter${n}PriceCombined`,
        `tocChapter${n}PdfFilename`,
    ]),
];

export const CHAPTER_CSV_SAMPLE_ROW: Record<string, string> = {
    bookTitle: 'Advanced AI Research 2024',
    editors: 'Arjun Mehta, Priya Nair',
    keywords: 'Artificial Intelligence, Machine Learning, Neural Networks',
    mainAuthorFirstName: 'Jane',
    mainAuthorLastName: 'Doe',
    mainAuthorEmail: 'jane.doe@example.com',
    mainAuthorPhone: '+1-555-0192',
    mainAuthorIsCorresponding: 'true',
    mainAuthorDesignation: 'Professor',
    mainAuthorOtherDesignation: '',
    mainAuthorDepartment: 'Computer Science',
    mainAuthorInstitute: 'Tech University',
    mainAuthorCity: 'San Francisco',
    mainAuthorState: 'CA',
    mainAuthorCountry: 'USA',
    coAuthor1FirstName: 'John',
    coAuthor1LastName: 'Smith',
    coAuthor1Email: 'john.smith@example.com',
    coAuthor1Phone: '+1-555-0193',
    coAuthor1IsCorresponding: 'false',
    coAuthor1Designation: 'Researcher',
    coAuthor1OtherDesignation: '',
    coAuthor1Department: 'Software Engineering',
    coAuthor1Institute: 'Tech Institute',
    coAuthor1City: 'San Jose',
    coAuthor1State: 'CA',
    coAuthor1Country: 'USA',
    coAuthor2FirstName: '',
    coAuthor2LastName: '',
    coAuthor2Email: '',
    coAuthor2Phone: '',
    coAuthor2IsCorresponding: '',
    coAuthor2Designation: '',
    coAuthor2OtherDesignation: '',
    coAuthor2Department: '',
    coAuthor2Institute: '',
    coAuthor2City: '',
    coAuthor2State: '',
    coAuthor2Country: '',
    coAuthor3FirstName: '',
    coAuthor3LastName: '',
    coAuthor3Email: '',
    coAuthor3Phone: '',
    coAuthor3IsCorresponding: '',
    coAuthor3Designation: '',
    coAuthor3OtherDesignation: '',
    coAuthor3Department: '',
    coAuthor3Institute: '',
    coAuthor3City: '',
    coAuthor3State: '',
    coAuthor3Country: '',
    coAuthors: 'John Smith',
    mainAuthorBiography: 'Dr. Jane Doe is a Professor of Computer Science at Tech University with over 15 years of research experience in AI.',
    coAuthor1Biography: 'John Smith is a Senior Researcher at Tech Institute specializing in software engineering and machine learning.',
    coAuthor2Biography: '',
    coAuthor3Biography: '',
    isbn: '978-3-16-148410-0',
    doi: '10.1000/xyz123',
    category: 'Computer Science',
    publishedYear: '2024',
    pages: '350',
    releaseDate: '2024-06-15',
    indexedIn: 'Scopus',
    copyright: '© 2024 TS Publication',
    priceSoftCopy: '29.99',
    priceHardCopy: '49.99',
    priceCombined: '69.99',
    googleLink: '',
    flipkartLink: '',
    amazonLink: '',
    description: 'A comprehensive guide to recent advancements in AI.',
    synopsisParagraph1: 'This book explores the latest methodologies in deep learning and their applications.',
    synopsisParagraph2: 'It delves deeper into scaling neural network architectures.',
    synopsisParagraph3: '',
    synopsisParagraph4: '',
    scopeIntro: 'The scope covers theoretical foundations.',
    coverImageFilename: 'advanced_ai_cover.jpg',
    pdfDedication: '',
    pdfFrontmatter: '',
    pdfToc: 'toc_advanced_ai.pdf',
    pdfPreface: 'preface_advanced_ai.pdf',
    pdfAcknowledgment: '',
    pdfContributors: '',
    pdfIndex: '',
    tocChapter1Title: 'Introduction to Neural Networks',
    tocChapter1Number: '1',
    tocChapter1Authors: 'Jane Doe, John Smith',
    tocChapter1PagesFrom: '1',
    tocChapter1PagesTo: '45',
    tocChapter1Abstract: 'A primer covering the foundations of modern neural architecture.',
    tocChapter1PriceSoftCopy: '9.99',
    tocChapter1PriceHardCopy: '14.99',
    tocChapter1PriceCombined: '19.99',
    tocChapter1PdfFilename: 'chapter1_intro.pdf'
};

/**
 * Trigger a CSV template download in the browser.
 */
export function downloadChapterCSVTemplate(): void {
    const csvContent =
        CHAPTER_CSV_TEMPLATE_HEADERS.join(',') +
        '\n' +
        CHAPTER_CSV_TEMPLATE_HEADERS.map(
            (h) => `"${CHAPTER_CSV_SAMPLE_ROW[h] || ''}"`
        ).join(',');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'book_chapters_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
