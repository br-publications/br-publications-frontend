'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import type { BookChapterSubmission, Author } from '../../types/submissionTypes';
import { DESIGNATIONS } from '../../types/bookChapterManuscriptTypes';
import { publishDirectBookChapter, uploadDirectTempPdf, findAuthors, checkBookChapterIsbnAvailability } from '../../services/bookChapterPublishing.service';
import { bookChapterAdminService } from '../../services/bookChapterSumission.service';
import type { TocChapterPayload, AuthorBiographyPayload, EditorBiographyPayload } from '../../services/bookChapterPublishing.service';
import AuthorMultiSelect from '../common/AuthorMultiSelect';
import AlertPopup from '../common/alertPopup';
import type { AlertType } from '../common/alertPopup';
import PhoneNumberInput from '../common/PhoneNumberInput';
import { isValidPhoneNumber } from '../../utils/phoneValidation';
import { isValidUrl } from '../../utils/urlValidation';
import { isValidEmail } from '../../utils/emailValidation';
import { usePublishingDraft } from '../../hooks/usePublishingDraft';
import { publishDraftService, type PublishingDraft } from '../../services/publishDraftService';
import { generateNextBookChapterUID } from '../../utils/bookChapterUIDGenerator';
import './individualPublishChapterWizard.css';
import '../../pages-content/textBookSubmission/publishing/imageCropper.css';

// ============================================================
// Types
// ============================================================

interface IndividualPublishChapterWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (submission?: BookChapterSubmission) => void;
}

type TabType = 'author' | 'editorBio' | 'metadata' | 'content' | 'bio' | 'toc' | 'review';

interface TabDef {
    id: TabType;
    label: string;
    num: number;
}

const TABS: TabDef[] = [
    { id: 'author', label: 'Authors', num: 1 },
    { id: 'editorBio', label: 'Editor Biography', num: 2 },
    { id: 'metadata', label: 'Book Metadata', num: 3 },
    { id: 'content', label: 'Content', num: 4 },
    { id: 'bio', label: 'Author Biography', num: 5 },
    { id: 'toc', label: 'TOC & Assets', num: 6 },
    { id: 'review', label: 'Cover & Review', num: 7 },
];

interface CoAuthorWithId extends Author {
    tempId: string;
}

interface FormState {
    submissionId: string;
    // Step 1
    mainAuthor: Author;
    coAuthors: CoAuthorWithId[];
    title: string;
    editors: string[];
    primaryEditor?: string;
    category: string;
    description: string;
    isbn: string;
    publishedDate: string;
    pages: number;
    indexedIn: string;
    releaseDate: string;
    copyright: string;
    doi: string;
    keywords: string[];
    priceSoftCopy?: number;
    priceHardCopy?: number;
    priceCombined?: number;
    googleLink?: string;
    flipkartLink?: string;
    amazonLink?: string;
    uid: string;
    // Step 3
    synopses: string[];
    // Step 4
    scopeIntro: string;
    // Step 8
    coverImage: string;
    // Step 5 frontmatter PDFs stored as fileKey references
    frontmatterPdfs: Record<string, { pdfKey?: string; mimeType?: string; name?: string }>;
}

// ============================================================
// Component
// ============================================================

const IndividualPublishChapterWizard: React.FC<IndividualPublishChapterWizardProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('author');
    const pcwBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (pcwBodyRef.current) {
            pcwBodyRef.current.scrollTop = 0;
        }
    }, [activeTab]);

    const [touchedTabs, setTouchedTabs] = useState<Set<TabType>>(new Set(['author']));
    const [errors, setErrors] = useState<string>('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [recentDrafts, setRecentDrafts] = useState<PublishingDraft[]>([]);
    const [showDraftSelection, setShowDraftSelection] = useState(false);

    /**
     * DRAFT Persistence Hook
     */
    // Per-file upload state: key = toc index (number) or frontmatter type (string)
    const [pdfUploading, setPdfUploading] = useState<Record<string | number, number | 'error'>>({});

    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
        onConfirm?: () => void;
        confirmText?: string;
        showCancel?: boolean;
        cancelText?: string;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
    });

    // Initial empty state
    const createEmptyAuthor = (): Author => ({
        firstName: '', lastName: '', designation: '', departmentName: '',
        instituteName: '', city: '', state: '', country: '', email: '',
        phoneNumber: '', isCorrespondingAuthor: false, otherDesignation: ''
    });

    const [form, setForm] = useState<FormState>({
        submissionId: '',
        mainAuthor: { ...createEmptyAuthor(), isCorrespondingAuthor: true },
        coAuthors: [],
        title: '',
        editors: [],
        primaryEditor: '',
        category: 'Engineering & Management',
        description: '',
        isbn: '',
        publishedDate: new Date().getFullYear().toString(),
        pages: 0,
        indexedIn: 'Google Scholar',
        releaseDate: new Date().toLocaleDateString('en-GB'),
        copyright: `© ${new Date().getFullYear()}`,
        doi: '',
        priceSoftCopy: undefined,
        priceHardCopy: undefined,

        priceCombined: undefined,
        googleLink: undefined,
        flipkartLink: undefined,
        amazonLink: undefined,
        keywords: [],
        synopses: [''],
        scopeIntro: '',
        coverImage: '',
        frontmatterPdfs: {},
        uid: '',
    });

    const extraPdfTypes = [
        'Dedication', 'Frontmatter', 'Detailed Table of Contents',
        'Preface', 'Acknowledgment', 'About the Contributors', 'Index'
    ];

    const [scopeItems, setScopeItems] = useState<string[]>(['']);
    const [tocChapters, setTocChapters] = useState<TocChapterPayload[]>([{ title: '', chapterNumber: '01' }]);
    const [biographies, setBiographies] = useState<AuthorBiographyPayload[]>([
        { authorName: '', affiliation: '', email: '', biography: '' },
    ]);
    const [editorBiographies, setEditorBiographies] = useState<EditorBiographyPayload[]>([]);
    const [archiveIntro, setArchiveIntro] = useState('');
    const [archiveItems, setArchiveItems] = useState<string[]>(['']);

    // Step 8 – Cover image cropper
    const [originalImage, setOriginalImage] = useState('');
    const [showCropper, setShowCropper] = useState(false);
    const [cropPos, setCropPos] = useState<Point>({ x: 0, y: 150 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const COVER_ASPECT_RATIO = 1.2 / 1.5; // Matches other wizards
    const pdfInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const extraPdfInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    /**
     * DRAFT Persistence Hook
     */
    const {
        isSaving,
        lastSavedAt,
        isRestoring,
        restoreDraft,
        updateState,
        saveDraft,
        deleteDraft
    } = usePublishingDraft({
        submissionId: form.submissionId, // Uses the generated or restored submissionId
        wizardType: 'INDIVIDUAL',
        enabled: isOpen,
        onDraftLoaded: async (payload) => {
            if (payload.form) {
                // Ensure editors and coAuthors are handled correctly if they were stringified
                const parsedForm = { ...payload.form };
                if (typeof parsedForm.editors === 'string') {
                    try { parsedForm.editors = JSON.parse(parsedForm.editors); } catch (e) { parsedForm.editors = []; }
                }
                if (typeof parsedForm.coAuthors === 'string') {
                    try { parsedForm.coAuthors = JSON.parse(parsedForm.coAuthors); } catch (e) { parsedForm.coAuthors = []; }
                }
                const latestUid = await generateNextBookChapterUID();
                parsedForm.uid = latestUid;
                setForm(parsedForm);
            }
            if (payload.scopeItems) setScopeItems(payload.scopeItems);
            if (payload.tocChapters) setTocChapters(payload.tocChapters);
            if (payload.biographies) setBiographies(payload.biographies);
            if (payload.editorBiographies) setEditorBiographies(payload.editorBiographies);
            if (payload.archiveIntro) setArchiveIntro(payload.archiveIntro);
            if (payload.archiveItems) setArchiveItems(payload.archiveItems);
            if (payload.originalImage) setOriginalImage(payload.originalImage);
            setShowDraftSelection(false);
            toast.success('Draft restored successfully!');
        }
    });

    const handleDeleteDraft = (e: React.MouseEvent, draftId: number) => {
        e.stopPropagation();
        setAlertConfig({
            isOpen: true,
            type: 'warning',
            title: 'Delete Draft',
            message: 'Are you sure you want to delete this draft? This action cannot be undone.',
            confirmText: 'Delete',
            showCancel: true,
            cancelText: 'Keep',
            onConfirm: async () => {
                await deleteDraft(draftId);
                // Refresh the drafts list
                const response = await publishDraftService.getDraftsByWizard('INDIVIDUAL');
                setRecentDrafts(response || []);
                setAlertConfig(p => ({ ...p, isOpen: false }));
                toast.success('Draft deleted');
            }
        });
    };

    /**
     * Keep draft state in sync
     */
    useEffect(() => {
        if (!form.submissionId) return;
        updateState({
            form,
            scopeItems,
            tocChapters,
            biographies,
            editorBiographies,
            archiveIntro,
            archiveItems,
            originalImage
        });
    }, [form, scopeItems, tocChapters, biographies, editorBiographies, archiveIntro, archiveItems, originalImage, updateState]);

    // Reset state and auto-generate Submission ID when the modal opens
    useEffect(() => {
        if (!isOpen) {
            setRecentDrafts([]);
            setShowDraftSelection(false);
            return;
        }

        const initWizards = async () => {
            // Check for recent drafts first
            try {
                const drafts = await publishDraftService.listHandyDrafts();
                const individualDrafts = drafts.filter(d => d.wizardType === 'INDIVIDUAL');
                if (individualDrafts.length > 0) {
                    setRecentDrafts(individualDrafts);
                    setShowDraftSelection(true);
                }
            } catch (err) {
                console.error('Failed to fetch recent drafts:', err);
            }

            setActiveTab('author');
            setErrors('');
            setTouchedTabs(new Set(['author']));
            // ... the rest of initialization continues unless draft is selected
        };

        if (isOpen) {
            initWizards();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || showDraftSelection || isRestoring) return;

        // Reset form first with empty submissionId
        setForm({
            submissionId: '',
            mainAuthor: { ...createEmptyAuthor(), isCorrespondingAuthor: true },
            coAuthors: [],
            title: '',
            editors: [],
            primaryEditor: '',
            category: 'Engineering & Management',
            description: '',
            isbn: '',
            publishedDate: new Date().getFullYear().toString(),
            pages: 0,
            indexedIn: 'Google Scholar',
            releaseDate: new Date().toISOString().split('T')[0],
            copyright: `© ${new Date().getFullYear()}`,
            doi: '',
            priceSoftCopy: undefined,
            priceHardCopy: undefined,
            googleLink: undefined,
            flipkartLink: undefined,
            amazonLink: undefined,
            priceCombined: undefined,
            synopses: [''],
            scopeIntro: '',
            coverImage: '',
            keywords: [],
            frontmatterPdfs: {},
            uid: '',
        });
        setScopeItems(['']);
        setTocChapters([{ title: '', chapterNumber: '01' }]);
        setBiographies([{ authorName: '', affiliation: '', email: '', biography: '' }]);
        setEditorBiographies([]);
        setArchiveIntro('');
        setArchiveItems(['']);
        setOriginalImage('');

        // Auto-generate 6-digit Submission ID and UID
        const autoGenerateId = async () => {
            try {
                const response = await bookChapterAdminService.getAdminSubmissions({ page: 1, limit: 1 });
                const lastSubmission = response.data?.submissions?.[0] || response.data?.items?.[0];
                const lastId = lastSubmission ? Number(lastSubmission.id) : 0;

                // nextBaseId = lastId + 1
                const nextBaseId = (lastId + 1).toString();
                // Use last 4 digits of current timestamp for more entropy
                const tsFragment = Date.now().toString().slice(-4);

                // Concatenate and trim/pad to exactly 6 digits
                const combined = nextBaseId + tsFragment;
                const generatedId = combined.length > 6
                    ? combined.slice(-6)     // keep the most-recent (most unique) digits
                    : combined.padStart(6, '0');

                const generatedUID = await generateNextBookChapterUID();

                setForm(p => ({ ...p, submissionId: generatedId, uid: generatedUID }));
            } catch (err) {
                console.error('Failed to auto-generate submission ID:', err);
                const generatedUID = await generateNextBookChapterUID();
                // Fallback: 6 digits purely from timestamp
                setForm(p => ({ ...p, submissionId: Date.now().toString().slice(-6), uid: generatedUID }));
            }
        };

        autoGenerateId();
    }, [isOpen]);

    // Update bio author name when main author name changes
    useEffect(() => {
        const mainAuthorName = `${form.mainAuthor.firstName} ${form.mainAuthor.lastName}`.trim();
        if (mainAuthorName && biographies.length > 0 && biographies[0].authorName === '') {
            setBiographies(prev => prev.map((b, i) => i === 0 ? { ...b, authorName: mainAuthorName } : b));
        }
    }, [form.mainAuthor.firstName, form.mainAuthor.lastName]);

    // Sync editor names from editorBiographies to form.editors (Step 2)
    useEffect(() => {
        if (!isOpen) return;
        const currentNames = editorBiographies.map(b => b.editorName.trim()).filter(Boolean);

        setForm(prev => {
            const currentString = Array.isArray(prev.editors) ? prev.editors.join(', ') : '';
            const newString = currentNames.join(', ');

            if (currentString === newString) return prev;

            const updated: FormState = { ...prev, editors: currentNames };

            if (prev.primaryEditor && !currentNames.includes(prev.primaryEditor)) {
                updated.primaryEditor = '';
            }

            return updated;
        });
    }, [editorBiographies, isOpen]);

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

    const toggleCorrespondingAuthor = (type: 'main' | 'co', coTempId?: string) => {
        setForm(p => ({
            ...p,
            mainAuthor: { ...p.mainAuthor, isCorrespondingAuthor: type === 'main' },
            coAuthors: p.coAuthors.map(ca => ({
                ...ca,
                isCorrespondingAuthor: type === 'co' && ca.tempId === coTempId
            }))
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
        setFieldErrors(prev => {
            const next = { ...prev };
            delete next[`coAuthorPhone-${tempId}`];
            return next;
        });
    };

    const handlePhoneBlur = (phone: string | undefined, fieldKey: string) => {
        if (phone && !isValidPhoneNumber(phone)) {
            const errorMsg = 'Phone number must have a valid country code and at least 10 digits.';
            setFieldErrors(prev => ({ ...prev, [fieldKey]: errorMsg }));
        } else {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[fieldKey];
                return next;
            });
        }
    };

    const handleLinkBlur = (url: string | undefined, fieldKey: string) => {
        if (url && !isValidUrl(url)) {
            const errorMsg = 'Please enter a valid URL (e.g. https://example.com)';
            setFieldErrors(prev => ({ ...prev, [fieldKey]: errorMsg }));
        } else {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[fieldKey];
                return next;
            });
        }
    };

    const handleEmailBlur = (email: string | undefined, fieldKey: string) => {
        if (email && !isValidEmail(email)) {
            const errorMsg = 'Please enter a valid email address';
            setFieldErrors(prev => ({ ...prev, [fieldKey]: errorMsg }));
        } else {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[fieldKey];
                return next;
            });
        }
    };

    const validateTab = (tab: TabType): string => {
        switch (tab) {
            case 'author':
                if (!form.submissionId.trim()) return 'Submission ID is required.';
                if (isNaN(Number(form.submissionId))) return 'Submission ID must be a number.';
                // All author/co-author fields made optional by user request
                if (form.mainAuthor.phoneNumber && !isValidPhoneNumber(form.mainAuthor.phoneNumber)) return 'Main Author: Phone number must be at least 10 digits.';
                for (const ca of form.coAuthors) {
                    if (ca.phoneNumber && !isValidPhoneNumber(ca.phoneNumber)) {
                        return `Co-Author: ${ca.firstName} ${ca.lastName}'s phone number must be at least 10 digits.`;
                    }
                }
                break;
            case 'editorBio':
                if (form.editors.filter(e => e.trim()).length === 0) return 'At least one Editor is required.';
                // Validate editor bios if needed
                if (editorBiographies.some(b => !b.editorName.trim() || !b.biography.trim())) {
                    return 'All editor biographies must have a name and biography text.';
                }
                break;
            case 'metadata':
                if (!form.title.trim()) return 'Book title is required.';
                if (!form.category.trim()) return 'Category is required.';
                if (!form.uid || !form.uid.trim()) return 'UID is required.';
                if (!form.keywords || form.keywords.length === 0 || form.keywords.every(k => !k.trim())) return 'Keywords are required.';
                if (!form.description.trim()) return 'Short description / abstract is required.';
                if (!form.isbn.trim()) return 'ISBN is required.';
                if (!form.publishedDate.trim()) return 'Published year is required.';
                if (!form.pages || form.pages <= 0) return 'Number of pages must be a positive integer.';
                if (!form.indexedIn.trim()) return 'Indexed In is required.';
                if (!form.releaseDate.trim()) return 'Release Date is required.';
                if (!form.copyright.trim()) return 'Copyright is required.';
                if (form.googleLink && !isValidUrl(form.googleLink)) return 'Google Books Link is invalid.';
                if (form.flipkartLink && !isValidUrl(form.flipkartLink)) return 'Flipkart Link is invalid.';
                if (form.amazonLink && !isValidUrl(form.amazonLink)) return 'Amazon Link is invalid.';
                if (form.priceSoftCopy === undefined || form.priceSoftCopy <= 0) return 'Soft Copy Price is required and must be positive.';
                if (form.priceHardCopy === undefined || form.priceHardCopy <= 0) return 'Hard Copy Price is required and must be positive.';
                if (form.priceCombined === undefined || form.priceCombined <= 0) return 'Soft + Hard Price is required and must be positive.';
                break;
            case 'content':
                if (form.synopses.some(s => !s.trim())) return 'All synopsis paragraphs must have content.';
                if (!form.scopeIntro.trim()) return 'Scope introduction paragraph is required.';
                // scopeItems made optional by user request
                if (!archiveIntro.trim()) return 'Archive introduction is required.';
                // archiveItems made optional by user request
                break;
            case 'toc':
                if (tocChapters.length === 0) return 'At least one chapter must be added to the Table of Contents.';
                if (tocChapters.some((c) => !c.title.trim() || !c.chapterNumber?.trim() || !c.authors?.trim() || !c.pdfKey)) {
                    return 'All chapters must have a title, number, author(s), and an uploaded PDF.';
                }
                // Frontmatter PDFs are now optional
                break;
            case 'bio':
                if (biographies.some(b => !b.authorName.trim() || !b.affiliation.trim() || !b.biography.trim())) {
                    return 'All author biographies must have a name, affiliation, and biography text.';
                }
                if (biographies.some(b => b.email && !isValidEmail(b.email))) {
                    return 'Please enter a valid email address for all biographies that have an email provided.';
                }
                break;
            case 'review':
                if (!form.coverImage) return 'Book cover image is required (upload and crop in Step 6/review).';
                break;
        }
        return '';
    };

    const handleNextTab = async () => {
        const order: TabType[] = ['author', 'editorBio', 'metadata', 'content', 'bio', 'toc', 'review'];
        const err = validateTab(activeTab);
        if (err) {
            setErrors(err);
            setAlertConfig({
                isOpen: true,
                type: 'warning',
                title: 'Missing Information',
                message: err
            });
            return;
        }
        setErrors('');

        // ISBN Availability Check for Metadata Tab
        if (activeTab === 'metadata' && form.isbn.trim()) {
            setLoading(true);
            try {
                const existing = await checkBookChapterIsbnAvailability([form.isbn.trim()]);
                if (existing && existing.length > 0) {
                    setAlertConfig({
                        isOpen: true,
                        type: 'error',
                        title: 'ISBN Duplicate Found',
                        message: `The ISBN "${form.isbn}" is already associated with an existing publication. Please enter a unique ISBN for this book.`
                    });
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error('ISBN check failed:', err);
            } finally {
                setLoading(false);
            }
        }

        const idx = order.indexOf(activeTab);
        if (idx < order.length - 1) {
            const next = order[idx + 1];
            setTouchedTabs((prev) => new Set(prev).add(next));
            setActiveTab(next);
        }
    };

    const handlePrevTab = () => {
        const order: TabType[] = ['author', 'editorBio', 'metadata', 'content', 'bio', 'toc', 'review'];
        setErrors('');
        setAlertConfig(p => ({ ...p, isOpen: false }));
        const idx = order.indexOf(activeTab);
        if (idx > 0) setActiveTab(order[idx - 1]);
    };

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
        if (!form.submissionId) {
            toast.error('Please enter a Submission ID first.');
            return;
        }
        setPdfUploading(p => ({ ...p, [i]: 0 }));
        try {
            const result = await uploadDirectTempPdf(
                file,
                (pct) => setPdfUploading(prev => ({ ...prev, [i]: pct })),
            );
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
        if (!form.submissionId) {
            toast.error('Please enter a Submission ID first.');
            return;
        }
        setPdfUploading(p => ({ ...p, [type]: 0 }));
        try {
            const result = await uploadDirectTempPdf(
                file,
                (pct) => setPdfUploading(prev => ({ ...prev, [type]: pct })),
            );
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

    const addBio = () => setBiographies((p) => [...p, { authorName: '', affiliation: '', email: '', biography: '' }]);
    const removeBio = (i: number) => {
        if (biographies.length > 1) setBiographies((p) => p.filter((_, idx) => idx !== i));
    };
    const updateBio = (i: number, field: keyof AuthorBiographyPayload, val: string) =>
        setBiographies((p) => p.map((b, idx) => (idx === i ? { ...b, [field]: val } : b)));

    const handleAuthorSearch = async (i: number) => {
        const bio = biographies[i];
        if (!bio.authorName.trim()) return;

        try {
            const results = await findAuthors({
                name: bio.authorName,
                affiliation: bio.affiliation || undefined,
                email: bio.email || undefined
            });

            if (results && results.length > 0) {
                let match = results.find(a =>
                    a.name.toLowerCase() === bio.authorName.toLowerCase() &&
                    ((bio.affiliation && a.affiliation?.toLowerCase() === bio.affiliation.toLowerCase()) ||
                        (bio.email && a.email?.toLowerCase() === bio.email.toLowerCase()))
                );

                if (!match && results.length === 1 && !bio.affiliation && !bio.email && !bio.biography) {
                    match = results[0];
                }

                if (match) {
                    setBiographies(prev => prev.map((b, idx) => idx === i ? {
                        ...b,
                        authorName: match!.name,
                        affiliation: match!.affiliation || b.affiliation,
                        email: match!.email || b.email,
                        biography: match!.biography || b.biography
                    } : b));
                }
            }
        } catch (err) {
            console.error('Error searching authors:', err);
        }
    };

    const addEditorBio = () => setEditorBiographies((p) => [...p, { editorName: '', affiliation: '', email: '', biography: '' }]);
    const removeEditorBio = (i: number) => {
        setEditorBiographies((p) => p.filter((_, idx) => idx !== i));
    };
    const updateEditorBio = (i: number, field: keyof EditorBiographyPayload, val: string) =>
        setEditorBiographies((p) => p.map((b, idx) => (idx === i ? { ...b, [field]: val } : b)));

    const handleEditorSearch = async (i: number) => {
        const bio = editorBiographies[i];
        if (!bio.editorName.trim()) return;
        try {
            const results = await findAuthors({
                name: bio.editorName,
                affiliation: bio.affiliation || undefined,
                email: bio.email || undefined
            });
            if (results && results.length > 0) {
                let match = results.find(a =>
                    a.name.toLowerCase() === bio.editorName.toLowerCase() &&
                    ((bio.affiliation && a.affiliation?.toLowerCase() === bio.affiliation.toLowerCase()) ||
                        (bio.email && a.email?.toLowerCase() === bio.email.toLowerCase()))
                );
                if (!match && results.length === 1 && !bio.affiliation && !bio.email && !bio.biography) {
                    match = results[0];
                }
                if (match) {
                    setEditorBiographies(prev => prev.map((b, idx) => idx === i ? {
                        ...b,
                        editorName: match!.name,
                        affiliation: match!.affiliation || b.affiliation,
                        email: match!.email || b.email,
                        biography: match!.biography || b.biography
                    } : b));
                }
            }
        } catch (err) {
            console.error('Error searching editors:', err);
        }
    };

    // Scope / Archives 
    const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
        setter((p) => [...p, '']);
    const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, i: number) =>
        setter((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));
    const updateItem = (
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        i: number,
        v: string
    ) => setter((p) => p.map((x, idx) => (idx === i ? v : x)));

    const addSynopsis = () => {
        if (form.synopses.length < 4) {
            setForm(p => ({ ...p, synopses: [...p.synopses, ''] }));
        }
    };
    const removeSynopsis = (i: number) => {
        if (form.synopses.length > 1) {
            setForm(p => ({ ...p, synopses: p.synopses.filter((_, idx) => idx !== i) }));
        }
    };
    const updateSynopsis = (i: number, val: string) => {
        setForm(p => ({
            ...p,
            synopses: p.synopses.map((s, idx) => idx === i ? val : s)
        }));
    };

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
                ctx.drawImage(
                    imageElement,
                    croppedAreaPixels.x, croppedAreaPixels.y,
                    croppedAreaPixels.width, croppedAreaPixels.height,
                    0, 0, croppedAreaPixels.width, croppedAreaPixels.height
                );
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

    const handleSkipCrop = () => {
        if (originalImage) {
            setForm((p) => ({ ...p, coverImage: originalImage }));
            setShowCropper(false);
        }
    };

    // Submit 
    const handleSubmit = async () => {
        const order: TabType[] = ['author', 'editorBio', 'metadata', 'content', 'bio', 'toc', 'review'];
        for (const tab of order) {
            const err = validateTab(tab);
            if (err) {
                setActiveTab(tab);
                setErrors(err);
                setAlertConfig({
                    isOpen: true,
                    type: 'warning',
                    title: 'Missing Information',
                    message: err
                });
                return;
            }
        }

        setLoading(true);
        try {
            const scope: Record<string, string> = { paragraph_1: form.scopeIntro };
            scopeItems.forEach((v, i) => {
                if (v.trim()) scope[`list_${i + 1}`] = v;
            });

            const archives: Record<string, string> = { paragraph_1: archiveIntro };
            archiveItems.forEach((v, i) => {
                if (v.trim()) archives[`list_${i + 1}`] = v;
            });

            const payload = {
                submissionId: form.submissionId,
                title: form.title,
                editors: form.editors.map(e => e.trim()).filter(Boolean),
                primaryEditor: form.primaryEditor || undefined,
                author: `${form.mainAuthor.firstName} ${form.mainAuthor.lastName}`.trim(),
                coAuthors: form.coAuthors.map(ca => `${ca.firstName} ${ca.lastName}`.trim()).join(', ') || undefined,
                coverImage: form.coverImage || undefined,
                category: form.category,
                description: form.description,
                isbn: form.isbn,
                uid: form.uid,
                publishedDate: form.publishedDate,
                pages: Number(form.pages),
                keywords: form.keywords.map(k => k.trim()).filter(Boolean),
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
                authorBiographies: biographies.filter(
                    (b) => b.authorName.trim() || b.biography.trim()
                ).map(b => ({
                    ...b,
                    affiliation: b.affiliation.trim()
                        ? (b.affiliation.trim().startsWith('(') && b.affiliation.trim().endsWith(')')
                            ? b.affiliation.trim()
                            : `(${b.affiliation.trim()})`)
                        : b.affiliation
                })),
                editorBiographies: editorBiographies.filter(
                    (b) => b.editorName.trim() || b.biography.trim()
                ).map(b => ({
                    ...b,
                    affiliation: b.affiliation?.trim()
                        ? (b.affiliation.trim().startsWith('(') && b.affiliation.trim().endsWith(')')
                            ? b.affiliation.trim()
                            : `(${b.affiliation.trim()})`)
                        : b.affiliation
                })),
                archives,
                frontmatterPdfs: extraPdfTypes.reduce((acc, type) => {
                    const existing = form.frontmatterPdfs[type];
                    acc[type] = {
                        pdfKey: existing?.pdfKey || null,
                        mimeType: existing?.mimeType || null,
                        name: existing?.name || null
                    };
                    return acc;
                }, {} as Record<string, any>),
                mainAuthor: form.mainAuthor,
                coAuthorsData: form.coAuthors.map(({ tempId: _, ...rest }) => rest),
            };

            // Send payload to the backend
            await publishDirectBookChapter(payload);
            setLoading(false);

            setAlertConfig({
                isOpen: true,
                type: 'success',
                title: 'Publication Successful',
                message: 'The book chapter has been successfully published.',
                confirmText: 'Done',
                onConfirm: () => {
                    setAlertConfig(p => ({ ...p, isOpen: false }));
                    deleteDraft();
                    onSuccess();
                    onClose();
                }
            });
        } catch (err: any) {
            const msg = err?.message || 'Failed to publish. Please try again.';
            setErrors(msg);
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Publishing Error',
                message: msg,
                confirmText: 'Dismiss'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="publish-chapter-form-wrapper">
                <div className="pcw-form-container">
                    {/* Header */}
                    <div className="pcw-header">
                        <div>
                            <h2>Individual Publish (Manual Entry)</h2>
                            <div className="pcw-header-sub">Manually enter all details for a new publication.</div>
                        </div>
                        <button onClick={onClose} className="pcw-close-btn">&times;</button>
                    </div>

                    <div className="pcw-body" ref={pcwBodyRef} style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                        {showDraftSelection ? (
                            <div className="draft-selection-view" style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                                <h3 style={{ marginBottom: '10px', color: '#1e3a8a', fontSize: '20px' }}>Unfinished Drafts Found</h3>
                                <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '15px' }}>We found some previous drafts for individual publishing. Would you like to resume one or start fresh?</p>

                                <div className="drafts-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
                                    {recentDrafts.map(draft => (
                                        <div key={draft.id} className="draft-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', transition: 'all 0.2s ease' }}>
                                            <div style={{ textAlign: 'left', flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{draft.draftName || draft.payload?.form?.title || 'Untitled Book'}</div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Last updated: {new Date(draft.updatedAt).toLocaleString()}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button
                                                    onClick={(e) => handleDeleteDraft(e, draft.id)}
                                                    className="pcw-delete-draft-btn"
                                                    title="Delete Draft"
                                                    style={{
                                                        background: 'none',
                                                        border: '1px solid #fee2e2',
                                                        color: '#ef4444',
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '18px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                                <button
                                                    onClick={() => restoreDraft(draft.id)}
                                                    className="pcw-btn"
                                                    style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                                        <button
                                            onClick={() => setShowDraftSelection(false)}
                                            className="pcw-btn"
                                            style={{ padding: '10px 24px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                                        >
                                            Start Fresh Entry
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* Tabs */}
                                <div className="form-tabs">
                                    {TABS.map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                            onClick={() => {
                                                if (touchedTabs.has(tab.id) || activeTab === 'review') {
                                                    setErrors('');
                                                    setAlertConfig(p => ({ ...p, isOpen: false }));
                                                    setActiveTab(tab.id);
                                                }
                                            }}
                                        >
                                            <span>{tab.num}</span>
                                            <span>{tab.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Body */}
                                <div className="pcw-body" ref={pcwBodyRef}>
                                    {errors && <div className="pcw-error-banner">⚠️ {errors}</div>}

                                    {activeTab === 'author' && (
                                        <div className="tab-pane active slide-in-bottom">
                                            <div style={{ display: 'none' }}>
                                                <p className="pcw-step-title">Linking & Author Details</p>
                                                <p className="pcw-step-desc">Enter the Submission ID and Author details for this chapter.</p>

                                                <div className="pcw-section-title">
                                                    <span>Submission Linking <span className="req">*</span></span>
                                                </div>
                                                <div className="pcw-field-grid">
                                                    <div className="pcw-field span-full">
                                                        <label className="pcw-label">Submission ID <span className="req">*</span></label>
                                                        <input className="pcw-input" name="submissionId" type="text" value={form.submissionId} onChange={handleFormChange} placeholder="Enter the approved Submission ID (e.g. 123)" />
                                                        <small style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic' }}>Required to link this publication to a record and upload files.</small>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="pcw-step-title">Author Details</p>
                                            <p className="pcw-step-desc">Enter the Author details for this chapter.</p>

                                            <div className="pcw-section-title">
                                                <span>Main Author</span>
                                            </div>
                                            <div className="pcw-field-grid">
                                                <div className="pcw-field">
                                                    <label className="pcw-label">First Name</label>
                                                    <input className="pcw-input" value={form.mainAuthor.firstName} onChange={(e) => handleMainAuthorChange('firstName', e.target.value)} placeholder="e.g. John" />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Last Name</label>
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
                                                    <label className="pcw-label">Email Address</label>
                                                    <input className="pcw-input" type="email" value={form.mainAuthor.email}
                                                        onChange={(e) => handleMainAuthorChange('email', e.target.value)}
                                                        onBlur={() => handleEmailBlur(form.mainAuthor.email, 'mainAuthorEmail')}
                                                        placeholder="e.g. john.doe@example.com" />
                                                    {fieldErrors.mainAuthorEmail && <small className="pcw-field-error" style={{ color: 'red', fontSize: '10px' }}>{fieldErrors.mainAuthorEmail}</small>}
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Phone Number (Optional)</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <PhoneNumberInput
                                                                value={form.mainAuthor.phoneNumber || ''}
                                                                onChange={(val) => handleMainAuthorChange('phoneNumber', val)}
                                                                onBlur={() => handlePhoneBlur(form.mainAuthor.phoneNumber, 'mainAuthorPhone')}
                                                                placeholder="Enter phone number"
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', marginTop: '4px' }}>
                                                            <input
                                                                type="checkbox"
                                                                id="main-is-corresponding"
                                                                checked={form.mainAuthor.isCorrespondingAuthor || false}
                                                                onChange={() => toggleCorrespondingAuthor('main')}
                                                                style={{ cursor: 'pointer', width: 'auto' }}
                                                            />
                                                            <label htmlFor="main-is-corresponding" style={{ fontSize: '11px', fontWeight: 600, color: '#1e5292', cursor: 'pointer', textTransform: 'none' }}>
                                                                Corresponding Author
                                                            </label>
                                                        </div>
                                                    </div>
                                                    {fieldErrors.mainAuthorPhone && <small className="pcw-field-error" style={{ color: 'red', fontSize: '10px' }}>{fieldErrors.mainAuthorPhone}</small>}
                                                </div>
                                            </div>

                                            {form.coAuthors.map((ca, i) => (
                                                <div key={ca.tempId} className="pcw-toc-row" style={{ marginTop: '10px', marginBottom: '10px', borderLeft: '3px solid #6b7280' }}>
                                                    <div className="pcw-toc-row-header">
                                                        <h4 style={{ margin: 0, fontSize: '13px' }}>Co-Author {i + 1}</h4>
                                                        <button type="button" className="pcw-remove-btn" onClick={() => removeCoAuthor(ca.tempId)}>Remove</button>
                                                    </div>
                                                    <div className="pcw-field-grid">
                                                        <div className="pcw-field">
                                                            <label className="pcw-label">First Name</label>
                                                            <input className="pcw-input" value={ca.firstName} onChange={(e) => handleCoAuthorChange(ca.tempId, 'firstName', e.target.value)} placeholder="e.g. Jane" />
                                                        </div>
                                                        <div className="pcw-field">
                                                            <label className="pcw-label">Last Name</label>
                                                            <input className="pcw-input" value={ca.lastName} onChange={(e) => handleCoAuthorChange(ca.tempId, 'lastName', e.target.value)} placeholder="e.g. Doe" />
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
                                                            <input className="pcw-input" value={ca.departmentName} onChange={(e) => handleCoAuthorChange(ca.tempId, 'departmentName', e.target.value)} placeholder="e.g. Computer Science" />
                                                        </div>
                                                        <div className="pcw-field span-full">
                                                            <label className="pcw-label">Institute / University Name</label>
                                                            <input className="pcw-input" value={ca.instituteName} onChange={(e) => handleCoAuthorChange(ca.tempId, 'instituteName', e.target.value)} placeholder="e.g. Stanford University" />
                                                        </div>
                                                        <div className="pcw-field">
                                                            <label className="pcw-label">City</label>
                                                            <input className="pcw-input" value={ca.city} onChange={(e) => handleCoAuthorChange(ca.tempId, 'city', e.target.value)} placeholder="e.g. Palo Alto" />
                                                        </div>
                                                        <div className="pcw-field">
                                                            <label className="pcw-label">State</label>
                                                            <input className="pcw-input" value={ca.state} onChange={(e) => handleCoAuthorChange(ca.tempId, 'state', e.target.value)} placeholder="e.g. California" />
                                                        </div>
                                                        <div className="pcw-field">
                                                            <label className="pcw-label">Country</label>
                                                            <input className="pcw-input" value={ca.country} onChange={(e) => handleCoAuthorChange(ca.tempId, 'country', e.target.value)} placeholder="e.g. USA" />
                                                        </div>
                                                        <div className="pcw-field">
                                                            <label className="pcw-label">Email Address</label>
                                                            <input className="pcw-input" type="email" value={ca.email}
                                                                onChange={(e) => handleCoAuthorChange(ca.tempId, 'email', e.target.value)}
                                                                onBlur={() => handleEmailBlur(ca.email, `coAuthorEmail-${ca.tempId}`)}
                                                                placeholder="e.g. jane.doe@example.com" />
                                                            {fieldErrors[`coAuthorEmail-${ca.tempId}`] && <small className="pcw-field-error" style={{ color: 'red', fontSize: '10px' }}>{fieldErrors[`coAuthorEmail-${ca.tempId}`]}</small>}
                                                        </div>
                                                        <div className="pcw-field">
                                                            <label className="pcw-label">Phone Number (Optional)</label>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <PhoneNumberInput
                                                                        value={ca.phoneNumber || ''}
                                                                        onChange={(val) => handleCoAuthorChange(ca.tempId, 'phoneNumber', val)}
                                                                        onBlur={() => handlePhoneBlur(ca.phoneNumber, `coAuthorPhone-${ca.tempId}`)}
                                                                        placeholder="Enter phone number"
                                                                    />
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', marginTop: '4px' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`coauthor-is-corresponding-${ca.tempId}`}
                                                                        checked={ca.isCorrespondingAuthor || false}
                                                                        onChange={() => toggleCorrespondingAuthor('co', ca.tempId)}
                                                                        style={{ cursor: 'pointer', width: 'auto' }}
                                                                    />
                                                                    <label htmlFor={`coauthor-is-corresponding-${ca.tempId}`} style={{ fontSize: '11px', fontWeight: 600, color: '#1e5292', cursor: 'pointer', textTransform: 'none' }}>
                                                                        Corresponding Author
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            {fieldErrors[`coAuthorPhone-${ca.tempId}`] && <small className="pcw-field-error" style={{ color: 'red', fontSize: '10px' }}>{fieldErrors[`coAuthorPhone-${ca.tempId}`]}</small>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="pcw-section-title">
                                                <span>Co-Authors</span>
                                                <button type="button" className="pcw-add-btn" onClick={addCoAuthor}>+ Add Co-Author</button>
                                            </div>

                                        </div>
                                    )}

                                    {activeTab === 'editorBio' && (
                                        <div className="tab-pane active slide-in-bottom">
                                            <p className="pcw-step-title">Editor Biography</p>
                                            <p className="pcw-step-desc">List the editors and provide their professional biographies.</p>

                                            <div className="pcw-field span-full" style={{ marginBottom: '24px' }}>
                                                <label className="pcw-label">Editors <span className="req">*</span></label>
                                                <input
                                                    className="pcw-input"
                                                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                                    value={Array.isArray(form.editors) ? form.editors.join(', ') : ''}
                                                    readOnly
                                                    placeholder="Names will appear here as you fill biographies below..."
                                                />
                                                {form.editors.filter(e => e.trim()).length > 0 && (
                                                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#1e5292', textTransform: 'uppercase' }}>Select Primary:</span>
                                                        {form.editors.filter(e => e.trim()).map((ed, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                className={`pcw-editor-chip ${form.primaryEditor === ed ? 'active' : ''}`}
                                                                onClick={() => setForm(p => ({ ...p, primaryEditor: p.primaryEditor === ed ? '' : ed }))}
                                                            >
                                                                {ed} {form.primaryEditor === ed && '★'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pcw-section">
                                                <p className="pcw-section-title">Editor Biographies</p>
                                                {editorBiographies.map((bio, i) => (
                                                    <div className="pcw-bio-card" key={i}>
                                                        <div className="pcw-bio-card-header">
                                                            <span className="pcw-bio-label">Editor {i + 1}</span>
                                                            <button type="button" className="pcw-remove-btn" onClick={() => removeEditorBio(i)}>Remove</button>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                            <div className="pcw-field">
                                                                <label className="pcw-label">Full Name</label>
                                                                <input className="pcw-input" value={bio.editorName} onChange={(e) => updateEditorBio(i, 'editorName', e.target.value)} onBlur={() => handleEditorSearch(i)} placeholder="Dr. Jane Editor" />
                                                            </div>
                                                            <div className="pcw-field">
                                                                <label className="pcw-label">Affiliation</label>
                                                                <input className="pcw-input" value={bio.affiliation} onChange={(e) => updateEditorBio(i, 'affiliation', e.target.value)} onBlur={() => handleEditorSearch(i)} placeholder="University of Ed" />
                                                            </div>
                                                            <div className="pcw-field">
                                                                <label className="pcw-label">Email</label>
                                                                <input className="pcw-input" value={bio.email} onChange={(e) => updateEditorBio(i, 'email', e.target.value)} onBlur={() => handleEditorSearch(i)} placeholder="jane@editor.com" />
                                                            </div>
                                                        </div>
                                                        <div className="pcw-field">
                                                            <label className="pcw-label">Biography</label>
                                                            <textarea className="pcw-textarea" rows={3} value={bio.biography} onChange={(e) => updateEditorBio(i, 'biography', e.target.value)} placeholder="Academic bio..." />
                                                        </div>
                                                    </div>
                                                ))}
                                                <button type="button" className="pcw-add-btn" onClick={addEditorBio}>+ Add Editor Bio</button>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'metadata' && (
                                        <div className="tab-pane active slide-in-bottom">
                                            <p className="pcw-step-title">Book Metadata</p>
                                            <p className="pcw-step-desc">Publication details for the book.</p>
                                            <div className="pcw-field-grid">
                                                <div className="pcw-field span-full">
                                                    <label className="pcw-label">Book Title <span className="req">*</span></label>
                                                    <input className="pcw-input" name="title" value={form.title} onChange={handleFormChange} placeholder="e.g. Advanced AI Research 2024" />
                                                </div>
                                                <div className="pcw-field span-full">
                                                    <label className="pcw-label">Editors <span className="req">*</span></label>
                                                    <input
                                                        className="pcw-input"
                                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                                        value={Array.isArray(form.editors) ? form.editors.join(', ') : ''}
                                                        readOnly
                                                        placeholder="Names will appear here as you fill biographies in Step 2..."
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
                                                    <label className="pcw-label">UID <span className="req">*</span></label>
                                                    <input className="pcw-input" name="uid" value={form.uid || ''} onChange={handleFormChange} placeholder="e.g. A01" />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">ISBN <span className="req">*</span></label>
                                                    <input className="pcw-input" name="isbn" value={form.isbn} onChange={handleFormChange} placeholder="978-x-xxxxx-xxx-x" />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">DOI</label>
                                                    <input className="pcw-input" name="doi" value={form.doi} onChange={handleFormChange} placeholder="e.g. 10.xxxx/xxxxx" />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Pages <span className="req">*</span></label>
                                                    <input className="pcw-input" name="pages" type="number" min={1} value={form.pages || ''} onChange={handleFormChange} placeholder="e.g. 350" />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Published Year <span className="req">*</span></label>
                                                    <input className="pcw-input" name="publishedDate" value={form.publishedDate} onChange={handleFormChange} placeholder="e.g. 2024" />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Keywords (comma separated)</label>
                                                    <input
                                                        className="pcw-input"
                                                        value={Array.isArray(form.keywords) ? form.keywords.join(', ') : ''}
                                                        onChange={(e) => setForm(p => ({ ...p, keywords: e.target.value.split(',').map(s => s.trimStart()) }))}
                                                        placeholder="e.g. AI, Machine Learning, Robotics"
                                                    />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Release Date <span className="req">*</span></label>
                                                    <input type="date" className="pcw-input" name="releaseDate" value={form.releaseDate} onChange={handleFormChange} />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Indexed In <span className="req">*</span></label>
                                                    <input className="pcw-input" name="indexedIn" value={form.indexedIn} onChange={handleFormChange} placeholder="e.g. Scopus, Google Scholar" />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Copyright <span className="req">*</span></label>
                                                    <input className="pcw-input" name="copyright" value={form.copyright} onChange={handleFormChange} placeholder="e.g. © 2024 BR Publications" />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Pricing Details <span className="req">*</span></label>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                        <input className="pcw-input" type="number" name="priceSoftCopy" value={form.priceSoftCopy || ''} onChange={handleFormChange} placeholder="Soft Price *" />
                                                        <input className="pcw-input" type="number" name="priceHardCopy" value={form.priceHardCopy || ''} onChange={handleFormChange} placeholder="Hard Price *" />
                                                        <input className="pcw-input" type="number" name="priceCombined" value={form.priceCombined || ''} onChange={handleFormChange} placeholder="Soft+Hard Price *" />
                                                    </div>
                                                </div>
                                                <div className="pcw-field span-full" style={{ marginTop: 12 }}>
                                                    <label className="pcw-label">External Selling Links (Optional)</label>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <input className="pcw-input" name="googleLink" value={form.googleLink || ''}
                                                                onChange={handleFormChange}
                                                                onBlur={(e) => handleLinkBlur(e.target.value, 'googleLink')}
                                                                placeholder="Google Books URL" />
                                                            {fieldErrors.googleLink && <small className="pcw-field-error" style={{ color: 'red', fontSize: '10px' }}>{fieldErrors.googleLink}</small>}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <input className="pcw-input" name="flipkartLink" value={form.flipkartLink || ''}
                                                                onChange={handleFormChange}
                                                                onBlur={(e) => handleLinkBlur(e.target.value, 'flipkartLink')}
                                                                placeholder="Flipkart URL" />
                                                            {fieldErrors.flipkartLink && <small className="pcw-field-error" style={{ color: 'red', fontSize: '10px' }}>{fieldErrors.flipkartLink}</small>}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <input className="pcw-input" name="amazonLink" value={form.amazonLink || ''}
                                                                onChange={handleFormChange}
                                                                onBlur={(e) => handleLinkBlur(e.target.value, 'amazonLink')}
                                                                placeholder="Amazon URL" />
                                                            {fieldErrors.amazonLink && <small className="pcw-field-error" style={{ color: 'red', fontSize: '10px' }}>{fieldErrors.amazonLink}</small>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pcw-field" style={{ marginTop: 12 }}>
                                                <label className="pcw-label">Short Description / Abstract <span className="req">*</span></label>
                                                <textarea className="pcw-textarea" name="description" rows={3} value={form.description} onChange={handleFormChange} placeholder="Provide a summary..." />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'content' && (
                                        <div className="tab-pane active slide-in-bottom">
                                            <div className="pcw-tab-section">
                                                <p className="pcw-step-title">Synopsis</p>
                                                <p className="pcw-step-desc">Provide detailed synopsis paragraphs.</p>
                                                {form.synopses.map((synopsis, i) => (
                                                    <div className="pcw-field" key={i} style={{ marginBottom: 12 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <label className="pcw-label">Paragraph {i + 1} <span className="req">*</span></label>
                                                            {form.synopses.length > 1 && (
                                                                <button type="button" className="pcw-remove-btn" onClick={() => removeSynopsis(i)}>Remove</button>
                                                            )}
                                                        </div>
                                                        <textarea className="pcw-textarea" rows={4} value={synopsis}
                                                            onChange={(e) => updateSynopsis(i, e.target.value)}
                                                            placeholder={`Synopsis paragraph ${i + 1}...`} />
                                                    </div>
                                                ))}
                                                {form.synopses.length < 4 && (
                                                    <button type="button" className="pcw-add-btn" onClick={addSynopsis}>+ Add Paragraph</button>
                                                )}
                                            </div>

                                            <div className="pcw-section">
                                                <p className="pcw-step-title">Scope</p>
                                                <div className="pcw-field" style={{ marginBottom: 12 }}>
                                                    <label className="pcw-label">Introduction Paragraph <span className="req">*</span></label>
                                                    <textarea className="pcw-textarea" rows={3} value={form.scopeIntro}
                                                        onChange={(e) => setForm((p) => ({ ...p, scopeIntro: e.target.value }))}
                                                        placeholder="Introduce the scope..." />
                                                </div>
                                                <p className="pcw-section-title">Scope Topics</p>
                                                {scopeItems.map((item, i) => (
                                                    <div className="pcw-list-row" key={i}>
                                                        <span className="pcw-list-bullet">•</span>
                                                        <input className="pcw-input" value={item}
                                                            onChange={(e) => updateItem(setScopeItems, i, e.target.value)}
                                                            placeholder={`Scope topic ${i + 1}`} />
                                                        {scopeItems.length > 1 && (
                                                            <button type="button" className="pcw-remove-btn" onClick={() => removeItem(setScopeItems, i)}>Remove</button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" className="pcw-add-btn" onClick={() => addItem(setScopeItems)}>+ Add Topic</button>
                                            </div>

                                            <div className="pcw-section">
                                                <p className="pcw-step-title">Archives</p>
                                                <div className="pcw-field" style={{ marginBottom: 12 }}>
                                                    <label className="pcw-label">Introduction <span className="req">*</span></label>
                                                    <textarea className="pcw-textarea" rows={3} value={archiveIntro}
                                                        onChange={(e) => setArchiveIntro(e.target.value)}
                                                        placeholder="Introduce the archives..." />
                                                </div>
                                                <p className="pcw-section-title">Archive Repositories</p>
                                                {archiveItems.map((item, i) => (
                                                    <div className="pcw-list-row" key={i}>
                                                        <span className="pcw-list-bullet">▪</span>
                                                        <input className="pcw-input" value={item}
                                                            onChange={(e) => updateItem(setArchiveItems, i, e.target.value)}
                                                            placeholder={`Archive repository ${i + 1}`} />
                                                        {archiveItems.length > 1 && (
                                                            <button type="button" className="pcw-remove-btn" onClick={() => removeItem(setArchiveItems, i)}>Remove</button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" className="pcw-add-btn" onClick={() => addItem(setArchiveItems)}>+ Add Repository</button>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'bio' && (
                                        <div className="tab-pane active slide-in-bottom">
                                            <div className="pcw-tab-section">
                                                <p className="pcw-step-title">Author Biographies</p>
                                                <p className="pcw-step-desc">Enter biographies for the authors of this chapter.</p>
                                                <div className="pcw-section">
                                                    {biographies.map((bio, i) => (
                                                        <div className="pcw-bio-card" key={i}>
                                                            <div className="pcw-bio-card-header">
                                                                <span className="pcw-bio-label">Author {i + 1}</span>
                                                                <button type="button" className="pcw-remove-btn" onClick={() => removeBio(i)}>Remove</button>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: 4 }}>
                                                                <input className="pcw-input" value={bio.authorName}
                                                                    onChange={(e) => updateBio(i, 'authorName', e.target.value)}
                                                                    onBlur={() => handleAuthorSearch(i)}
                                                                    placeholder="Full Name *" />
                                                                <input className="pcw-input" value={bio.affiliation || ''}
                                                                    onChange={(e) => updateBio(i, 'affiliation', e.target.value)}
                                                                    onBlur={() => handleAuthorSearch(i)}
                                                                    placeholder="Affiliation *" />
                                                                <input className="pcw-input" type="email" value={bio.email || ''}
                                                                    onChange={(e) => updateBio(i, 'email', e.target.value)}
                                                                    onBlur={() => {
                                                                        handleAuthorSearch(i);
                                                                        handleEmailBlur(bio.email, `bioEmail-${i}`);
                                                                    }}
                                                                    placeholder="Email ID (Optional)" />
                                                                {fieldErrors[`bioEmail-${i}`] && <small className="pcw-field-error" style={{ color: 'red', fontSize: '10px' }}>{fieldErrors[`bioEmail-${i}`]}</small>}
                                                            </div>
                                                            <textarea className="pcw-textarea" rows={3} value={bio.biography}
                                                                onChange={(e) => updateBio(i, 'biography', e.target.value)}
                                                                onBlur={() => handleAuthorSearch(i)}
                                                                placeholder="Short Bio *" />
                                                        </div>
                                                    ))}
                                                    <button type="button" className="pcw-add-btn" onClick={addBio}>+ Add Bio</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'toc' && (
                                        <div className="tab-pane active slide-in-bottom">
                                            <div className="pcw-tab-section">
                                                <p className="pcw-step-title">Table of Contents</p>
                                                <div className="pcw-toc-list">
                                                    {tocChapters.map((ch, i) => (
                                                        <div className="pcw-toc-row" key={i}>
                                                            <div className="pcw-toc-row-header">
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <div className="pcw-toc-num">{ch.chapterNumber || String(i + 1).padStart(2, '0')}</div>
                                                                    <strong style={{ fontSize: '13px' }}>Chapter {i + 1} <span className="req">*</span></strong>
                                                                </div>
                                                                <button type="button" className="pcw-remove-btn" onClick={() => removeTocChapter(i)}>Remove</button>
                                                            </div>
                                                            <div className="pcw-toc-main">
                                                                <input className="pcw-input" value={ch.title} onChange={(e) => updateTocField(i, 'title', e.target.value)} placeholder="Chapter title *" />
                                                                <AuthorMultiSelect
                                                                    authorOptions={biographies.map(b => b.authorName)}
                                                                    selectedNames={ch.authors || ''}
                                                                    onChange={(val) => updateTocField(i, 'authors', val)}
                                                                    placeholder="Select Author(s) *"
                                                                />
                                                                <input type="file" accept="application/pdf" className="pcw-hidden-input" ref={(el) => { pdfInputRefs.current[i] = el; }}
                                                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(i, f); }} />
                                                                <div className="pcw-toc-flex-row">
                                                                    <input className="pcw-input" value={ch.pagesFrom || ''} onChange={(e) => updateTocField(i, 'pagesFrom', e.target.value)} placeholder="From" />
                                                                    <input className="pcw-input" value={ch.pagesTo || ''} onChange={(e) => updateTocField(i, 'pagesTo', e.target.value)} placeholder="To" />
                                                                    <button type="button" className={`pcw-pdf-upload-btn ${ch.pdfKey ? 'has-pdf' : ''}`} onClick={() => pdfInputRefs.current[i]?.click()}>
                                                                        {ch.pdfKey ? '✔ Uploaded' : '↑ PDF'}
                                                                    </button>
                                                                </div>
                                                                <textarea className="pcw-textarea" rows={2} value={ch.abstract || ''} onChange={(e) => updateTocField(i, 'abstract', e.target.value)} placeholder="Abstract" style={{ marginTop: '8px' }} />
                                                                <div className="pcw-toc-flex-row" style={{ marginTop: '8px' }}>
                                                                    <input className="pcw-input" type="number" value={ch.priceSoftCopy || ''} onChange={(e) => updateTocField(i, 'priceSoftCopy', e.target.value)} placeholder="₹ Soft" />
                                                                    <input className="pcw-input" type="number" value={ch.priceHardCopy || ''} onChange={(e) => updateTocField(i, 'priceHardCopy', e.target.value)} placeholder="₹ Hard" />
                                                                    <input className="pcw-input" type="number" value={ch.priceCombined || ''} onChange={(e) => updateTocField(i, 'priceCombined', e.target.value)} placeholder="₹ Both" />
                                                                </div>
                                                                {pdfUploading[i] !== undefined && (
                                                                    <div style={{ fontSize: '10px', color: '#1e5292' }}>
                                                                        {pdfUploading[i] === 'error' ? 'Upload failed' : `Uploading: ${pdfUploading[i]}%`}
                                                                    </div>
                                                                )}
                                                                {ch.pdfName && <div className="pcw-pdf-name" style={{ marginTop: 2 }}>✔ {ch.pdfName}</div>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button type="button" className="pcw-add-btn" onClick={addTocChapter}>+ Add Chapter</button>

                                                <div className="pcw-section">
                                                    <p className="pcw-section-title">Additional PDFs</p>
                                                    <div className="pcw-field-grid">
                                                        {extraPdfTypes.map((type) => {
                                                            const hasPdf = !!form.frontmatterPdfs[type];
                                                            return (
                                                                <div key={type} className="pcw-field" style={{ border: '1px solid #e8edf5', padding: '6px', borderRadius: '4px' }}>
                                                                    <label className="pcw-label" style={{ fontSize: '9px' }}>{type}</label>
                                                                    <input type="file" accept="application/pdf" className="pcw-hidden-input" ref={(el) => { extraPdfInputRefs.current[type] = el; }}
                                                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExtraPdfUpload(type, f); }} />
                                                                    <button type="button" className={`pcw-pdf-upload-btn ${hasPdf ? 'has-pdf' : ''}`} onClick={() => extraPdfInputRefs.current[type]?.click()}>
                                                                        {hasPdf ? '✔' : '↑'} {type}
                                                                    </button>
                                                                    {pdfUploading[type] !== undefined && <div style={{ fontSize: '9px' }}>{pdfUploading[type]}%</div>}
                                                                    {hasPdf && <div style={{ fontSize: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{form.frontmatterPdfs[type].name}</div>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'review' && (
                                        <div className="tab-pane active slide-in-bottom">
                                            <p className="pcw-step-title">Cover Image</p>
                                            <p className="pcw-step-desc">Upload and crop the book cover (recommended ratio 4:5).</p>
                                            <div className="pcw-cover-container">
                                                <div className="pcw-cover-preview-box">
                                                    {form.coverImage
                                                        ? <img src={form.coverImage} alt="Cover preview" />
                                                        : <span>No image yet</span>
                                                    }
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label className="pcw-label">Select Cover Image <span className="req">*</span></label>
                                                    <label className="pcw-cover-upload-label">
                                                        <span className="icon">🖼️</span>
                                                        <span>{form.coverImage ? 'Replace Cover Image' : 'Upload Cover Image'}</span>
                                                        <span style={{ fontSize: '14px', color: '#6b7280' }}>JPG, PNG, WEBP · max 10 MB</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="pcw-hidden-input"
                                                            onChange={handleCoverFileChange}
                                                        />
                                                    </label>
                                                    {form.coverImage && (
                                                        <button type="button" className="pcw-btn pcw-btn-secondary"
                                                            onClick={() => { setShowCropper(true); }}>
                                                            ✂ Re-crop
                                                        </button>
                                                    )}
                                                    <div className="pcw-cover-hint">
                                                        <strong>Tip:</strong> After selecting an image, use the crop tool to adjust the frame.
                                                        The cover will be stored in the database and displayed on the public book chapter page.
                                                    </div>
                                                </div>
                                            </div>
                                            <hr style={{ margin: '16px 0', borderColor: '#e5e7eb', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />
                                            <div className="pcw-tab-section">
                                                <p className="pcw-step-title">Review & Submit</p>
                                                <p className="pcw-step-desc">Verify all details below before publishing. Navigate to any step to make corrections.</p>


                                                {/* Step 0: Linking (Hidden) */}
                                                <div className="pcw-review-section" style={{ marginBottom: '20px', display: 'none' }}>
                                                    <div className="pcw-review-section-title">Linking</div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Sub ID</span><span className="pcw-review-val">{form.submissionId || 'MISSING'}</span></div>
                                                </div>

                                                {/* Step 1: Author Details */}
                                                <div className="pcw-review-section" style={{ marginBottom: '20px' }}>
                                                    <div className="pcw-review-section-title">Step 1 Author Details</div>

                                                    <div style={{ marginBottom: '8px', fontWeight: 600, color: '#374151', fontSize: '14px' }}>Main Author</div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Name</span><span className="pcw-review-val">{form.mainAuthor.firstName} {form.mainAuthor.lastName}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Designation</span><span className="pcw-review-val">{form.mainAuthor.designation || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Department</span><span className="pcw-review-val">{form.mainAuthor.departmentName || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Institute</span><span className="pcw-review-val">{form.mainAuthor.instituteName || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Location</span><span className="pcw-review-val">{[form.mainAuthor.city, form.mainAuthor.state, form.mainAuthor.country].filter(Boolean).join(', ') || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Email</span><span className="pcw-review-val">{form.mainAuthor.email || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Phone</span><span className="pcw-review-val">{form.mainAuthor.phoneNumber || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Corresponding</span><span className="pcw-review-val">{form.mainAuthor.isCorrespondingAuthor ? 'Yes' : 'No'}</span></div>

                                                    {form.coAuthors.length > 0 && form.coAuthors.map((ca, idx) => (
                                                        <div key={idx} style={{ marginTop: '12px' }}>
                                                            <div style={{ fontWeight: 600, color: '#374151', fontSize: '14px', marginBottom: '6px' }}>Co-Author {idx + 1}</div>
                                                            <div className="pcw-review-row"><span className="pcw-review-key">Name</span><span className="pcw-review-val">{ca.firstName} {ca.lastName}</span></div>
                                                            <div className="pcw-review-row"><span className="pcw-review-key">Designation</span><span className="pcw-review-val">{ca.designation || '–'}</span></div>
                                                            <div className="pcw-review-row"><span className="pcw-review-key">Department</span><span className="pcw-review-val">{ca.departmentName || '–'}</span></div>
                                                            <div className="pcw-review-row"><span className="pcw-review-key">Institute</span><span className="pcw-review-val">{ca.instituteName || '–'}</span></div>
                                                            <div className="pcw-review-row"><span className="pcw-review-key">Location</span><span className="pcw-review-val">{[ca.city, ca.state, ca.country].filter(Boolean).join(', ') || '–'}</span></div>
                                                            <div className="pcw-review-row"><span className="pcw-review-key">Email</span><span className="pcw-review-val">{ca.email || '–'}</span></div>
                                                            <div className="pcw-review-row"><span className="pcw-review-key">Phone</span><span className="pcw-review-val">{ca.phoneNumber || '–'}</span></div>
                                                            <div className="pcw-review-row"><span className="pcw-review-key">Corresponding</span><span className="pcw-review-val">{ca.isCorrespondingAuthor ? 'Yes' : 'No'}</span></div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Step 2: Book Metadata */}
                                                <div className="pcw-review-section" style={{ marginBottom: '20px' }}>
                                                    <div className="pcw-review-section-title">Step 2 Book Metadata</div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Title</span><span className="pcw-review-val">{form.title || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Editors</span><span className={`pcw-review-val ${!Array.isArray(form.editors) || form.editors.filter(Boolean).length === 0 ? 'missing' : ''}`}>{Array.isArray(form.editors) && form.editors.filter(Boolean).length > 0 ? form.editors.join(', ') : 'Not set!'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Category</span><span className="pcw-review-val">{form.category || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">UID</span><span className="pcw-review-val">{form.uid || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">ISBN</span><span className={`pcw-review-val ${!form.isbn ? 'missing' : ''}`}>{form.isbn || 'Not set!'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">DOI</span><span className="pcw-review-val">{form.doi || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Pages</span><span className="pcw-review-val">{form.pages || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Published Year</span><span className="pcw-review-val">{form.publishedDate || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Release Date</span><span className="pcw-review-val">{form.releaseDate || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Indexed In</span><span className="pcw-review-val">{form.indexedIn || '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Copyright</span><span className="pcw-review-val">{form.copyright || '–'}</span></div>
                                                    <div className="pcw-review-row" style={{ alignItems: 'flex-start' }}>
                                                        <span className="pcw-review-key">Short Description</span>
                                                        <span className="pcw-review-val" style={{ flexShrink: 1, textAlign: 'right' }}>{form.description || '–'}</span>
                                                    </div>
                                                    <div className="pcw-review-row" style={{ marginTop: '8px', borderTop: '1px dashed #e5e7eb', paddingTop: '8px' }}>
                                                        <span className="pcw-review-key">Soft Copy Price</span><span className="pcw-review-val">{form.priceSoftCopy ? `₹${form.priceSoftCopy}` : '–'}</span>
                                                    </div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Hard Copy Price</span><span className="pcw-review-val">{form.priceHardCopy ? `₹${form.priceHardCopy}` : '–'}</span></div>
                                                    <div className="pcw-review-row"><span className="pcw-review-key">Soft + Hard Price</span><span className="pcw-review-val">{form.priceCombined ? `₹${form.priceCombined}` : '–'}</span></div>
                                                </div>

                                                {/* Step 3: Content */}
                                                <div className="pcw-review-section" style={{ marginBottom: '20px' }}>
                                                    <div className="pcw-review-section-title">Step 3 Content (Synopsis, Scope & Archives)</div>

                                                    {/* Synopsis */}
                                                    <div style={{ marginBottom: '12px' }}>
                                                        <div style={{ fontWeight: 600, color: '#374151', fontSize: '14px', marginBottom: '8px' }}>Synopsis</div>
                                                        {form.synopses.filter(s => s.trim()).length > 0
                                                            ? form.synopses.filter(s => s.trim()).map((s, i) => (
                                                                <div key={i} style={{ marginBottom: '10px' }}>
                                                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '2px' }}>Paragraph {i + 1}</div>
                                                                    <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, background: '#f9fafb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>{s}</div>
                                                                </div>
                                                            ))
                                                            : <span className="pcw-review-tag warn">⚠️ No synopsis added</span>
                                                        }
                                                    </div>

                                                    {/* Scope */}
                                                    <div style={{ marginBottom: '12px', borderTop: '1px dashed #e5e7eb', paddingTop: '12px' }}>
                                                        <div style={{ fontWeight: 600, color: '#374151', fontSize: '14px', marginBottom: '8px' }}>Scope & Coverage</div>
                                                        {form.scopeIntro && (
                                                            <div style={{ marginBottom: '10px' }}>
                                                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '2px' }}>Introduction</div>
                                                                <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, background: '#f9fafb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>{form.scopeIntro}</div>
                                                            </div>
                                                        )}
                                                        {scopeItems.filter(s => s.trim()).length > 0
                                                            ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                                                {scopeItems.filter(s => s.trim()).map((s, i) => (
                                                                    <span key={i} style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: '4px', padding: '3px 10px', fontSize: '14px' }}>• {s}</span>
                                                                ))}
                                                            </div>
                                                            : <span className="pcw-review-tag warn"></span>
                                                        }
                                                    </div>

                                                    {/* Archives */}
                                                    <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '12px' }}>
                                                        <div style={{ fontWeight: 600, color: '#374151', fontSize: '14px', marginBottom: '8px' }}>Archives</div>
                                                        {archiveIntro && (
                                                            <div style={{ marginBottom: '10px' }}>
                                                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '2px' }}>Introduction</div>
                                                                <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, background: '#f9fafb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>{archiveIntro}</div>
                                                            </div>
                                                        )}
                                                        {archiveItems.filter(s => s.trim()).length > 0
                                                            ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                                                {archiveItems.filter(s => s.trim()).map((s, i) => (
                                                                    <span key={i} style={{ background: '#f0fdf4', color: '#15803d', borderRadius: '4px', padding: '3px 10px', fontSize: '14px' }}>• {s}</span>
                                                                ))}
                                                            </div>
                                                            : <span className="pcw-review-tag warn"></span>
                                                        }
                                                    </div>
                                                </div>

                                                {/* Step 4: Author Biography */}
                                                <div className="pcw-review-section" style={{ marginBottom: '20px' }}>
                                                    <div className="pcw-review-section-title">Step 4 Author Biographies</div>
                                                    {biographies.filter(b => b.authorName).length > 0
                                                        ? biographies.filter(b => b.authorName).map((b, i) => (
                                                            <div key={i} style={{ marginBottom: '10px' }}>
                                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '3px' }}>
                                                                    {b.authorName} {b.affiliation ? <span style={{ fontWeight: 400, color: '#6b7280' }}>({b.affiliation})</span> : ''}
                                                                </div>
                                                                {b.biography
                                                                    ? <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, background: '#f9fafb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>{b.biography}</div>
                                                                    : <span className="pcw-review-tag warn" style={{ fontSize: '14px' }}>⚠️ No biography text</span>
                                                                }
                                                            </div>
                                                        ))
                                                        : <span className="pcw-review-tag warn">⚠️ No biographies added</span>
                                                    }
                                                </div>

                                                {/* Editor Biographies Review */}
                                                <div className="pcw-review-section" style={{ marginBottom: '20px' }}>
                                                    <div className="pcw-review-section-title">Step 4 — Editor Biographies</div>
                                                    {editorBiographies.filter(b => b.editorName).length > 0
                                                        ? editorBiographies.filter(b => b.editorName).map((b, i) => (
                                                            <div key={i} style={{ marginBottom: '10px' }}>
                                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '3px' }}>
                                                                    {b.editorName} {b.affiliation ? <span style={{ fontWeight: 400, color: '#6b7280' }}>({b.affiliation})</span> : ''}
                                                                </div>
                                                                {b.biography
                                                                    ? <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, background: '#f9fafb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>{b.biography}</div>
                                                                    : <span className="pcw-review-tag warn" style={{ fontSize: '14px' }}>⚠️ No biography text</span>
                                                                }
                                                            </div>
                                                        ))
                                                        : <span className="pcw-review-tag warn">⚠️ No editor biographies added</span>
                                                    }
                                                </div>

                                                {/* Step 5: Table of Contents */}
                                                <div className="pcw-review-section" style={{ marginBottom: '20px' }}>
                                                    <div className="pcw-review-section-title">Step 5 Table of Contents & Assets</div>
                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>Chapters ({tocChapters.filter(c => c.title).length})</div>
                                                    {tocChapters.filter(c => c.title).length > 0
                                                        ? tocChapters.filter(c => c.title).map((c, i) => (
                                                            <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                    <span style={{ fontWeight: 700, color: '#1e5292', fontSize: '14px' }}>{c.chapterNumber || String(i + 1).padStart(2, '0')}. {c.title}</span>
                                                                    <span className={`pcw-review-tag ${c.pdfKey ? 'ok' : 'warn'}`} style={{ fontSize: '14px' }}>{c.pdfKey ? '✔ PDF' : '⚠️ No PDF'}</span>
                                                                </div>
                                                                {c.authors && <div className="pcw-review-row" style={{ padding: 0, border: 'none' }}><span className="pcw-review-key" style={{ fontSize: '14px' }}>Authors</span><span className="pcw-review-val" style={{ fontSize: '14px' }}>{c.authors}</span></div>}
                                                                {(c.pagesFrom || c.pagesTo) && <div className="pcw-review-row" style={{ padding: 0, border: 'none' }}><span className="pcw-review-key" style={{ fontSize: '14px' }}>Pages</span><span className="pcw-review-val" style={{ fontSize: '14px' }}>{c.pagesFrom || '?'} – {c.pagesTo || '?'}</span></div>}
                                                                {(c.priceSoftCopy || c.priceHardCopy || c.priceCombined) && (
                                                                    <div className="pcw-review-row" style={{ padding: 0, border: 'none' }}>
                                                                        <span className="pcw-review-key" style={{ fontSize: '14px' }}>Pricing</span>
                                                                        <span className="pcw-review-val" style={{ fontSize: '14px' }}>
                                                                            {c.priceSoftCopy ? `Soft: ₹${c.priceSoftCopy}` : ''}{c.priceHardCopy ? `  Hard: ₹${c.priceHardCopy}` : ''}{c.priceCombined ? `  Combined: ₹${c.priceCombined}` : ''}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {c.abstract && <div style={{ marginTop: '6px', fontSize: '14px', color: '#6b7280', fontStyle: 'italic', lineHeight: 1.5 }}>{c.abstract}</div>}
                                                            </div>
                                                        ))
                                                        : <span className="pcw-review-tag warn">⚠️ No chapters in ToC</span>
                                                    }

                                                    <div style={{ marginTop: '16px', borderTop: '1px dashed #e5e7eb', paddingTop: '12px' }}>
                                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Extra PDF Documents ({Object.keys(form.frontmatterPdfs).length} / {extraPdfTypes.length} uploaded)</div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                            {extraPdfTypes.map((type) => {
                                                                const uploaded = !!form.frontmatterPdfs[type]?.pdfKey;
                                                                return (
                                                                    <span key={type} style={{ background: uploaded ? '#f0fdf4' : '#fef2f2', color: uploaded ? '#15803d' : '#b91c1c', borderRadius: '4px', padding: '3px 10px', fontSize: '14px' }}>
                                                                        {uploaded ? '✔' : '✖'} {type}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Step 6: Cover Image */}
                                                <div className="pcw-review-section" style={{ marginBottom: '20px' }}>
                                                    <div className="pcw-review-section-title">Step 6 Cover Image</div>
                                                    {form.coverImage
                                                        ? <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginTop: '8px' }}>
                                                            <img src={form.coverImage} alt="Book Cover" style={{ width: '90px', height: '112px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #d1d5db', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                                                            <div>
                                                                <span className="pcw-review-tag ok" style={{ display: 'inline-block', marginBottom: '8px' }}>✔ Cover image uploaded</span>
                                                                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>This image will be displayed on the public book page.</p>
                                                            </div>
                                                        </div>
                                                        : <div style={{ marginTop: '8px' }}>
                                                            <span className="pcw-review-tag warn">⚠️ No cover image uploaded</span>
                                                            <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '6px' }}>A cover image is highly recommended for visibility on the public page.</p>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="pcw-footer">
                                    <div className="pcw-footer-left">
                                        <button type="button" className="pcw-btn pcw-btn-secondary" onClick={onClose}>Cancel</button>
                                    </div>

                                    {!showDraftSelection && (
                                        <div className="pcw-footer-center" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
                                            {isSaving ? (
                                                <span>⏳ Saving draft...</span>
                                            ) : lastSavedAt ? (
                                                <span>✔ Draft saved at {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            ) : null}
                                        </div>
                                    )}

                                    <div className="pcw-footer-right">
                                        {!showDraftSelection && (
                                            <button
                                                type="button"
                                                className="pcw-btn pcw-btn-secondary"
                                                onClick={() => saveDraft()}
                                                disabled={isSaving || !form.submissionId}
                                                style={{ marginRight: '12px' }}
                                            >
                                                {isSaving ? 'Saving...' : '💾 Save Draft'}
                                            </button>
                                        )}
                                        {activeTab !== 'author' && <button type="button" className="pcw-btn pcw-btn-secondary" onClick={handlePrevTab}>Previous</button>}
                                        {activeTab !== 'review' ? (
                                            <button type="button" className="pcw-btn pcw-btn-primary" onClick={handleNextTab}>Next</button>
                                        ) : (
                                            <button type="button" className="pcw-btn pcw-btn-success" onClick={handleSubmit} disabled={loading}>
                                                {loading ? 'Publishing...' : '🚀 Publish Manual Entry'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Cropper */}
                                {showCropper && originalImage && createPortal(
                                    <div className="image-cropper-modal">
                                        <div className="cropper-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000 }} onClick={() => setShowCropper(false)} />
                                        <div className="cropper-container" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '8px', width: '90%', maxWidth: '800px', zIndex: 10001, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                                            <div className="cropper-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h3 style={{ margin: 0, fontSize: '16px' }}>Crop Book Cover Image</h3>
                                                <button className="cropper-close-btn" onClick={() => setShowCropper(false)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}>×</button>
                                            </div>
                                            <div className="cropper-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
                                                <div className="crop-area" style={{ position: 'relative', width: '100%', height: '400px', background: '#333' }}>
                                                    <Cropper
                                                        image={originalImage}
                                                        crop={cropPos}
                                                        zoom={zoom}
                                                        aspect={COVER_ASPECT_RATIO}
                                                        onCropChange={setCropPos}
                                                        onZoomChange={setZoom}
                                                        onCropComplete={onCropComplete}
                                                        onMediaLoaded={(mediaSize) => {
                                                            setCropPos({ x: -mediaSize.width, y: 0 });
                                                        }}
                                                        restrictPosition={true}
                                                    />
                                                </div>
                                                <div className="cropper-controls">
                                                    <div className="zoom-control" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <label style={{ fontWeight: 600 }}>Zoom</label>
                                                        <input
                                                            type="range"
                                                            min={1}
                                                            max={3}
                                                            step={0.1}
                                                            value={zoom}
                                                            onChange={(e) => setZoom(Number(e.target.value))}
                                                            className="zoom-slider"
                                                            style={{ flex: 1 }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="cropper-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                                <button className="btn-cancel" onClick={() => setShowCropper(false)} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                                <button className="btn-skip" onClick={handleSkipCrop} style={{ padding: '8px 16px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Skip & Use Original</button>
                                                <button className="btn-save" onClick={applyCrop} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Cropped Image</button>
                                            </div>
                                        </div>
                                    </div>,
                                    document.body
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Alert Popup */}
            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText={alertConfig.confirmText}
                showCancel={alertConfig.showCancel}
                cancelText={alertConfig.cancelText}
                onConfirm={alertConfig.onConfirm}
                onClose={() => setAlertConfig(p => ({ ...p, isOpen: false }))}
            />
        </div>

    );
};

export default IndividualPublishChapterWizard;