import React, { useState, useEffect } from 'react';
import type { PublishedBook } from '../../../services/publishedBookService';
import { X, Save } from 'lucide-react';
import AlertPopup from '../../../components/common/alertPopup';
import PhoneNumberInput from '../../../components/common/PhoneNumberInput';
import { isValidPhoneNumber } from '../../../utils/phoneValidation';

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
        // Default values
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

            // Parse Co-Authors (Comma separated string)
            // Model: string | null. Example: "John Doe, Jane Smith"
            // We want to map this to objects { firstName, lastName, ... } if possible, or just strings if we can't infer structure.
            // Since we don't store email/institute for co-authors in PublishedBook string field, we can only pre-fill names.
            const coAuthorsList = book.coAuthors ? book.coAuthors.split(',').map(name => {
                const parts = name.trim().split(' ');
                const lastName = parts.length > 1 ? parts.pop() : '';
                const firstName = parts.join(' ');
                return { firstName, lastName, email: '', institute: '', phoneNumber: '' };
            }) : [];

            // Parse Indexed In (Comma separated string)
            const indexedInList = book.indexedIn ? book.indexedIn.split(',').map(s => s.trim()) : [];

            setFormData({
                title: book.title || '',
                authorFirstName: authorFirstName || '',
                authorLastName: authorLastName || '',
                authorEmail: '', // Not stored in PublishedBook
                authorInstitute: '', // Not stored in PublishedBook
                authorPhone: '', // Not stored in PublishedBook
                coAuthors: coAuthorsList,
                isbn: book.isbn || '',
                doi: book.doi || '',
                pages: book.pages || 0,
                copyright: book.copyright || '',
                releaseDate: book.releaseDate || '',
                indexedIn: indexedInList,
                keywords: [], // Not clearly stored in PublishedBook top-level attributes, assuming empty or could fail if missing
                category: book.category || '',
                description: book.description || '',
                pricing: book.pricing || { softCopyPrice: 0, hardCopyPrice: 0, bundlePrice: 0 },
                googleLink: book.googleLink || '',
                flipkartLink: book.flipkartLink || '',
                amazonLink: book.amazonLink || ''
            });
        }
    }, [book]);

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

    // Co-Authors Handlers
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

    // Indexed In Handlers
    const toggleIndexedIn = (db: string) => {
        const current = formData.indexedIn || [];
        const newIndexedIn = current.includes(db)
            ? current.filter((item: string) => item !== db)
            : [...current, db];
        handleInputChange('indexedIn', newIndexedIn);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Reconstruct PublishedBook object from form data
            const updatedBook: Partial<PublishedBook> = {
                title: formData.title,
                author: `${formData.authorFirstName} ${formData.authorLastName}`.trim(),
                coAuthors: formData.coAuthors.map((ca: any) => `${ca.firstName} ${ca.lastName}`.trim()).join(', '),
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-3 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-sm font-semibold">Edit Book Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Book Information Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Book Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Book Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => handleInputChange('title', e.target.value)}
                                    className="w-full px-3 py-1.5 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    required
                                />
                            </div>

                            {/* Author Details */}
                            <div className="col-span-2 bg-gray-50 p-4 rounded-lg border">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Main Author Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            value={formData.authorFirstName}
                                            onChange={e => handleInputChange('authorFirstName', e.target.value)}
                                            className="w-full px-3 py-1.5 border rounded-md text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            value={formData.authorLastName}
                                            onChange={e => handleInputChange('authorLastName', e.target.value)}
                                            className="w-full px-3 py-1.5 border rounded-md text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Email (Display Only)</label>
                                        <input
                                            type="email"
                                            value={formData.authorEmail}
                                            onChange={e => handleInputChange('authorEmail', e.target.value)}
                                            className="w-full px-3 py-1.5 border rounded-md text-sm bg-gray-100"
                                            placeholder="Not stored in model"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Phone (Display Only)</label>
                                        <PhoneNumberInput
                                            value={formData.authorPhone}
                                            onChange={value => handleInputChange('authorPhone', value)}
                                            className={`w-full px-3 py-1.5 border rounded-md text-sm ${formData.authorPhone && !isValidPhoneNumber(formData.authorPhone) ? 'border-red-500' : ''}`}
                                            placeholder="Not stored in model"
                                        />
                                        {formData.authorPhone && !isValidPhoneNumber(formData.authorPhone) && (
                                            <p className="text-[10px] text-red-500 mt-0.5">Invalid phone number (min 10 digits)</p>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Institute (Display Only)</label>
                                        <input
                                            type="text"
                                            value={formData.authorInstitute}
                                            onChange={e => handleInputChange('authorInstitute', e.target.value)}
                                            className="w-full px-3 py-1.5 border rounded-md text-sm bg-gray-100"
                                            placeholder="Not stored in model"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Co-Authors Section */}
                            <div className="col-span-2">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-medium text-gray-700">Co-Authors</h4>
                                    <button
                                        type="button"
                                        onClick={addCoAuthor}
                                        disabled={formData.coAuthors.length >= 6}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        + Add Co-Author
                                    </button>
                                </div>

                                {formData.coAuthors.map((author: any, index: number) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg border mb-3 relative">
                                        <button
                                            type="button"
                                            onClick={() => removeCoAuthor(index)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                        >
                                            <X size={16} />
                                        </button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="First Name"
                                                    value={author.firstName}
                                                    onChange={e => handleCoAuthorChange(index, 'firstName', e.target.value)}
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Last Name"
                                                    value={author.lastName}
                                                    onChange={e => handleCoAuthorChange(index, 'lastName', e.target.value)}
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <PhoneNumberInput
                                                    value={author.phoneNumber || ''}
                                                    onChange={value => handleCoAuthorChange(index, 'phoneNumber', value)}
                                                    className={`w-full px-2 py-1 border rounded text-xs ${author.phoneNumber && !isValidPhoneNumber(author.phoneNumber) ? 'border-red-500' : ''}`}
                                                    placeholder="Phone Number (Optional)"
                                                />
                                                {author.phoneNumber && !isValidPhoneNumber(author.phoneNumber) && (
                                                    <p className="text-[10px] text-red-500 mt-0.5">Invalid phone number (min 10 digits)</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Metadata</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN *</label>
                                <input
                                    type="text"
                                    value={formData.isbn}
                                    onChange={e => handleInputChange('isbn', e.target.value)}
                                    className="w-full px-3 py-1.5 border rounded-md text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">DOI</label>
                                <input
                                    type="text"
                                    value={formData.doi}
                                    onChange={e => handleInputChange('doi', e.target.value)}
                                    className="w-full px-3 py-1.5 border rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Pages</label>
                                <input
                                    type="number"
                                    value={formData.pages}
                                    onChange={e => handleInputChange('pages', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-1.5 border rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Copyright Year</label>
                                <input
                                    type="text"
                                    value={formData.copyright}
                                    onChange={e => handleInputChange('copyright', e.target.value)}
                                    className="w-full px-3 py-1.5 border rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Release Date</label>
                                <input
                                    type="date"
                                    value={formData.releaseDate}
                                    onChange={e => handleInputChange('releaseDate', e.target.value)}
                                    className="w-full px-3 py-1.5 border rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={e => handleInputChange('category', e.target.value)}
                                    className="w-full px-3 py-1.5 border rounded-md text-sm"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Indexed In</label>
                                <div className="flex flex-wrap gap-2">
                                    {INDEXED_DATABASES.map(db => (
                                        <label key={db} className="inline-flex items-center space-x-2 mr-4">
                                            <input
                                                type="checkbox"
                                                checked={formData.indexedIn.includes(db)}
                                                onChange={() => toggleIndexedIn(db)}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{db}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => handleInputChange('description', e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Pricing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Soft Copy Price</label>
                                <input
                                    type="number"
                                    value={formData.pricing?.softCopyPrice || 0}
                                    onChange={e => handlePricingChange('softCopyPrice', e.target.value)}
                                    className="w-full px-3 py-1.5 border rounded-md text-sm"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Hard Copy Price</label>
                                <input
                                    type="number"
                                    value={formData.pricing?.hardCopyPrice || 0}
                                    onChange={e => handlePricingChange('hardCopyPrice', e.target.value)}
                                    className="w-full px-3 py-1.5 border rounded-md text-sm"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Bundle Price</label>
                                <input
                                    type="number"
                                    value={formData.pricing?.bundlePrice || 0}
                                    onChange={e => handlePricingChange('bundlePrice', e.target.value)}
                                    className="w-full px-3 py-1.5 border rounded-md text-sm"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Online Selling Links Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Online Selling Links (Optional)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Google Books Link</label>
                                <input
                                    type="url"
                                    value={formData.googleLink}
                                    onChange={e => handleInputChange('googleLink', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                    placeholder="https://books.google.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Flipkart Link</label>
                                <input
                                    type="url"
                                    value={formData.flipkartLink}
                                    onChange={e => handleInputChange('flipkartLink', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                    placeholder="https://www.flipkart.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Link</label>
                                <input
                                    type="url"
                                    value={formData.amazonLink}
                                    onChange={e => handleInputChange('amazonLink', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                    placeholder="https://www.amazon.in/..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-4 sticky bottom-0 bg-white z-10 p-3 -mx-4 -mb-4 rounded-b-lg">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div >
            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div >
    );
};

export default EditPublishedBookModal;
