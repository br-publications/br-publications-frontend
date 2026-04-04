// Text Book Publishing Form Component
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { TextBookSubmission } from '../types/textBookTypes';
import { checkIsbnAvailability } from '../../../services/textBookService';
import type { PublishingFormData, CropArea } from '../types/publishingTypes';
import ImageCropper from './ImageCropper';
import PhoneNumberInput from '../../../components/common/PhoneNumberInput';
import { isValidPhoneNumber } from '../../../utils/phoneValidation';
import './textBookPublishingForm.css';

interface TextBookPublishingFormProps {
    submission?: TextBookSubmission;
    mode?: 'submission' | 'direct_admin';
    onSubmit: (formData: PublishingFormData) => void;
    onCancel: () => void;
    loading?: boolean;
}

const INDEXED_DATABASES = ['Scopus', 'Google Scholar', 'DBLP', 'Web of Science', 'IEEE Xplore'];

const TextBookPublishingForm: React.FC<TextBookPublishingFormProps> = ({
    submission,
    mode = 'submission',
    onSubmit,
    onCancel,
    loading = false,
}) => {
    const [formData, setFormData] = useState<PublishingFormData>({
        bookTitle: '',
        mainAuthor: '',
        coAuthors: [],
        isbn: '',
        doi: '',
        pages: 0,
        copyright: new Date().getFullYear().toString(),
        releaseDate: new Date().toISOString().split('T')[0],
        indexedIn: [],
        keywords: [],
        category: '',
        description: '',
        pricing: {
            softCopyPrice: 0,
            hardCopyPrice: 0,
            bundlePrice: 0,
        },
        googleLink: '',
        flipkartLink: '',
        amazonLink: '',
        coverImage: null,
        croppedCoverImage: null,
        cropArea: null,
    });

    const [keywordInput, setKeywordInput] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Prefill form data from submission
    useEffect(() => {
        if (submission) {
            const mainAuthorName = `${submission.mainAuthor.firstName} ${submission.mainAuthor.lastName}`;
            const coAuthorNames = submission.coAuthors?.map(
                (author) => `${author.firstName} ${author.lastName}`
            ) || [];

            setFormData((prev) => ({
                ...prev,
                bookTitle: submission.bookTitle,
                mainAuthor: mainAuthorName,
                coAuthors: coAuthorNames,
                isbn: submission.isbnNumber || '',
                doi: submission.doiNumber || '',
            }));
        }
    }, [submission]);

    const getErrors = (data: PublishingFormData): Record<string, string> => {
        const newErrors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!data.isbn.trim()) newErrors.isbn = 'ISBN is required';
        if (!data.pages || data.pages <= 0) newErrors.pages = 'Pages must be greater than 0';
        if (!data.copyright.trim()) newErrors.copyright = 'Copyright year is required';
        if (!data.releaseDate) newErrors.releaseDate = 'Release date is required';
        // Indexed In is now optional
        if (data.pricing.softCopyPrice <= 0) newErrors.softCopyPrice = 'Soft copy price must be greater than 0';
        if (data.pricing.hardCopyPrice <= 0) newErrors.hardCopyPrice = 'Hard copy price must be greater than 0';
        if (data.pricing.bundlePrice <= 0) newErrors.bundlePrice = 'Bundle price must be greater than 0';

        if (mode === 'direct_admin') {
            if (!data.bookTitle.trim()) newErrors.bookTitle = 'Book Title is required';

            // Validate Main Author
            if (typeof data.mainAuthor !== 'string') {
                if (!data.mainAuthor.firstName?.trim()) newErrors.mainAuthorFirstName = 'First Name is required';
                // Last Name is optional
                if (data.mainAuthor.email?.trim() && !emailRegex.test(data.mainAuthor.email)) {
                    newErrors.mainAuthorEmail = 'Invalid email format';
                }
                // Institute is optional
                if (data.mainAuthor.phoneNumber && !isValidPhoneNumber(data.mainAuthor.phoneNumber)) {
                    newErrors.mainAuthorPhone = 'Phone number must be at least 10 digits';
                }
            }

            // Validate Co-Authors
            data.coAuthors.forEach((author, index) => {
                if (typeof author !== 'string') {
                    if (!author.firstName?.trim()) newErrors[`coAuthor${index}FirstName`] = 'First Name is required';
                    // Last Name is now optional
                    if (author.email?.trim() && !emailRegex.test(author.email)) {
                        newErrors[`coAuthor${index}Email`] = 'Invalid email format';
                    }
                    // Institute is now optional
                    if (author.phoneNumber && !isValidPhoneNumber(author.phoneNumber)) {
                        newErrors[`coAuthor${index}Phone`] = 'Phone number must be at least 10 digits';
                    }
                }
            });
        }

        // Allow either cropped or original cover image
        if (!data.croppedCoverImage && !data.coverImage) {
            newErrors.coverImage = 'Cover image is required';
        }

        // Validate URLs
        const isValidUrl = (url: string) => {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        };

        if (data.googleLink && !isValidUrl(data.googleLink)) {
            newErrors.googleLink = 'Please enter a valid URL (e.g., https://...)';
        }
        if (data.flipkartLink && !isValidUrl(data.flipkartLink)) {
            newErrors.flipkartLink = 'Please enter a valid URL (e.g., https://...)';
        }
        if (data.amazonLink && !isValidUrl(data.amazonLink)) {
            newErrors.amazonLink = 'Please enter a valid URL (e.g., https://...)';
        }

        return newErrors;
    };

    const handleBlur = (field: string) => {
        const currentErrors = getErrors(formData);
        if (currentErrors[field]) {
            setErrors((prev) => ({ ...prev, [field]: currentErrors[field] }));
        } else {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleInputChange = (field: keyof PublishingFormData, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);

        // If the field (or related fields) is touched, re-validate
        // For simple fields, the key is the same. For complex refs (like mainAuthor change), we might need to check sub-fields.
        // Simplification: if we have errors, re-eval to see if we fixed them.

        const currentErrors = getErrors(newData);
        setErrors((prev) => {
            // We can selectively update errors if they are fixed, 
            // or if the field is touched and now invalid.
            // For now, let's clear the error for the specific field if it's resolved.
            const newState = { ...prev };
            // We need to know which error keys correspond to this change. 
            // Since 'field' is top-level (e.g. 'mainAuthor'), this might affect multiple error keys.

            // Simple approach: Re-calculate all errors, but only apply them if touched or already in error.
            // Actually, the previous implementation just cleared the error. Let's do that + check validity if touched.

            // Since we don't easily know sub-keys here without complex logic, let's rely on handleBlur for *showing* new errors,
            // but we should definitely remove errors that are fixed.

            // Re-running validation for everything is safe but we only want to show for touched/submitted.
            // Let's defer to: if it *was* an error, check if it still is.

            // Iterate over current displayed errors
            Object.keys(prev).forEach(key => {
                if (!currentErrors[key]) {
                    delete newState[key];
                }
            });
            return newState;
        });
    };

    const handlePricingChange = (field: 'softCopyPrice' | 'hardCopyPrice' | 'bundlePrice', value: string) => {
        const numValue = parseFloat(value) || 0;
        const newData = {
            ...formData,
            pricing: {
                ...formData.pricing,
                [field]: numValue,
            },
        };
        setFormData(newData);

        // Similar error clearing logic
        const currentErrors = getErrors(newData);
        setErrors((prev) => {
            const newState = { ...prev };
            if (!currentErrors[field]) delete newState[field];
            return newState;
        });
    };

    const handleIndexedInToggle = (database: string) => {
        const newIndexedIn = formData.indexedIn.includes(database)
            ? formData.indexedIn.filter((db) => db !== database)
            : [...formData.indexedIn, database];

        const newData = { ...formData, indexedIn: newIndexedIn };
        setFormData(newData);

        const currentErrors = getErrors(newData);
        setErrors((prev) => {
            const newState = { ...prev };
            if (!currentErrors.indexedIn) delete newState.indexedIn;
            return newState;
        });
    };

    const handleAddKeyword = () => {
        if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                keywords: [...prev.keywords, keywordInput.trim()],
            }));
            setKeywordInput('');
        }
    };

    const handleRemoveKeyword = (keyword: string) => {
        setFormData((prev) => ({
            ...prev,
            keywords: prev.keywords.filter((k) => k !== keyword),
        }));
    };

    const handleIsbnBlur = async () => {
        if (!formData.isbn.trim()) return;

        try {
            // Assuming checkIsbnAvailability is imported or defined elsewhere
            // For this example, let's mock it or assume it's available.
            // import { checkIsbnAvailability } from 'path/to/api'; // You might need to add this import
            const existingIsbns = await checkIsbnAvailability([formData.isbn]);
            if (existingIsbns.length > 0) {
                setErrors((prev) => ({ ...prev, isbn: 'ISBN already exists in the system' }));
            } else {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.isbn;
                    return newErrors;
                });
            }
        } catch (error) {
            console.error('Failed to check ISBN:', error);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const newData = { ...formData, coverImage: file };
            setFormData(newData);

            const reader = new FileReader();
            reader.onload = () => {
                setOriginalImage(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);

            const currentErrors = getErrors(newData);
            setErrors((prev) => {
                const newState = { ...prev };
                if (!currentErrors.coverImage) delete newState.coverImage;
                return newState;
            });
        }
    };

    const handleCropComplete = (cropArea: CropArea, croppedImage: Blob) => {
        const newData = {
            ...formData,
            croppedCoverImage: croppedImage,
            cropArea,
        };
        setFormData(newData);
        setImagePreview(URL.createObjectURL(croppedImage));
        setShowCropper(false);

        const currentErrors = getErrors(newData);
        setErrors((prev) => {
            const newState = { ...prev };
            if (!currentErrors.coverImage) delete newState.coverImage;
            return newState;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const allErrors = getErrors(formData);

        setErrors(allErrors);

        if (Object.keys(allErrors).length > 0) {

            const firstErrorField = Object.keys(allErrors)[0];
            // Try to find element by name or class
            setTimeout(() => {
                const element = document.getElementsByName(firstErrorField)[0] || document.querySelector('.input-error');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        } else {
            onSubmit(formData);
        }
    };

    return createPortal(
        <div className="publishing-form-modal">
            <div className="publishing-modal-overlay" onClick={onCancel}></div>
            <div className="publishing-modal-container" onClick={e => e.stopPropagation()}>
                <div className="publishing-modal-header">
                    <h2>Publish Text Book</h2>
                    <button className="publishing-close-btn" onClick={onCancel}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="publishing-form">
                    <div className="form-body">
                        {/* Book Information Section */}
                        <section className="form-section">
                            <h3>Book Information</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Book Title*</label>
                                    <input
                                        type="text"
                                        value={formData.bookTitle}
                                        disabled={mode !== 'direct_admin'}
                                        onChange={mode === 'direct_admin' ? (e) => handleInputChange('bookTitle', e.target.value) : undefined}
                                        onBlur={() => handleBlur('bookTitle')}
                                        className={mode === 'direct_admin' ? (errors.bookTitle ? 'input-error' : '') : 'input-disabled'}
                                        placeholder={mode === 'direct_admin' ? "Enter book title" : ""}
                                    />
                                    {mode === 'direct_admin' && errors.bookTitle && <span className="error-text">{errors.bookTitle}</span>}
                                </div>

                                {mode === 'direct_admin' ? (
                                    <>
                                        <div className="author-card">
                                            <div className="author-header">
                                                <h4>Main Author Details</h4>
                                            </div>
                                            <div className="author-grid">
                                                <div className="form-group">
                                                    <label>First Name *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="First Name"
                                                        value={typeof formData.mainAuthor !== 'string' ? formData.mainAuthor.firstName : ''}
                                                        onChange={(e) => {
                                                            const current = typeof formData.mainAuthor !== 'string' ? formData.mainAuthor : { title: '', firstName: '', lastName: '', email: '', phoneNumber: '', institute: '', city: '', state: '', country: '' };
                                                            handleInputChange('mainAuthor', { ...current, firstName: e.target.value });
                                                        }}
                                                        onBlur={() => handleBlur('mainAuthorFirstName')}
                                                        className={errors.mainAuthorFirstName ? 'input-error' : ''}
                                                    />
                                                    {errors.mainAuthorFirstName && <span className="error-text">{errors.mainAuthorFirstName}</span>}
                                                </div>
                                                <div className="form-group">
                                                    <label>Last Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Last Name"
                                                        value={typeof formData.mainAuthor !== 'string' ? formData.mainAuthor.lastName : ''}
                                                        onChange={(e) => {
                                                            const current = typeof formData.mainAuthor !== 'string' ? formData.mainAuthor : { title: '', firstName: '', lastName: '', email: '', phoneNumber: '', institute: '', city: '', state: '', country: '' };
                                                            handleInputChange('mainAuthor', { ...current, lastName: e.target.value });
                                                        }}
                                                        onBlur={() => handleBlur('mainAuthorLastName')}
                                                        className={errors.mainAuthorLastName ? 'input-error' : ''}
                                                    />
                                                    {errors.mainAuthorLastName && <span className="error-text">{errors.mainAuthorLastName}</span>}
                                                </div>
                                                <div className="form-group">
                                                    <label>Email</label>
                                                    <input
                                                        type="email"
                                                        placeholder="Email"
                                                        value={typeof formData.mainAuthor !== 'string' ? formData.mainAuthor.email : ''}
                                                        onChange={(e) => {
                                                            const current = typeof formData.mainAuthor !== 'string' ? formData.mainAuthor : { title: '', firstName: '', lastName: '', email: '', phoneNumber: '', institute: '', city: '', state: '', country: '' };
                                                            handleInputChange('mainAuthor', { ...current, email: e.target.value });
                                                        }}
                                                        onBlur={() => handleBlur('mainAuthorEmail')}
                                                        className={errors.mainAuthorEmail ? 'input-error' : ''}
                                                    />
                                                    {errors.mainAuthorEmail && <span className="error-text">{errors.mainAuthorEmail}</span>}
                                                </div>
                                                <div className="form-group">
                                                    <label>Phone Number</label>
                                                    <PhoneNumberInput
                                                        value={typeof formData.mainAuthor !== 'string' ? formData.mainAuthor.phoneNumber : ''}
                                                        onChange={(value) => {
                                                            const current = typeof formData.mainAuthor !== 'string' ? formData.mainAuthor : { title: '', firstName: '', lastName: '', email: '', phoneNumber: '', institute: '', city: '', state: '', country: '' };
                                                            handleInputChange('mainAuthor', { ...current, phoneNumber: value });
                                                        }}
                                                        onBlur={() => handleBlur('mainAuthorPhone')}
                                                        className={errors.mainAuthorPhone ? 'input-error' : ''}
                                                    />
                                                    {errors.mainAuthorPhone && <span className="error-text">{errors.mainAuthorPhone}</span>}
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Institute</label>
                                                <input
                                                    type="text"
                                                    placeholder="Institute"
                                                    value={typeof formData.mainAuthor !== 'string' ? formData.mainAuthor.institute : ''}
                                                    onChange={(e) => {
                                                        const current = typeof formData.mainAuthor !== 'string' ? formData.mainAuthor : { title: '', firstName: '', lastName: '', email: '', phoneNumber: '', institute: '', city: '', state: '', country: '' };
                                                        handleInputChange('mainAuthor', { ...current, institute: e.target.value });
                                                    }}
                                                    onBlur={() => handleBlur('mainAuthorInstitute')}
                                                    className={errors.mainAuthorInstitute ? 'input-error' : ''}
                                                />
                                                {errors.mainAuthorInstitute && <span className="error-text">{errors.mainAuthorInstitute}</span>}
                                            </div>
                                        </div>
                                        {/* Co-Authors Admin Mode */}
                                        <div className="form-group full-width">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h4>Co-Authors</h4>
                                                <button
                                                    type="button"
                                                    className="btn-add-keyword"
                                                    disabled={formData.coAuthors.length >= 6}
                                                    onClick={() => {
                                                        const currentCoAuthors = [...formData.coAuthors];
                                                        if (currentCoAuthors.length < 6) {
                                                            currentCoAuthors.push({ title: '', firstName: '', lastName: '', email: '', institute: '', city: '', state: '', country: '' });
                                                            handleInputChange('coAuthors', currentCoAuthors);
                                                        }
                                                    }}
                                                >
                                                    {formData.coAuthors.length >= 6 ? 'Max Co-Authors Reached (6)' : '+ Add Co-Author'}
                                                </button>
                                            </div>
                                        </div>
                                        {formData.coAuthors.map((author, index) => (
                                            <div key={index} className="author-card">
                                                <div className="author-header">
                                                    <h5>Co-Author {index + 1}</h5>
                                                    <button
                                                        type="button"
                                                        className="remove-keyword"
                                                        onClick={() => {
                                                            const currentCoAuthors = [...formData.coAuthors];
                                                            currentCoAuthors.splice(index, 1);
                                                            handleInputChange('coAuthors', currentCoAuthors);
                                                        }}
                                                        title="Remove Co-Author"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <div className="author-grid">
                                                    <div className="form-group">
                                                        <label>First Name*</label>
                                                        <input
                                                            type="text"
                                                            value={typeof author !== 'string' ? author.firstName : ''}
                                                            onChange={(e) => {
                                                                const currentCoAuthors = [...formData.coAuthors];
                                                                if (typeof currentCoAuthors[index] !== 'string') {
                                                                    (currentCoAuthors[index] as any).firstName = e.target.value;
                                                                    handleInputChange('coAuthors', currentCoAuthors);
                                                                }
                                                            }}
                                                            onBlur={() => handleBlur(`coAuthor${index}FirstName`)}
                                                            className={errors[`coAuthor${index}FirstName`] ? 'input-error' : ''}
                                                            placeholder="First Name"
                                                        />
                                                        {errors[`coAuthor${index}FirstName`] && <span className="error-text">{errors[`coAuthor${index}FirstName`]}</span>}
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Last Name</label>
                                                        <input
                                                            type="text"
                                                            value={typeof author !== 'string' ? author.lastName : ''}
                                                            onChange={(e) => {
                                                                const currentCoAuthors = [...formData.coAuthors];
                                                                if (typeof currentCoAuthors[index] !== 'string') {
                                                                    (currentCoAuthors[index] as any).lastName = e.target.value;
                                                                    handleInputChange('coAuthors', currentCoAuthors);
                                                                }
                                                            }}
                                                            onBlur={() => handleBlur(`coAuthor${index}LastName`)}
                                                            className={errors[`coAuthor${index}LastName`] ? 'input-error' : ''}
                                                            placeholder="Last Name"
                                                        />
                                                        {errors[`coAuthor${index}LastName`] && <span className="error-text">{errors[`coAuthor${index}LastName`]}</span>}
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Email</label>
                                                        <input
                                                            type="email"
                                                            value={typeof author !== 'string' ? author.email : ''}
                                                            onChange={(e) => {
                                                                const currentCoAuthors = [...formData.coAuthors];
                                                                if (typeof currentCoAuthors[index] !== 'string') {
                                                                    (currentCoAuthors[index] as any).email = e.target.value;
                                                                    handleInputChange('coAuthors', currentCoAuthors);
                                                                }
                                                            }}
                                                            onBlur={() => handleBlur(`coAuthor${index}Email`)}
                                                            className={errors[`coAuthor${index}Email`] ? 'input-error' : ''}
                                                            placeholder="Email"
                                                        />
                                                        {errors[`coAuthor${index}Email`] && <span className="error-text">{errors[`coAuthor${index}Email`]}</span>}
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Institute</label>
                                                        <input
                                                            type="text"
                                                            value={typeof author !== 'string' ? author.institute : ''}
                                                            onChange={(e) => {
                                                                const currentCoAuthors = [...formData.coAuthors];
                                                                if (typeof currentCoAuthors[index] !== 'string') {
                                                                    (currentCoAuthors[index] as any).institute = e.target.value;
                                                                    handleInputChange('coAuthors', currentCoAuthors);
                                                                }
                                                            }}
                                                            onBlur={() => handleBlur(`coAuthor${index}Institute`)}
                                                            className={errors[`coAuthor${index}Institute`] ? 'input-error' : ''}
                                                            placeholder="Institute"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Phone Number</label>
                                                        <PhoneNumberInput
                                                            value={typeof author !== 'string' ? author.phoneNumber || '' : ''}
                                                            onChange={(value) => {
                                                                const currentCoAuthors = [...formData.coAuthors];
                                                                if (typeof currentCoAuthors[index] !== 'string') {
                                                                    (currentCoAuthors[index] as any).phoneNumber = value;
                                                                    handleInputChange('coAuthors', currentCoAuthors);
                                                                }
                                                            }}
                                                            onBlur={() => handleBlur(`coAuthor${index}Phone`)}
                                                            className={errors[`coAuthor${index}Phone`] ? 'input-error' : ''}
                                                        />
                                                        {errors[`coAuthor${index}Phone`] && <span className="error-text">{errors[`coAuthor${index}Phone`]}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* File Uploads for Admin */}
                                        {/* <div className="form-group full-width">
                                            <h4>Manuscript Files</h4>
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Content File (PDF/DOCX) *</label>
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={(e) => handleInputChange('contentFile', e.target.files?.[0] || null)}
                                            />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Full Text File (PDF/DOCX) *</label>
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={(e) => handleInputChange('fullTextFile', e.target.files?.[0] || null)}
                                            />
                                        </div> */}
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group full-width">
                                            <label>Main Author</label>
                                            <input
                                                type="text"
                                                value={typeof formData.mainAuthor === 'string' ? formData.mainAuthor : `${formData.mainAuthor.firstName} ${formData.mainAuthor.lastName}`}
                                                disabled
                                                className="input-disabled"
                                            />
                                        </div>


                                    </>
                                )}

                                <div className="form-group">
                                    <label>ISBN *</label>
                                    <input
                                        type="text"
                                        value={formData.isbn}
                                        onChange={(e) => handleInputChange('isbn', e.target.value)}
                                        onBlur={handleIsbnBlur}
                                        className={errors.isbn ? 'input-error' : ''}
                                        placeholder="978-93-89876-01-2"
                                    />
                                    {errors.isbn && <span className="error-text">{errors.isbn}</span>}
                                </div>

                                <div className="form-group">
                                    <label>DOI Number</label>
                                    <input
                                        type="text"
                                        value={formData.doi}
                                        onChange={(e) => handleInputChange('doi', e.target.value)}
                                        onBlur={() => handleBlur('doi')}
                                        className={errors.doi ? 'input-error' : ''}
                                        placeholder="10.3635/book.1.293570"
                                    />
                                    {errors.doi && <span className="error-text">{errors.doi}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Pages *</label>
                                    <input
                                        type="number"
                                        value={formData.pages || ''}
                                        onChange={(e) => handleInputChange('pages', parseInt(e.target.value) || 0)}
                                        onBlur={() => handleBlur('pages')}
                                        className={errors.pages ? 'input-error' : ''}
                                        placeholder="340"
                                        min="1"
                                    />
                                    {errors.pages && <span className="error-text">{errors.pages}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Copyright Year *</label>
                                    <input
                                        type="text"
                                        value={formData.copyright}
                                        onChange={(e) => handleInputChange('copyright', e.target.value)}
                                        onBlur={() => handleBlur('copyright')}
                                        className={errors.copyright ? 'input-error' : ''}
                                        placeholder="2024"
                                    />
                                    {errors.copyright && <span className="error-text">{errors.copyright}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Release Date *</label>
                                    <input
                                        type="date"
                                        value={formData.releaseDate}
                                        onChange={(e) => handleInputChange('releaseDate', e.target.value)}
                                        onBlur={() => handleBlur('releaseDate')}
                                        className={errors.releaseDate ? 'input-error' : ''}
                                    />
                                    {errors.releaseDate && <span className="error-text">{errors.releaseDate}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        className={errors.category ? 'input-error' : ''}
                                        placeholder="e.g., Computer Science, Mathematics"
                                    />
                                    {errors.category && <span className="error-text">{errors.category}</span>}
                                </div>
                            </div>
                        </section>

                        {/* Cover Image Section */}
                        <section className="form-section">
                            <h3>Book Cover Image</h3>
                            <div className="image-upload-section">
                                {imagePreview ? (
                                    <div className="image-preview-container">
                                        <img src={imagePreview} alt="Book cover preview" className="cover-preview" />
                                        <button
                                            type="button"
                                            className="btn-change-image"
                                            onClick={() => document.getElementById('cover-image-input')?.click()}
                                        >
                                            Change Image
                                        </button>
                                    </div>
                                ) : (
                                    <div className="image-upload-placeholder">
                                        <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <p>Upload book cover image</p>
                                        <button
                                            type="button"
                                            className="btn-upload"
                                            onClick={() => document.getElementById('cover-image-input')?.click()}
                                        >
                                            Choose File
                                        </button>
                                    </div>
                                )}
                                <div style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }}>
                                    <input
                                        id="cover-image-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                                {errors.coverImage && <span className="error-text">{errors.coverImage}</span>}
                            </div>
                        </section>

                        {/* Metadata Section */}
                        <section className="form-section">
                            <h3>Metadata</h3>

                            <div className="form-group full-width">
                                <label>Indexed In</label>
                                <div className="checkbox-group">
                                    {INDEXED_DATABASES.map((db) => (
                                        <label key={db} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.indexedIn.includes(db)}
                                                onChange={() => handleIndexedInToggle(db)}
                                            />
                                            <span>{db}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.indexedIn && <span className="error-text">{errors.indexedIn}</span>}
                            </div>

                            <div className="form-group full-width">
                                <label>Keywords</label>
                                <div className="keyword-input-container">
                                    <input
                                        type="text"
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                                        placeholder="Type a keyword and press Enter"
                                        className={errors.keywords ? 'input-error' : ''}
                                    />
                                    <button type="button" onClick={handleAddKeyword} className="btn-add-keyword">
                                        Add
                                    </button>
                                </div>
                                <div className="keywords-list">
                                    {formData.keywords.map((keyword) => (
                                        <span key={keyword} className="keyword-tag">
                                            {keyword}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveKeyword(keyword)}
                                                className="remove-keyword"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                {errors.keywords && <span className="error-text">{errors.keywords}</span>}
                            </div>

                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className={errors.description ? 'input-error' : ''}
                                    placeholder="Enter book description or abstract"
                                    rows={4}
                                />
                                {errors.description && <span className="error-text">{errors.description}</span>}
                            </div>
                        </section>

                        {/* Pricing Section */}
                        <section className="form-section">
                            <h3>Pricing</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Soft Copy Price (₹) *</label>
                                    <input
                                        type="number"
                                        value={formData.pricing.softCopyPrice || ''}
                                        onChange={(e) => handlePricingChange('softCopyPrice', e.target.value)}
                                        onBlur={() => handleBlur('softCopyPrice')}
                                        className={errors.softCopyPrice ? 'input-error' : ''}
                                        placeholder="499"
                                        min="0"
                                        step="0.01"
                                    />
                                    {errors.softCopyPrice && <span className="error-text">{errors.softCopyPrice}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Hard Copy Price (₹) *</label>
                                    <input
                                        type="number"
                                        value={formData.pricing.hardCopyPrice || ''}
                                        onChange={(e) => handlePricingChange('hardCopyPrice', e.target.value)}
                                        onBlur={() => handleBlur('hardCopyPrice')}
                                        className={errors.hardCopyPrice ? 'input-error' : ''}
                                        placeholder="999"
                                        min="0"
                                        step="0.01"
                                    />
                                    {errors.hardCopyPrice && <span className="error-text">{errors.hardCopyPrice}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Hard + Soft Copy Price (₹) *</label>
                                    <input
                                        type="number"
                                        value={formData.pricing.bundlePrice || ''}
                                        onChange={(e) => handlePricingChange('bundlePrice', e.target.value)}
                                        onBlur={() => handleBlur('bundlePrice')}
                                        className={errors.bundlePrice ? 'input-error' : ''}
                                        placeholder="1299"
                                        min="0"
                                        step="0.01"
                                    />
                                    {errors.bundlePrice && <span className="error-text">{errors.bundlePrice}</span>}
                                </div>
                            </div>
                        </section>

                        {/* Selling Links Section */}
                        <section className="form-section">
                            <h3>External Selling Links (Optional)</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Google Books Link</label>
                                    <input
                                        type="url"
                                        value={formData.googleLink}
                                        onChange={(e) => handleInputChange('googleLink', e.target.value)}
                                        onBlur={() => handleBlur('googleLink')}
                                        className={errors.googleLink ? 'input-error' : ''}
                                        placeholder="https://books.google.com/..."
                                    />
                                    {errors.googleLink && <span className="error-text">{errors.googleLink}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Flipkart Link</label>
                                    <input
                                        type="url"
                                        value={formData.flipkartLink}
                                        onChange={(e) => handleInputChange('flipkartLink', e.target.value)}
                                        onBlur={() => handleBlur('flipkartLink')}
                                        className={errors.flipkartLink ? 'input-error' : ''}
                                        placeholder="https://www.flipkart.com/..."
                                    />
                                    {errors.flipkartLink && <span className="error-text">{errors.flipkartLink}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Amazon Link</label>
                                    <input
                                        type="url"
                                        value={formData.amazonLink}
                                        onChange={(e) => handleInputChange('amazonLink', e.target.value)}
                                        onBlur={() => handleBlur('amazonLink')}
                                        className={errors.amazonLink ? 'input-error' : ''}
                                        placeholder="https://www.amazon.in/..."
                                    />
                                    {errors.amazonLink && <span className="error-text">{errors.amazonLink}</span>}
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="publishing-modal-footer">
                        <button type="button" className="btn-cancel" onClick={onCancel} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-publish" disabled={loading}>
                            {loading ? 'Publishing...' : 'Publish Book'}
                        </button>
                    </div>
                </form>
            </div >

            {/* Image Cropper Modal */}
            {
                showCropper && originalImage && (
                    <ImageCropper
                        image={originalImage}
                        onCropComplete={handleCropComplete}
                        onCancel={() => setShowCropper(false)}
                    />
                )
            }
        </div >,
        document.body
    );
};

export default TextBookPublishingForm;
