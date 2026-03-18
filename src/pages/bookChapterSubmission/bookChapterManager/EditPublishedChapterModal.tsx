import React, { useState, useEffect, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import type { Author } from '../../../types/submissionTypes';
import { DESIGNATIONS } from '../../../types/bookChapterManuscriptTypes';
import {
    uploadDirectTempPdf,
    getCoverUrl,
    getPublishedChapterById
} from '../../../services/bookChapterPublishing.service';
import type { TocChapterPayload, AuthorBiographyPayload } from '../../../services/bookChapterPublishing.service';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import PhoneNumberInput from '../../../components/common/PhoneNumberInput';
import { isValidPhoneNumber } from '../../../utils/phoneValidation';
import '../../../components/submissions/individualPublishChapterWizard.css';
import '../../textBookSubmission/publishing/imageCropper.css';

// ============================================================
// Types
// ============================================================

interface EditPublishedChapterModalProps {
    book: any;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, data: any) => Promise<void>;
}

type TabType = 'author' | 'metadata' | 'content' | 'toc' | 'review';

interface TabDef {
    id: TabType;
    label: string;
    num: number;
}

const TABS: TabDef[] = [
    { id: 'author', label: 'Authors', num: 1 },
    { id: 'metadata', label: 'Book Metadata', num: 2 },
    { id: 'content', label: 'Content', num: 3 },
    { id: 'toc', label: 'TOC & Assets', num: 4 },
    { id: 'review', label: 'Cover & Review', num: 5 },
];

interface CoAuthorWithId extends Author {
    tempId: string;
}

interface FormState {
    submissionId: string;
    mainAuthor: Author;
    coAuthors: CoAuthorWithId[];
    title: string;
    category: string;
    description: string;
    isbn: string;
    publishedDate: string;
    pages: number;
    indexedIn: string;
    releaseDate: string;
    copyright: string;
    doi: string;
    priceSoftCopy?: number;
    priceHardCopy?: number;
    priceCombined?: number;
    googleLink?: string;
    flipkartLink?: string;
    amazonLink?: string;
    synopses: string[];
    scopeIntro: string;
    coverImage: string;
    keywords: string[];
    editors: string[];
    frontmatterPdfs: Record<string, { pdfKey?: string; mimeType?: string; name?: string }>;
}

// ============================================================
// Component
// ============================================================

const EditPublishedChapterModal: React.FC<EditPublishedChapterModalProps> = ({
    book,
    isOpen,
    onClose,
    onSave,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('author');
    const [errors, setErrors] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [pdfUploading, setPdfUploading] = useState<Record<string | number, number | 'error'>>({});

    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
    });

    const createEmptyAuthor = (): Author => ({
        firstName: '', lastName: '', designation: '', departmentName: '',
        instituteName: '', city: '', state: '', country: '', email: '',
        phoneNumber: '', isCorrespondingAuthor: false, otherDesignation: ''
    });

    const [form, setForm] = useState<FormState>({
        submissionId: '',
        mainAuthor: createEmptyAuthor(),
        coAuthors: [],
        title: '',
        category: 'Engineering & Management',
        description: '',
        isbn: '',
        publishedDate: new Date().getFullYear().toString(),
        pages: 0,
        indexedIn: 'Google Scholar',
        releaseDate: new Date().toLocaleDateString('en-GB'),
        copyright: `© ${new Date().getFullYear()} BR Publications`,
        doi: '',
        priceSoftCopy: undefined,
        priceHardCopy: undefined,
        priceCombined: undefined,
        googleLink: undefined,
        flipkartLink: undefined,
        amazonLink: undefined,
        synopses: [''],
        scopeIntro: '',
        coverImage: '',
        keywords: [],
        editors: [],
        frontmatterPdfs: {},
    });

    const extraPdfTypes = [
        'Dedication', 'Frontmatter', 'Detailed Table of Contents',
        'Preface', 'Acknowledgment', 'About the Contributors', 'Index'
    ];

    const [scopeItems, setScopeItems] = useState<string[]>(['']);
    const [tocChapters, setTocChapters] = useState<TocChapterPayload[]>([]);
    const [biographies, setBiographies] = useState<AuthorBiographyPayload[]>([]);
    const [archiveIntro, setArchiveIntro] = useState('');
    const [archiveItems, setArchiveItems] = useState<string[]>(['']);

    const [originalImage, setOriginalImage] = useState('');
    const [showCropper, setShowCropper] = useState(false);
    const [cropPos, setCropPos] = useState<Point>({ x: 0, y: 150 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const COVER_ASPECT_RATIO = 1.12 / 1.4;
    const pdfInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const extraPdfInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Data Pre-filling Logic
    useEffect(() => {
        if (!isOpen || !book) return;

        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch the complete chapter details instead of relying only on the list-view row data
                const fullBookData = await getPublishedChapterById(book.id);
                if (!isMounted) return;

                const bookData = fullBookData || book; // Fallback to list view item if fetch fails

                // Helper to parse JSON fields safely
                const parseJson = (val: any) => {
                    if (!val) return null;
                    if (typeof val === 'object') return val;
                    try { return JSON.parse(val); } catch (e) { return null; }
                };

                // Parse Main Author — prefer structured object, fall back to flat string
                let parsedMainAuthor: Author = createEmptyAuthor();
                if (bookData.mainAuthor && typeof bookData.mainAuthor === 'object') {
                    parsedMainAuthor = { ...createEmptyAuthor(), ...bookData.mainAuthor };
                } else if (bookData.mainAuthor && typeof bookData.mainAuthor === 'string') {
                    try { parsedMainAuthor = { ...createEmptyAuthor(), ...JSON.parse(bookData.mainAuthor) }; } catch (_) { }
                }
                // Fall back to flat string name if structured data unavailable
                if (!parsedMainAuthor.firstName && !parsedMainAuthor.lastName) {
                    const authorParts = (bookData.author || '').split(' ');
                    parsedMainAuthor.lastName = authorParts.length > 1 ? authorParts.pop()! : '';
                    parsedMainAuthor.firstName = authorParts.join(' ');
                    parsedMainAuthor.email = bookData.authorEmail || '';
                }

                // Parse Co-Authors — prefer structured array, fall back to flat string
                let coAuthorsList: CoAuthorWithId[] = [];
                if (Array.isArray(bookData.coAuthorsData) && bookData.coAuthorsData.length > 0) {
                    coAuthorsList = bookData.coAuthorsData.map((ca: any, idx: number) => ({
                        ...createEmptyAuthor(),
                        ...ca,
                        tempId: `temp-${idx}-${Math.random()}`
                    }));
                } else if (bookData.coAuthors && typeof bookData.coAuthors === 'string') {
                    coAuthorsList = bookData.coAuthors.split(',').map((name: string, idx: number) => {
                        const parts = name.trim().split(' ');
                        const lastName = parts.length > 1 ? parts.pop()! : '';
                        const firstName = parts.join(' ');
                        return { ...createEmptyAuthor(), firstName, lastName, tempId: `temp-${idx}-${Math.random()}` };
                    });
                }

                // Parse Synopses
                const synopsisData = parseJson(bookData.synopsis) || {};
                // Support both "paragraph_N" and legacy "paragrapgh_N" (typo)
                const synopses = Object.keys(synopsisData)
                    .sort((a, b) => {
                        const aNum = parseInt(a.split('_')[1] || '0');
                        const bNum = parseInt(b.split('_')[1] || '0');
                        return aNum - bNum;
                    })
                    .map(key => synopsisData[key]);

                // Parse Scope
                const scopeData = parseJson(bookData.scope) || {};
                const scIntro = scopeData.paragraph_1 || '';
                const scItems = Object.keys(scopeData)
                    .filter(k => k.startsWith('list_'))
                    .sort((a, b) => a.localeCompare(b))
                    .map(k => scopeData[k]);

                // Parse Archives
                const archiveData = parseJson(bookData.archives) || {};
                const archIntro = archiveData.paragraph_1 || '';
                const archItems = Object.keys(archiveData)
                    .filter(k => k.startsWith('list_'))
                    .sort((a, b) => a.localeCompare(b))
                    .map(k => archiveData[k]);

                setForm({
                    submissionId: bookData.submissionId || '',
                    mainAuthor: parsedMainAuthor,
                    coAuthors: coAuthorsList,
                    title: bookData.title || '',
                    category: bookData.category || 'Engineering & Management',
                    description: bookData.description || '',
                    isbn: bookData.isbn || '',
                    publishedDate: bookData.publishedDate || '',
                    pages: bookData.pages || 0,
                    indexedIn: bookData.indexedIn || '',
                    releaseDate: bookData.releaseDate || '',
                    copyright: bookData.copyright || '',
                    doi: bookData.doi || '',
                    priceSoftCopy: bookData.pricing?.softCopyPrice,
                    priceHardCopy: bookData.pricing?.hardCopyPrice,
                    priceCombined: bookData.pricing?.combinedPrice,
                    googleLink: bookData.googleLink || '',
                    flipkartLink: bookData.flipkartLink || '',
                    amazonLink: bookData.amazonLink || '',
                    synopses: synopses.length > 0 ? synopses : [''],
                    scopeIntro: scIntro,
                    coverImage: bookData.coverImage || '',
                    keywords: bookData.keywords || [],
                    editors: Array.isArray(bookData.editors) ? bookData.editors : (typeof bookData.editors === 'string' ? bookData.editors.split(',').map((s: string) => s.trim()) : []),
                    frontmatterPdfs: parseJson(bookData.frontmatterPdfs) || {},
                });

                setScopeItems(scItems.length > 0 ? scItems : ['']);
                setArchiveIntro(archIntro);
                setArchiveItems(archItems.length > 0 ? archItems : ['']);
                setTocChapters(bookData.tableContents || []);
                setBiographies(bookData.authorBiographies || []);

                setActiveTab('author');
            } catch (err) {
                console.error("Failed to load full chapter data", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [isOpen, book]);

    // ── Helpers ──────────────────────────────────────────────

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const handleMainAuthorChange = (field: keyof Author, value: any) => {
        setForm((p) => ({
            ...p,
            mainAuthor: { ...p.mainAuthor, [field]: value }
        }));
    };

    const handleCoAuthorChange = (tempId: string, field: keyof Author, value: any) => {
        setForm((p) => ({
            ...p,
            coAuthors: p.coAuthors.map(ca => ca.tempId === tempId ? { ...ca, [field]: value } : ca)
        }));
    };

    const addCoAuthor = () => {
        setForm(p => ({
            ...p,
            coAuthors: [
                ...p.coAuthors,
                {
                    ...createEmptyAuthor(),
                    tempId: `temp-${Date.now()}`,
                }
            ]
        }));
    };

    const removeCoAuthor = (tempId: string) => {
        setForm(p => ({
            ...p,
            coAuthors: p.coAuthors.filter(ca => ca.tempId !== tempId)
        }));
    };

    const validateTab = (tab: TabType): string => {
        switch (tab) {
            case 'author':
                if (!form.mainAuthor.firstName.trim() || !form.mainAuthor.lastName.trim()) return 'Main Author first and last name are required.';
                if (form.mainAuthor.phoneNumber && !isValidPhoneNumber(form.mainAuthor.phoneNumber)) return 'Main Author: Phone number must be at least 10 digits.';
                for (const ca of form.coAuthors) {
                    if (ca.phoneNumber && !isValidPhoneNumber(ca.phoneNumber)) return `Co-Author: ${ca.firstName} ${ca.lastName}'s phone number must be at least 10 digits.`;
                }
                break;
            case 'metadata':
                if (!form.title.trim()) return 'Book title is required.';
                if (form.editors.length === 0) return 'At least one editor is required.';
                if (!form.isbn.trim()) return 'ISBN is required.';
                break;
            case 'content':
                if (form.synopses.some(s => !s.trim())) return 'All synopsis paragraphs must have content.';
                break;
            case 'toc':
                if (tocChapters.length > 0 && tocChapters.some((c) => !c.title.trim())) {
                    return 'All chapters must have a title.';
                }
                break;
        }
        return '';
    };

    const handleNextTab = () => {
        const order: TabType[] = ['author', 'metadata', 'content', 'toc', 'review'];
        const err = validateTab(activeTab);
        if (err) {
            setErrors(err);
            setAlertConfig({ isOpen: true, type: 'warning', title: 'Missing Information', message: err });
            return;
        }
        setErrors('');
        const idx = order.indexOf(activeTab);
        if (idx < order.length - 1) {
            setActiveTab(order[idx + 1]);
        }
    };

    const handlePrevTab = () => {
        const order: TabType[] = ['author', 'metadata', 'content', 'toc', 'review'];
        setErrors('');
        const idx = order.indexOf(activeTab);
        if (idx > 0) setActiveTab(order[idx - 1]);
    };

    // ── TOC ──────────────────────────────────────────────────
    const addTocChapter = () =>
        setTocChapters((p) => [
            ...p,
            { title: '', chapterNumber: String(p.length + 1).padStart(2, '0') },
        ]);

    const removeTocChapter = (i: number) =>
        setTocChapters((p) => p.filter((_, idx) => idx !== i));

    const updateTocField = (i: number, field: keyof TocChapterPayload, val: string) =>
        setTocChapters((p) => p.map((ch, idx) => (idx === i ? { ...ch, [field]: val } : ch)));

    const handlePdfUpload = async (i: number, file: File) => {
        setPdfUploading(p => ({ ...p, [i]: 0 }));
        try {
            const result = await uploadDirectTempPdf(file, (pct) => setPdfUploading(prev => ({ ...prev, [i]: pct })));
            setTocChapters(p =>
                p.map((ch, idx) =>
                    idx === i
                        ? { ...ch, pdfKey: result.fileKey, pdfMimeType: result.mimeType, pdfName: result.originalName }
                        : ch
                )
            );
            setPdfUploading(p => { const n = { ...p }; delete n[i]; return n; });
        } catch (err: any) {
            setPdfUploading(p => ({ ...p, [i]: 'error' }));
            toast.error(`Failed to upload PDF: ${err.message}`);
        }
    };

    const handleExtraPdfUpload = async (type: string, file: File) => {
        setPdfUploading(p => ({ ...p, [type]: 0 }));
        try {
            const result = await uploadDirectTempPdf(file, (pct) => setPdfUploading(prev => ({ ...prev, [type]: pct })));
            setForm(p => ({
                ...p,
                frontmatterPdfs: {
                    ...p.frontmatterPdfs,
                    [type]: { pdfKey: result.fileKey, mimeType: result.mimeType, name: result.originalName }
                }
            }));
            setPdfUploading(p => { const n = { ...p }; delete n[type]; return n; });
        } catch (err: any) {
            setPdfUploading(p => ({ ...p, [type]: 'error' }));
            toast.error(`Failed to upload ${type} PDF: ${err.message}`);
        }
    };

    // ── Biographies ──────────────────────────────────────────
    const addBio = () => setBiographies((p) => [...p, { authorName: '', biography: '' }]);
    const removeBio = (i: number) => setBiographies((p) => p.filter((_, idx) => idx !== i));
    const updateBio = (i: number, field: keyof AuthorBiographyPayload, val: string) =>
        setBiographies((p) => p.map((b, idx) => (idx === i ? { ...b, [field]: val } : b)));

    // ── Scope / Archives ─────────────────────────────────────
    const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => setter((p) => [...p, '']);
    const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, i: number) =>
        setter((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));
    const updateItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, i: number, v: string) =>
        setter((p) => p.map((x, idx) => (idx === i ? v : x)));

    const addSynopsis = () => form.synopses.length < 4 && setForm(p => ({ ...p, synopses: [...p.synopses, ''] }));
    const removeSynopsis = (i: number) => form.synopses.length > 1 && setForm(p => ({ ...p, synopses: p.synopses.filter((_, idx) => idx !== i) }));
    const updateSynopsis = (i: number, val: string) => setForm(p => ({ ...p, synopses: p.synopses.map((s, idx) => idx === i ? val : s) }));

    // ── Cover image crop ─────────────────────────────────────
    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setOriginalImage(reader.result as string);
            setCropPos({ x: 0, y: 150 });
            setZoom(1);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const getCroppedImg = async (): Promise<string> => {
        if (!croppedAreaPixels || !originalImage) return '';
        const imageElement = new Image();
        imageElement.src = originalImage;
        return new Promise((resolve) => {
            imageElement.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(''); return; }
                canvas.width = croppedAreaPixels.width;
                canvas.height = croppedAreaPixels.height;
                ctx.drawImage(imageElement, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            };
        });
    };

    const applyCrop = async () => {
        const cropped = await getCroppedImg();
        if (cropped) {
            setForm((p) => ({ ...p, coverImage: cropped }));
            setShowCropper(false);
        }
    };

    // ── Submit ───────────────────────────────────────────────

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const scope: Record<string, string> = { paragraph_1: form.scopeIntro };
            scopeItems.forEach((v, i) => { if (v.trim()) scope[`list_${i + 1}`] = v; });

            const archives: Record<string, string> = { paragraph_1: archiveIntro };
            archiveItems.forEach((v, i) => { if (v.trim()) archives[`list_${i + 1}`] = v; });

            const payload = {
                title: form.title,
                author: `${form.mainAuthor.firstName} ${form.mainAuthor.lastName}`.trim(),
                mainAuthor: form.mainAuthor,
                coAuthors: form.coAuthors.map(ca => `${ca.firstName} ${ca.lastName}`.trim()).join(', ') || undefined,
                coAuthorsData: form.coAuthors.map(({ tempId, ...rest }) => rest),
                coverImage: form.coverImage || undefined,
                category: form.category,
                description: form.description,
                isbn: form.isbn,
                publishedDate: form.publishedDate,
                pages: Number(form.pages),
                indexedIn: form.indexedIn || undefined,
                releaseDate: form.releaseDate || undefined,
                copyright: form.copyright || undefined,
                doi: form.doi || undefined,
                pricing: {
                    softCopyPrice: Number(form.priceSoftCopy) || 0,
                    hardCopyPrice: Number(form.priceHardCopy) || 0,
                    combinedPrice: Number(form.priceCombined) || 0,
                },
                googleLink: form.googleLink || undefined,
                flipkartLink: form.flipkartLink || undefined,
                amazonLink: form.amazonLink || undefined,
                synopsis: form.synopses.reduce((acc, text, index) => {
                    if (text.trim()) acc[`paragraph_${index + 1}`] = text;
                    return acc;
                }, {} as Record<string, string>),
                scope,
                tableContents: tocChapters.filter((c) => c.title.trim()),
                authorBiographies: biographies.filter((b) => b.authorName.trim() || b.biography.trim()),
                archives,
                editors: form.editors,
                keywords: form.keywords,
                frontmatterPdfs: form.frontmatterPdfs,
            };

            await onSave(book.id, payload);
            onClose();
            toast.success('🎉 Changes saved successfully!');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save changes.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="publish-chapter-form-wrapper">
                <div className="pcw-form-container">
                    <div className="pcw-header">
                        <div>
                            <h2>✏️ Edit Published Chapter</h2>
                            <div className="pcw-header-sub">Update details for "{book.title}"</div>
                        </div>
                        <button onClick={onClose} className="pcw-close-btn">&times;</button>
                    </div>

                    <div className="form-tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => {
                                    setErrors('');
                                    setActiveTab(tab.id);
                                }}
                            >
                                <span>{tab.num}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="pcw-body">
                        {errors && <div className="pcw-error-banner">⚠ {errors}</div>}

                        {activeTab === 'author' && (
                            <div className="tab-pane active slide-in-bottom">
                                <p className="pcw-step-title">Author Details</p>
                                <div className="pcw-section-title">
                                    <span>Main Author <span className="req">*</span></span>
                                    {form.mainAuthor.isCorrespondingAuthor && (
                                        <span style={{ fontSize: '12px', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px', fontWeight: 500, marginLeft: '8px' }}>
                                            Corresponding Author
                                        </span>
                                    )}
                                </div>
                                <div className="pcw-field-grid">
                                    <div className="pcw-field">
                                        <label className="pcw-label">First Name <span className="req">*</span></label>
                                        <input className="pcw-input" value={form.mainAuthor.firstName} onChange={(e) => handleMainAuthorChange('firstName', e.target.value)} placeholder="e.g. John" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Last Name <span className="req">*</span></label>
                                        <input className="pcw-input" value={form.mainAuthor.lastName} onChange={(e) => handleMainAuthorChange('lastName', e.target.value)} placeholder="e.g. Doe" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Designation</label>
                                        <select className="pcw-select" value={form.mainAuthor.designation} onChange={(e) => handleMainAuthorChange('designation', e.target.value)}>
                                            <option value="">Select Designation</option>
                                            {DESIGNATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                        </select>
                                    </div>
                                    {form.mainAuthor.designation === 'other' && (
                                        <div className="pcw-field">
                                            <label className="pcw-label">Other Designation</label>
                                            <input className="pcw-input" value={form.mainAuthor.otherDesignation || ''} onChange={(e) => handleMainAuthorChange('otherDesignation', e.target.value)} placeholder="e.g. Research Fellow" />
                                        </div>
                                    )}
                                    <div className="pcw-field">
                                        <label className="pcw-label">Department Name</label>
                                        <input className="pcw-input" value={form.mainAuthor.departmentName} onChange={(e) => handleMainAuthorChange('departmentName', e.target.value)} placeholder="e.g. Computer Science" />
                                    </div>
                                    <div className="pcw-field span-full">
                                        <label className="pcw-label">Institute / University Name</label>
                                        <input className="pcw-input" value={form.mainAuthor.instituteName} onChange={(e) => handleMainAuthorChange('instituteName', e.target.value)} placeholder="e.g. Stanford University" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">City</label>
                                        <input className="pcw-input" value={form.mainAuthor.city} onChange={(e) => handleMainAuthorChange('city', e.target.value)} placeholder="e.g. Palo Alto" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">State</label>
                                        <input className="pcw-input" value={form.mainAuthor.state} onChange={(e) => handleMainAuthorChange('state', e.target.value)} placeholder="e.g. California" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Country</label>
                                        <input className="pcw-input" value={form.mainAuthor.country} onChange={(e) => handleMainAuthorChange('country', e.target.value)} placeholder="e.g. USA" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Email</label>
                                        <input className="pcw-input" type="email" value={form.mainAuthor.email} onChange={(e) => handleMainAuthorChange('email', e.target.value)} placeholder="e.g. john.doe@example.com" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Phone Number (Optional)</label>
                                        <PhoneNumberInput
                                            value={form.mainAuthor.phoneNumber || ''}
                                            onChange={(val) => handleMainAuthorChange('phoneNumber', val)}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                    <div className="pcw-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                                        <input type="checkbox" id="mainAuthorCorresponding" checked={!!form.mainAuthor.isCorrespondingAuthor} onChange={(e) => handleMainAuthorChange('isCorrespondingAuthor', e.target.checked)} />
                                        <label htmlFor="mainAuthorCorresponding" className="pcw-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Corresponding Author</label>
                                    </div>
                                </div>

                                <div className="pcw-section-title">
                                    <span>Co-Authors</span>
                                    <button type="button" className="pcw-add-btn" onClick={addCoAuthor}>+ Add Co-Author</button>
                                </div>
                                {form.coAuthors.map((ca, i) => (
                                    <div key={ca.tempId} className="pcw-toc-row" style={{ marginBottom: '16px' }}>
                                        <div className="pcw-toc-row-header">
                                            <h4 style={{ margin: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                Co-Author {i + 1}
                                                {ca.isCorrespondingAuthor && (
                                                    <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '10px', fontWeight: 500 }}>
                                                        Corresponding
                                                    </span>
                                                )}
                                            </h4>
                                            <button type="button" className="pcw-remove-btn" onClick={() => removeCoAuthor(ca.tempId)}>✕ Remove</button>
                                        </div>
                                        <div className="pcw-field-grid">
                                            <div className="pcw-field">
                                                <label className="pcw-label">First Name <span className="req">*</span></label>
                                                <input className="pcw-input" value={ca.firstName} placeholder="e.g. Jane" onChange={(e) => handleCoAuthorChange(ca.tempId, 'firstName', e.target.value)} />
                                            </div>
                                            <div className="pcw-field">
                                                <label className="pcw-label">Last Name <span className="req">*</span></label>
                                                <input className="pcw-input" value={ca.lastName} placeholder="e.g. Smith" onChange={(e) => handleCoAuthorChange(ca.tempId, 'lastName', e.target.value)} />
                                            </div>
                                            <div className="pcw-field">
                                                <label className="pcw-label">Designation</label>
                                                <select className="pcw-select" value={ca.designation} onChange={(e) => handleCoAuthorChange(ca.tempId, 'designation', e.target.value)}>
                                                    <option value="">Select Designation</option>
                                                    {DESIGNATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                                </select>
                                            </div>
                                            {ca.designation === 'other' && (
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Other Designation</label>
                                                    <input className="pcw-input" value={ca.otherDesignation || ''} onChange={(e) => handleCoAuthorChange(ca.tempId, 'otherDesignation', e.target.value)} placeholder="e.g. Research Fellow" />
                                                </div>
                                            )}
                                            <div className="pcw-field">
                                                <label className="pcw-label">Department Name</label>
                                                <input className="pcw-input" value={ca.departmentName} placeholder="e.g. Computer Science" onChange={(e) => handleCoAuthorChange(ca.tempId, 'departmentName', e.target.value)} />
                                            </div>
                                            <div className="pcw-field span-full">
                                                <label className="pcw-label">Institute / University Name</label>
                                                <input className="pcw-input" value={ca.instituteName} placeholder="e.g. Stanford University" onChange={(e) => handleCoAuthorChange(ca.tempId, 'instituteName', e.target.value)} />
                                            </div>
                                            <div className="pcw-field">
                                                <label className="pcw-label">City</label>
                                                <input className="pcw-input" value={ca.city} placeholder="e.g. Palo Alto" onChange={(e) => handleCoAuthorChange(ca.tempId, 'city', e.target.value)} />
                                            </div>
                                            <div className="pcw-field">
                                                <label className="pcw-label">State</label>
                                                <input className="pcw-input" value={ca.state} placeholder="e.g. California" onChange={(e) => handleCoAuthorChange(ca.tempId, 'state', e.target.value)} />
                                            </div>
                                            <div className="pcw-field">
                                                <label className="pcw-label">Country</label>
                                                <input className="pcw-input" value={ca.country} placeholder="e.g. USA" onChange={(e) => handleCoAuthorChange(ca.tempId, 'country', e.target.value)} />
                                            </div>
                                            <div className="pcw-field">
                                                <label className="pcw-label">Email</label>
                                                <input className="pcw-input" type="email" value={ca.email} placeholder="e.g. jane@example.com" onChange={(e) => handleCoAuthorChange(ca.tempId, 'email', e.target.value)} />
                                            </div>
                                            <div className="pcw-field">
                                                <label className="pcw-label">Phone Number (Optional)</label>
                                                <PhoneNumberInput
                                                    value={ca.phoneNumber || ''}
                                                    onChange={(val) => handleCoAuthorChange(ca.tempId, 'phoneNumber', val)}
                                                    placeholder="Enter phone number"
                                                />
                                            </div>
                                            <div className="pcw-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                                                <input type="checkbox" id={`coAuthorCorresponding-${i}`} checked={!!ca.isCorrespondingAuthor} onChange={(e) => handleCoAuthorChange(ca.tempId, 'isCorrespondingAuthor', e.target.checked)} />
                                                <label htmlFor={`coAuthorCorresponding-${i}`} className="pcw-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Corresponding Author</label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'metadata' && (
                            <div className="tab-pane active slide-in-bottom">
                                <p className="pcw-step-title">Book Metadata</p>
                                <div className="pcw-field-grid">
                                    <div className="pcw-field span-full">
                                        <label className="pcw-label">Book Title <span className="req">*</span></label>
                                        <input className="pcw-input" name="title" value={form.title} onChange={handleFormChange} />
                                    </div>
                                    <div className="pcw-field span-full">
                                        <label className="pcw-label">Editors (comma separated) <span className="req">*</span></label>
                                        <input
                                            className="pcw-input"
                                            value={form.editors.join(', ')}
                                            onChange={(e) => setForm(p => ({ ...p, editors: e.target.value.split(',').map(s => s.trim()) }))}
                                            placeholder="e.g. Dr. Alice Smith, Prof. Bob Johnson"
                                        />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Category <span className="req">*</span></label>
                                        <select className="pcw-select" name="category" value={form.category} onChange={handleFormChange}>
                                            <option value="Engineering & Management">Engineering &amp; Management</option>
                                            <option value="Medical & Health Sciences">Medical &amp; Health Sciences</option>
                                            <option value="Interdisciplinary Sciences">Interdisciplinary Sciences</option>
                                        </select>
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">ISBN <span className="req">*</span></label>
                                        <input className="pcw-input" name="isbn" value={form.isbn} onChange={handleFormChange} />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">DOI</label>
                                        <input className="pcw-input" name="doi" value={form.doi} onChange={handleFormChange} />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Pages</label>
                                        <input className="pcw-input" name="pages" type="number" value={form.pages || ''} onChange={handleFormChange} />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Published Year</label>
                                        <input className="pcw-input" name="publishedDate" value={form.publishedDate} onChange={handleFormChange} />
                                    </div>
                                    <div className="pcw-field span-full">
                                        <label className="pcw-label">Keywords (comma separated)</label>
                                        <input
                                            className="pcw-input"
                                            value={form.keywords.join(', ')}
                                            onChange={(e) => setForm(p => ({ ...p, keywords: e.target.value.split(',').map(s => s.trim()) }))}
                                            placeholder="e.g. AI, Machine Learning, Robotics"
                                        />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Release Date</label>
                                        <input className="pcw-input" name="releaseDate" value={form.releaseDate} onChange={handleFormChange} placeholder="e.g. 23/12/2024" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Indexed In</label>
                                        <input className="pcw-input" name="indexedIn" value={form.indexedIn} onChange={handleFormChange} placeholder="e.g. Scopus, Google Scholar" />
                                    </div>
                                    <div className="pcw-field span-full">
                                        <label className="pcw-label">Copyright</label>
                                        <input className="pcw-input" name="copyright" value={form.copyright} onChange={handleFormChange} placeholder="e.g. © 2024 BR Publications" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Submission ID</label>
                                        <input className="pcw-input" style={{ background: '#f1f5f9' }} value={form.submissionId} readOnly />
                                    </div>
                                    <div className="pcw-field span-full">
                                        <label className="pcw-label">Pricing Details (Soft / Hard / Combined)</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input className="pcw-input" type="number" name="priceSoftCopy" value={form.priceSoftCopy || ''} onChange={handleFormChange} placeholder="Soft Copy" />
                                            <input className="pcw-input" type="number" name="priceHardCopy" value={form.priceHardCopy || ''} onChange={handleFormChange} placeholder="Hard Copy" />
                                            <input className="pcw-input" type="number" name="priceCombined" value={form.priceCombined || ''} onChange={handleFormChange} placeholder="Combined" />
                                        </div>
                                    </div>
                                    <div className="pcw-field span-full" style={{ marginTop: '12px' }}>
                                        <label className="pcw-label">External Selling Links (Optional)</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input className="pcw-input" name="googleLink" value={form.googleLink || ''} onChange={handleFormChange} placeholder="Google Books URL" />
                                            <input className="pcw-input" name="flipkartLink" value={form.flipkartLink || ''} onChange={handleFormChange} placeholder="Flipkart URL" />
                                            <input className="pcw-input" name="amazonLink" value={form.amazonLink || ''} onChange={handleFormChange} placeholder="Amazon URL" />
                                        </div>
                                    </div>
                                </div>
                                <div className="pcw-field" style={{ marginTop: 8 }}>
                                    <label className="pcw-label">Abstract / Description</label>
                                    <textarea className="pcw-textarea" name="description" rows={3} value={form.description} onChange={handleFormChange} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="tab-pane active slide-in-bottom">
                                <p className="pcw-step-title">Synopsis</p>
                                {form.synopses.map((s, i) => (
                                    <div className="pcw-field" key={i} style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <label className="pcw-label">Paragraph {i + 1}</label>
                                            {form.synopses.length > 1 && <button type="button" className="pcw-remove-btn" onClick={() => removeSynopsis(i)}>✕</button>}
                                        </div>
                                        <textarea className="pcw-textarea" rows={3} value={s} onChange={(e) => updateSynopsis(i, e.target.value)} />
                                    </div>
                                ))}
                                {form.synopses.length < 4 && <button type="button" className="pcw-add-btn" onClick={addSynopsis}>+ Add Paragraph</button>}

                                <div className="pcw-section">
                                    <p className="pcw-step-title">Scope</p>
                                    <textarea className="pcw-textarea" rows={2} value={form.scopeIntro} onChange={(e) => setForm(p => ({ ...p, scopeIntro: e.target.value }))} placeholder="Introduction..." />
                                    {scopeItems.map((item, i) => (
                                        <div className="pcw-list-row" key={i} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                            <input className="pcw-input" value={item} onChange={(e) => updateItem(setScopeItems, i, e.target.value)} />
                                            {scopeItems.length > 1 && <button type="button" className="pcw-remove-btn" onClick={() => removeItem(setScopeItems, i)}>✕</button>}
                                        </div>
                                    ))}
                                    <button type="button" className="pcw-add-btn" onClick={() => addItem(setScopeItems)}>+ Add Scope Item</button>
                                </div>

                                <div className="pcw-section" style={{ marginTop: 14 }}>
                                    <p className="pcw-step-title">Archives</p>
                                    <textarea className="pcw-textarea" rows={2} value={archiveIntro} onChange={(e) => setArchiveIntro(e.target.value)} placeholder="Introduction..." />
                                    {archiveItems.map((item, i) => (
                                        <div className="pcw-list-row" key={i} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                            <input className="pcw-input" value={item} onChange={(e) => updateItem(setArchiveItems, i, e.target.value)} />
                                            {archiveItems.length > 1 && <button type="button" className="pcw-remove-btn" onClick={() => removeItem(setArchiveItems, i)}>✕</button>}
                                        </div>
                                    ))}
                                    <button type="button" className="pcw-add-btn" onClick={() => addItem(setArchiveItems)}>+ Add Archive Item</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'toc' && (
                            <div className="tab-pane active slide-in-bottom">
                                <p className="pcw-step-title">Table of Contents</p>
                                {tocChapters.map((ch, i) => (
                                    <div className="pcw-toc-row" key={i}>
                                        <div className="pcw-toc-row-header">
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <div className="pcw-toc-num">{ch.chapterNumber}</div>
                                                <input className="pcw-input" style={{ border: 'none', background: 'transparent', fontWeight: 600 }} value={ch.title} onChange={(e) => updateTocField(i, 'title', e.target.value)} placeholder="Untitled Chapter" />
                                            </div>
                                            <button type="button" className="pcw-remove-btn" onClick={() => removeTocChapter(i)}>✕</button>
                                        </div>
                                        <div className="pcw-field-grid">
                                            <input className="pcw-input" value={ch.authors || ''} placeholder="Authors" onChange={(e) => updateTocField(i, 'authors', e.target.value)} />
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <input className="pcw-input" placeholder="From Page" value={ch.pagesFrom || ''} onChange={(e) => updateTocField(i, 'pagesFrom', e.target.value)} />
                                                <input className="pcw-input" placeholder="To Page" value={ch.pagesTo || ''} onChange={(e) => updateTocField(i, 'pagesTo', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="pcw-toc-flex-row" style={{ marginTop: '4px' }}>
                                            <button type="button" className={`pcw-pdf-upload-btn ${ch.pdfKey ? 'has-pdf' : ''}`} onClick={() => pdfInputRefs.current[i]?.click()}>
                                                {pdfUploading[i] !== undefined ? `${pdfUploading[i]}%` :
                                                    ch.pdfKey ? '✔ PDF Linked' : '⬆ Upload PDF'}
                                            </button>
                                            <input type="file" accept="application/pdf" className="pcw-hidden-input" style={{ display: 'none' }} ref={(el) => { pdfInputRefs.current[i] = el; }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(i, f); }} />
                                            {ch.pdfKey && <button type="button" className="pcw-remove-btn" onClick={() => updateTocField(i, 'pdfKey', '')} title="Clear PDF">✕</button>}
                                            {ch.pdfName && <span style={{ fontSize: '10px' }}>{ch.pdfName}</span>}
                                        </div>
                                    </div>
                                ))}
                                <button type="button" className="pcw-add-btn" onClick={addTocChapter}>+ Add Chapter</button>

                                <div className="pcw-section">
                                    <p className="pcw-step-title">Author Biographies</p>
                                    {biographies.map((bio, i) => (
                                        <div className="pcw-bio-card" key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <input className="pcw-input" style={{ fontWeight: 600, border: 'none', background: 'transparent' }} value={bio.authorName} onChange={(e) => updateBio(i, 'authorName', e.target.value)} placeholder="Author Name" />
                                                <button type="button" className="pcw-remove-btn" onClick={() => removeBio(i)}>✕</button>
                                            </div>
                                            <textarea className="pcw-textarea" rows={2} value={bio.biography} onChange={(e) => updateBio(i, 'biography', e.target.value)} />
                                        </div>
                                    ))}
                                    <button type="button" className="pcw-add-btn" onClick={addBio}>+ Add Bio</button>
                                </div>

                                <div className="pcw-section">
                                    <p className="pcw-step-title">Additional Assets (Frontmatter, Preface, etc.)</p>
                                    <div className="pcw-field-grid">
                                        {extraPdfTypes.map(type => (
                                            <div key={type} className="pcw-field">
                                                <label className="pcw-label">{type}</label>
                                                <div className="pcw-toc-flex-row">
                                                    <button
                                                        type="button"
                                                        className={`pcw-pdf-upload-btn ${form.frontmatterPdfs[type]?.pdfKey ? 'has-pdf' : ''}`}
                                                        onClick={() => extraPdfInputRefs.current[type]?.click()}
                                                    >
                                                        {pdfUploading[type] !== undefined
                                                            ? `${pdfUploading[type]}%`
                                                            : (form.frontmatterPdfs[type]?.pdfKey ? '✔ Linked' : '⬆ Upload')}
                                                    </button>
                                                    <input
                                                        type="file"
                                                        accept="application/pdf"
                                                        className="pcw-hidden-input"
                                                        style={{ display: 'none' }}
                                                        ref={(el) => { extraPdfInputRefs.current[type] = el; }}
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0];
                                                            if (f) handleExtraPdfUpload(type, f);
                                                        }}
                                                    />
                                                    {form.frontmatterPdfs[type]?.pdfKey && (
                                                        <button
                                                            type="button"
                                                            className="pcw-remove-btn"
                                                            onClick={() => setForm(p => {
                                                                const next = { ...p.frontmatterPdfs };
                                                                delete next[type];
                                                                return { ...p, frontmatterPdfs: next };
                                                            })}
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                    {form.frontmatterPdfs[type]?.name && (
                                                        <span style={{ fontSize: '10px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {form.frontmatterPdfs[type].name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'review' && (
                            <div className="tab-pane active slide-in-bottom">
                                <p className="pcw-step-title">Cover Image & Review</p>
                                <div className="pcw-cover-container">
                                    <div className="pcw-cover-preview-box">
                                        {form.coverImage ? (
                                            <img src={form.coverImage} alt="Cover" />
                                        ) : book?.hasCoverImage ? (
                                            <img src={getCoverUrl(book.id, book.updatedAt ? new Date(book.updatedAt).getTime() : undefined)} alt="Cover" />
                                        ) : (
                                            <span>No Cover</span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="pcw-cover-upload-label" style={{ padding: '10px', width: '200px' }}>
                                            <span>📷 Replace Image</span>
                                            <input type="file" accept="image/*" className="pcw-cover-upload-input" style={{ display: 'none' }} onChange={handleCoverFileChange} />
                                        </label>
                                        <p className="pcw-step-desc" style={{ marginTop: '8px' }}>Cropping will be available if you upload a new image.</p>
                                    </div>
                                </div>
                                <hr style={{ margin: '20px 0' }} />
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Ready to save?</h3>
                                    <button className="pcw-btn" style={{ background: '#22c55e', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 700, cursor: 'pointer' }} onClick={handleSubmit} disabled={loading}>
                                        {loading ? 'Saving...' : '💾 Save All Changes'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pcw-footer">
                        <div className="pcw-footer-left"><button type="button" className="pcw-btn pcw-btn-secondary" onClick={onClose}>Cancel</button></div>
                        <div className="pcw-footer-right">
                            {activeTab !== 'author' && <button type="button" className="pcw-btn pcw-btn-secondary" onClick={handlePrevTab}>Previous</button>}
                            {activeTab !== 'review' && <button type="button" className="pcw-btn pcw-btn-primary" onClick={handleNextTab}>Next</button>}
                        </div>
                    </div>
                </div>

                {showCropper && originalImage && createPortal(
                    <div className="pcw-cropper-overlay">
                        <div className="pcw-cropper-box">
                            <h3>Crop Cover Image</h3>
                            <div style={{ position: 'relative', width: '100%', height: '300px', background: '#333' }}>
                                <Cropper image={originalImage} crop={cropPos} zoom={zoom} aspect={COVER_ASPECT_RATIO} onCropChange={setCropPos} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                            </div>
                            <div className="pcw-cropper-actions">
                                <button onClick={() => setShowCropper(false)}>Cancel</button>
                                <button className="pcw-btn pcw-btn-primary" onClick={applyCrop}>Apply Crop</button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
            <AlertPopup isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertConfig(p => ({ ...p, isOpen: false }))} />
        </div>
    );
};

export default EditPublishedChapterModal;