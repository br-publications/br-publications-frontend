import React, { useState, useEffect } from 'react';
import type { PublishedBook } from '../../../services/publishedBookService';
import { Save } from 'lucide-react';
import AlertPopup from '../../../components/common/alertPopup';
import PhoneNumberInput from '../../../components/common/PhoneNumberInput';
import { isValidPhoneNumber } from '../../../utils/phoneValidation';
import '../publishing/textBookPublishingForm.css';

interface EditPublishedBookModalProps {
    book: PublishedBook;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, data: Partial<PublishedBook>) => Promise<void>;
}

const INDEXED_DATABASES = ['Scopus', 'Google Scholar', 'DBLP', 'Web of Science', 'IEEE Xplore'];

const EditPublishedBookModal: React.FC<EditPublishedBookModalProps> = ({ book, isOpen, onClose, onSave }) => {
    // We map PublishedBook to a detailed form state similar to PublishingFormData
    const [formData, setFormData] = useState<any>({
        title: '',
        authorFirstName: '',
        authorLastName: '',
        authorEmail: '',
        authorInstitute: '',
        authorPhone: '',
        coAuthors: [],
        isbn: '',
        doi: '',
        pages: 0,
        copyright: '',
        releaseDate: '',
        indexedIn: [],
        keywords: [],
        category: '',
        description: '',
        pricing: { softCopyPrice: 0, hardCopyPrice: 0, bundlePrice: 0 },
        googleLink: '',
        flipkartLink: '',
        amazonLink: ''
    });

    const [loading, setLoading] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    useEffect(() => {
        if (book) {
            // Parse Author Name (Simple assumption: First Last)
            const authorParts = (book.author || '').split(' ');
            const authorLastName = authorParts.length > 1 ? authorParts.pop() : '';
            const authorFirstName = authorParts.join(' ');

            // Parse Co-Authors (Format: Name (Email, Institute))
            const coAuthorsList = book.coAuthors ? book.coAuthors.split(',').map(nameStr => {
                let name = nameStr.trim();
                let email = '';
                let institute = '';

                const match = name.match(/^(.*?)\s*\((.*?)\)$/);
                if (match) {
                    name = match[1].trim();
                    const details = match[2].split(',').map(s => s.trim());
                    const emailIndex = details.findIndex(d => d.includes('@'));
                    if (emailIndex !== -1) {
                        email = details[emailIndex];
                        details.splice(emailIndex, 1);
                    }
                    if (details.length > 0) {
                        institute = details[0];
                    }
                }

                const parts = name.split(' ');
                const lastName = parts.length > 1 ? parts.pop() || '' : '';
                const firstName = parts.join(' ');
                return { firstName, lastName, email, institute, phoneNumber: '' };
            }) : [];

            const indexedInList = book.indexedIn ? book.indexedIn.split(',').map(s => s.trim()) : [];

            setFormData({
                title: book.title || '',
                authorFirstName: authorFirstName || '',
                authorLastName: authorLastName || '',
                authorEmail: '', 
                authorInstitute: '', 
                authorPhone: '', 
                coAuthors: coAuthorsList,
                isbn: book.isbn || '',
                doi: book.doi || '',
                pages: book.pages || 0,
                copyright: book.copyright || '',
                releaseDate: book.releaseDate || '',
                indexedIn: indexedInList,
                keywords: [],
                category: book.category || '',
                description: book.description || '',
                pricing: book.pricing || { softCopyPrice: 0, hardCopyPrice: 0, bundlePrice: 0 },
                googleLink: book.googleLink || '',
                flipkartLink: book.flipkartLink || '',
                amazonLink: book.amazonLink || ''
            });
        }
    }, [book, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handlePricingChange = (field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            pricing: { ...prev.pricing, [field]: parseFloat(value) || 0 }
        }));
    };

    const handleCoAuthorChange = (index: number, field: string, value: string) => {
        const newCoAuthors = [...formData.coAuthors];
        newCoAuthors[index] = { ...newCoAuthors[index], [field]: value };
        handleInputChange('coAuthors', newCoAuthors);
    };

    const addCoAuthor = () => {
        if (formData.coAuthors.length < 6) {
            handleInputChange('coAuthors', [...formData.coAuthors, { firstName: '', lastName: '', email: '', institute: '', phoneNumber: '' }]);
        }
    };

    const removeCoAuthor = (index: number) => {
        const newCoAuthors = [...formData.coAuthors];
        newCoAuthors.splice(index, 1);
        handleInputChange('coAuthors', newCoAuthors);
    };

    const toggleIndexedIn = (db: string) => {
        const current = formData.indexedIn || [];
        const newIndexedIn = current.includes(db)
            ? current.filter((item: string) => item !== db)
            : [...current, db];
        handleInputChange('indexedIn', newIndexedIn);
    };

    const validateForm = (): boolean => {
        const { title, pricing, pages, copyright, releaseDate, category } = formData;

        if (!title.trim()) {
            setAlertConfig({ isOpen: true, type: 'warning', title: 'Missing Field', message: 'Book Title is required' });
            return false;
        }
        if (!category.trim()) {
            setAlertConfig({ isOpen: true, type: 'warning', title: 'Missing Field', message: 'Category is required' });
            return false;
        }
        if (!copyright.trim()) {
            setAlertConfig({ isOpen: true, type: 'warning', title: 'Missing Field', message: 'Copyright Year is required' });
            return false;
        }
        if (!releaseDate) {
            setAlertConfig({ isOpen: true, type: 'warning', title: 'Missing Field', message: 'Release Date is required' });
            return false;
        }
        if (!pages || pages <= 0) {
            setAlertConfig({ isOpen: true, type: 'warning', title: 'Invalid Value', message: 'Pages must be greater than 0' });
            return false;
        }
        if (!pricing.softCopyPrice || pricing.softCopyPrice <= 0) {
            setAlertConfig({ isOpen: true, type: 'warning', title: 'Invalid Price', message: 'Soft Copy Price is mandatory and must be greater than 0' });
            return false;
        }
        if (!pricing.hardCopyPrice || pricing.hardCopyPrice <= 0) {
            setAlertConfig({ isOpen: true, type: 'warning', title: 'Invalid Price', message: 'Hard Copy Price is mandatory and must be greater than 0' });
            return false;
        }
        if (!pricing.bundlePrice || pricing.bundlePrice <= 0) {
            setAlertConfig({ isOpen: true, type: 'warning', title: 'Invalid Price', message: 'Bundle Price is mandatory and must be greater than 0' });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const updatedBook: Partial<PublishedBook> = {
                title: formData.title,
                author: `${formData.authorFirstName} ${formData.authorLastName}`.trim(),
                coAuthors: formData.coAuthors.map((ca: any) => {
                    const name = `${ca.firstName} ${ca.lastName}`.trim();
                    const details = [];
                    if (ca.email) details.push(ca.email);
                    if (ca.institute) details.push(ca.institute);
                    return details.length > 0 ? `${name} (${details.join(', ')})` : name;
                }).join(', '),
                isbn: formData.isbn,
                doi: formData.doi,
                pages: formData.pages,
                copyright: formData.copyright,
                releaseDate: formData.releaseDate,
                indexedIn: formData.indexedIn.join(', '),
                category: formData.category,
                description: formData.description,
                pricing: formData.pricing,
                googleLink: formData.googleLink,
                flipkartLink: formData.flipkartLink,
                amazonLink: formData.amazonLink
            };

            await onSave(book.id, updatedBook);
            onClose();
        } catch (error) {
            console.error(error);
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to save changes'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="publishing-form-modal">
            <div className="publishing-modal-overlay" onClick={onClose}></div>
            <div className="publishing-modal-container">
                <div className="publishing-modal-header">
                    <h2>Edit Book Details</h2>
                    <button onClick={onClose} className="publishing-close-btn">
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
                                    <label>Book Title *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter full book title"
                                        value={formData.title}
                                        onChange={e => handleInputChange('title', e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Author Details Card */}
                                <div className="author-card">
                                    <div className="author-header">
                                        <h4>Main Author Details</h4>
                                    </div>
                                    <div className="author-grid">
                                        <div className="form-group">
                                            <label>First Name *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., John"
                                                value={formData.authorFirstName}
                                                onChange={e => handleInputChange('authorFirstName', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Last Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Doe"
                                                value={formData.authorLastName}
                                                onChange={e => handleInputChange('authorLastName', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                value={formData.authorEmail}
                                                onChange={e => handleInputChange('authorEmail', e.target.value)}
                                                placeholder="e.g., author@example.com"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <PhoneNumberInput
                                                value={formData.authorPhone}
                                                onChange={value => handleInputChange('authorPhone', value)}
                                                className={formData.authorPhone && !isValidPhoneNumber(formData.authorPhone) ? 'input-error' : ''}
                                            />
                                            {formData.authorPhone && !isValidPhoneNumber(formData.authorPhone) && (
                                                <p className="error-text">Invalid phone (min 10 digits)</p>
                                            )}
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Institute</label>
                                            <input
                                                type="text"
                                                value={formData.authorInstitute}
                                                onChange={e => handleInputChange('authorInstitute', e.target.value)}
                                                placeholder="e.g., University/Institute Name"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Co-Authors Section */}
                                <div className="form-group full-width">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0 }}>Co-Authors</h4>
                                        <button
                                            type="button"
                                            onClick={addCoAuthor}
                                            disabled={formData.coAuthors.length >= 6}
                                            className="btn-add-keyword"
                                        >
                                            {formData.coAuthors.length >= 6 ? 'Max Reached (6)' : '+ Add Co-Author'}
                                        </button>
                                    </div>

                                    {formData.coAuthors.map((author: any, index: number) => (
                                        <div key={index} className="author-card">
                                            <div className="author-header">
                                                <h5>Co-Author {index + 1}</h5>
                                                <button
                                                    type="button"
                                                    onClick={() => removeCoAuthor(index)}
                                                    className="remove-keyword"
                                                    title="Remove"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <div className="author-grid">
                                                <div className="form-group">
                                                    <label>First Name *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="First Name"
                                                        value={author.firstName}
                                                        onChange={e => handleCoAuthorChange(index, 'firstName', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Last Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Last Name"
                                                        value={author.lastName}
                                                        onChange={e => handleCoAuthorChange(index, 'lastName', e.target.value)}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Email</label>
                                                    <input
                                                        type="email"
                                                        placeholder="e.g., coauthor@example.com"
                                                        value={author.email}
                                                        onChange={e => handleCoAuthorChange(index, 'email', e.target.value)}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Phone Number</label>
                                                    <PhoneNumberInput
                                                        value={author.phoneNumber || ''}
                                                        onChange={value => handleCoAuthorChange(index, 'phoneNumber', value)}
                                                        className={author.phoneNumber && !isValidPhoneNumber(author.phoneNumber) ? 'input-error' : ''}
                                                    />
                                                </div>
                                                <div className="form-group full-width">
                                                    <label>Institute</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Institute / University Name"
                                                        value={author.institute}
                                                        onChange={e => handleCoAuthorChange(index, 'institute', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Metadata Section */}
                        <section className="form-section">
                            <h3>Metadata</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>ISBN *</label>
                                    <input
                                        type="text"
                                        value={formData.isbn}
                                        onChange={e => handleInputChange('isbn', e.target.value)}
                                        placeholder="978-93-89876-01-2"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>DOI Number</label>
                                    <input
                                        type="text"
                                        value={formData.doi}
                                        onChange={e => handleInputChange('doi', e.target.value)}
                                        placeholder="10.3635/book.1.293570"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Pages *</label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 350"
                                        value={formData.pages || ''}
                                        onChange={e => handleInputChange('pages', parseInt(e.target.value) || 0)}
                                        required
                                        min="1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Copyright Year *</label>
                                    <input
                                        type="text"
                                        value={formData.copyright}
                                        onChange={e => handleInputChange('copyright', e.target.value)}
                                        placeholder="2024"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Release Date *</label>
                                    <input
                                        type="date"
                                        value={formData.releaseDate}
                                        onChange={e => handleInputChange('releaseDate', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Computer Science, Engineering"
                                        value={formData.category}
                                        onChange={e => handleInputChange('category', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Indexed In</label>
                                    <div className="checkbox-group">
                                        {INDEXED_DATABASES.map(db => (
                                            <label key={db} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.indexedIn.includes(db)}
                                                    onChange={() => toggleIndexedIn(db)}
                                                />
                                                <span>{db}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea
                                        placeholder="Provide a brief summary of the book content"
                                        value={formData.description}
                                        onChange={e => handleInputChange('description', e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Pricing Section */}
                        <section className="form-section">
                            <h3>Pricing</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Soft Copy Price *</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.pricing?.softCopyPrice || 0}
                                        onChange={e => handlePricingChange('softCopyPrice', e.target.value)}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Hard Copy Price *</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.pricing?.hardCopyPrice || 0}
                                        onChange={e => handlePricingChange('hardCopyPrice', e.target.value)}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bundle Price *</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.pricing?.bundlePrice || 0}
                                        onChange={e => handlePricingChange('bundlePrice', e.target.value)}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Online Selling Links Section */}
                        <section className="form-section">
                            <h3>Online Selling Links (Optional)</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Google Books Link</label>
                                    <input
                                        type="url"
                                        value={formData.googleLink}
                                        onChange={e => handleInputChange('googleLink', e.target.value)}
                                        placeholder="https://books.google.com/..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Flipkart Link</label>
                                    <input
                                        type="url"
                                        value={formData.flipkartLink}
                                        onChange={e => handleInputChange('flipkartLink', e.target.value)}
                                        placeholder="https://www.flipkart.com/..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Amazon Link</label>
                                    <input
                                        type="url"
                                        value={formData.amazonLink}
                                        onChange={e => handleInputChange('amazonLink', e.target.value)}
                                        placeholder="https://www.amazon.in/..."
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="publishing-modal-footer">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-publish">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
                <AlertPopup
                    isOpen={alertConfig.isOpen}
                    type={alertConfig.type}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                />
            </div>
        </div>
    );
};

export default EditPublishedBookModal;
