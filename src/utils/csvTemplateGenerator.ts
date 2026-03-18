// CSV Template Generator for Bulk TextBook Upload

export interface CSVTemplateData {
    book_title: string;
    main_author_first_name: string;
    main_author_last_name: string;
    main_author_email: string;
    main_author_institute: string;
    main_author_city: string;
    main_author_state: string;
    main_author_country: string;
    main_author_phone: string;
    co_author_1_first_name: string;
    co_author_1_last_name: string;
    co_author_1_email: string;
    co_author_1_institute: string;
    co_author_1_phone: string;
    co_author_2_first_name: string;
    co_author_2_last_name: string;
    co_author_2_email: string;
    co_author_2_institute: string;
    co_author_2_phone: string;
    co_author_3_first_name: string;
    co_author_3_last_name: string;
    co_author_3_email: string;
    co_author_3_institute: string;
    co_author_3_phone: string;
    co_author_4_first_name: string;
    co_author_4_last_name: string;
    co_author_4_email: string;
    co_author_4_institute: string;
    co_author_4_phone: string;
    co_author_5_first_name: string;
    co_author_5_last_name: string;
    co_author_5_email: string;
    co_author_5_institute: string;
    co_author_5_phone: string;
    co_author_6_first_name: string;
    co_author_6_last_name: string;
    co_author_6_email: string;
    co_author_6_institute: string;
    co_author_6_phone: string;
    isbn: string;
    doi: string;
    pages: string;
    copyright: string;
    release_date: string;
    category: string;
    description: string;
    keywords: string;
    indexed_in: string;
    soft_copy_price: string;
    hard_copy_price: string;
    bundle_price: string;
    cover_image_filename: string;
    google_link: string;
    flipkart_link: string;
    amazon_link: string;
}

const CSV_HEADERS: (keyof CSVTemplateData)[] = [
    'book_title',
    'main_author_first_name',
    'main_author_last_name',
    'main_author_email',
    'main_author_institute',
    'main_author_city',
    'main_author_state',
    'main_author_country',
    'main_author_phone',
    'co_author_1_first_name',
    'co_author_1_last_name',
    'co_author_1_email',
    'co_author_1_institute',
    'co_author_1_phone',
    'co_author_2_first_name',
    'co_author_2_last_name',
    'co_author_2_email',
    'co_author_2_institute',
    'co_author_2_phone',
    'co_author_3_first_name',
    'co_author_3_last_name',
    'co_author_3_email',
    'co_author_3_institute',
    'co_author_3_phone',
    'co_author_4_first_name',
    'co_author_4_last_name',
    'co_author_4_email',
    'co_author_4_institute',
    'co_author_4_phone',
    'co_author_5_first_name',
    'co_author_5_last_name',
    'co_author_5_email',
    'co_author_5_institute',
    'co_author_5_phone',
    'co_author_6_first_name',
    'co_author_6_last_name',
    'co_author_6_email',
    'co_author_6_institute',
    'co_author_6_phone',
    'isbn',
    'doi',
    'pages',
    'copyright',
    'release_date',
    'category',
    'description',
    'keywords',
    'indexed_in',
    'soft_copy_price',
    'hard_copy_price',
    'bundle_price',
    'cover_image_filename',
    'google_link',
    'flipkart_link',
    'amazon_link'
];

const SAMPLE_DATA: CSVTemplateData = {
    book_title: 'Introduction to Machine Learning',
    main_author_first_name: 'John',
    main_author_last_name: 'Doe',
    main_author_email: 'john.doe@university.edu',
    main_author_institute: 'MIT',
    main_author_city: 'Cambridge',
    main_author_state: 'Massachusetts',
    main_author_country: 'USA',
    main_author_phone: '+1 617-555-0123',
    co_author_1_first_name: 'Jane',
    co_author_1_last_name: 'Smith',
    co_author_1_email: 'jane.smith@university.edu',
    co_author_1_institute: 'Stanford',
    co_author_1_phone: '',
    co_author_2_first_name: '',
    co_author_2_last_name: '',
    co_author_2_email: '',
    co_author_2_institute: '',
    co_author_2_phone: '',
    co_author_3_first_name: '',
    co_author_3_last_name: '',
    co_author_3_email: '',
    co_author_3_institute: '',
    co_author_3_phone: '',
    co_author_4_first_name: '',
    co_author_4_last_name: '',
    co_author_4_email: '',
    co_author_4_institute: '',
    co_author_4_phone: '',
    co_author_5_first_name: '',
    co_author_5_last_name: '',
    co_author_5_email: '',
    co_author_5_institute: '',
    co_author_5_phone: '',
    co_author_6_first_name: '',
    co_author_6_last_name: '',
    co_author_6_email: '',
    co_author_6_institute: '',
    co_author_6_phone: '',
    isbn: '978-0-123456-78-9',
    doi: '10.1234/ml.2024.001',
    pages: '450',
    copyright: '2024',
    release_date: '2024-03-15',
    category: 'Computer Science',
    description: 'A comprehensive introduction to machine learning concepts and applications',
    keywords: 'machine learning;AI;algorithms;data science',
    indexed_in: 'Scopus;Google Scholar;DBLP',
    soft_copy_price: '499',
    hard_copy_price: '999',
    bundle_price: '1299',
    cover_image_filename: 'ml_book_cover.jpg',
    google_link: 'https://books.google.com/example',
    flipkart_link: 'https://www.flipkart.com/example',
    amazon_link: 'https://www.amazon.in/example'
};

/**
 * Escapes CSV field value by wrapping in quotes if it contains special characters
 */
function escapeCSVField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Generates and downloads a CSV template file for bulk textbook upload
 */
export function downloadCSVTemplate(): void {
    // Create CSV content
    const headerRow = CSV_HEADERS.join(',');
    const sampleRow = CSV_HEADERS.map(header => escapeCSVField(SAMPLE_DATA[header])).join(',');

    const csvContent = `${headerRow}\n${sampleRow}`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'textbook_bulk_upload_template.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Gets the CSV headers for validation purposes
 */
export function getCSVHeaders(): string[] {
    return [...CSV_HEADERS];
}
