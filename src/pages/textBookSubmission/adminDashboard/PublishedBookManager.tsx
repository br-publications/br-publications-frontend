import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // Unused
import * as publishedBookService from '../../../services/publishedBookService';
import type { PublishedBook } from '../../../services/publishedBookService';
import {
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Star,
    Image as ImageIcon
} from 'lucide-react';
import EditPublishedBookModal from './EditPublishedBookModal';
import UploadCoverModal from './UploadCoverModal';
import AlertPopup from '../../../components/common/alertPopup';
import { BookOpen } from 'lucide-react';

const PublishedBookManager: React.FC = () => {
    // const navigate = useNavigate(); // Unused
    const [books, setBooks] = useState<PublishedBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [categories, setCategories] = useState<string[]>(['All']);
    const [visibilityFilter, setVisibilityFilter] = useState<'All' | 'Visible' | 'Hidden'>('All');
    const [featuredFilter, setFeaturedFilter] = useState<'All' | 'Featured'>('All');

    // Pagination
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const data = await publishedBookService.getAllBooks({
                page,
                limit: 20,
                search: searchQuery,
                category: categoryFilter,
                includeHidden: true
            });

            // Client-side filtering for Visibility and Featured (since API might not support all combos yet)
            let filteredBooks = data.books;

            if (visibilityFilter === 'Visible') {
                filteredBooks = filteredBooks.filter(b => !b.isHidden);
            } else if (visibilityFilter === 'Hidden') {
                filteredBooks = filteredBooks.filter(b => b.isHidden);
            }

            if (featuredFilter === 'Featured') {
                filteredBooks = filteredBooks.filter(b => b.isFeatured);
            }

            setBooks(filteredBooks);
            setPagination(data.pagination);
            setError(null);
        } catch (err: any) {
            setError('Failed to fetch books');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const cats = await publishedBookService.getCategories();
            setCategories(cats);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchBooks();
        }, 300);
        return () => clearTimeout(debounce);
    }, [page, searchQuery, categoryFilter, visibilityFilter, featuredFilter]);

    // Modal State
    const [selectedBook, setSelectedBook] = useState<PublishedBook | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
        showCancel?: boolean;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

    const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, showCancel = false, onConfirm?: () => void) => {
        setAlertConfig({
            isOpen: true,
            type,
            title,
            message,
            showCancel,
            onConfirm
        });
    };

    // Actions
    const handleEditClick = (book: PublishedBook) => {
        setSelectedBook(book);
        setIsEditModalOpen(true);
    };

    const handleCoverClick = (book: PublishedBook) => {
        setSelectedBook(book);
        setIsCoverModalOpen(true);
    };

    const handleSaveBook = async (id: number, data: Partial<PublishedBook>) => {
        try {
            const updatedBook = await publishedBookService.updateBookDetails(id, data);
            setBooks(books.map(b => b.id === id ? updatedBook : b));
            setIsEditModalOpen(false);
            showAlert('success', 'Success', 'Book details updated successfully');
        } catch (err) {
            console.error('Failed to update book', err);
            showAlert('error', 'Error', 'Failed to update book details');
        }
    };

    const handleSaveCover = async (id: number, file: File) => {
        try {
            const result = await publishedBookService.updateBookCover(id, file);
            setBooks(books.map(b => b.id === id ? { ...b, coverImage: result.coverImage } : b));
            setIsCoverModalOpen(false);
            showAlert('success', 'Success', 'Cover image updated successfully');
        } catch (err) {
            console.error('Failed to update cover', err);
            showAlert('error', 'Error', 'Failed to update cover image');
        }
    };

    const handleToggleVisibility = async (book: PublishedBook) => {
        try {
            const updated = await publishedBookService.updateVisibility(book.id, !book.isHidden);
            setBooks(books.map(b => b.id === book.id ? { ...b, isHidden: updated.isHidden } : b));
            showAlert('success', 'Success', `Book is now ${updated.isHidden ? 'hidden' : 'visible'}`);
        } catch (err) {
            showAlert('error', 'Error', 'Failed to update visibility');
        }
    };

    const handleToggleFeatured = async (book: PublishedBook) => {
        try {
            const updated = await publishedBookService.updateFeatured(book.id, !book.isFeatured);
            setBooks(books.map(b => b.id === book.id ? { ...b, isFeatured: updated.isFeatured } : b));
            showAlert('success', 'Success', `Book is now ${updated.isFeatured ? 'featured' : 'removed from featured'}`);
        } catch (err) {
            showAlert('error', 'Error', 'Failed to update featured status');
        }
    };

    const handleDelete = async (bookId: number) => {
        showAlert(
            'warning',
            'Delete Book',
            'Are you sure you want to delete this book? This action cannot be undone.',
            true,
            async () => {
                try {
                    await publishedBookService.deleteBook(bookId);
                    setBooks(books.filter(b => b.id !== bookId));
                    closeAlert();
                    showAlert('success', 'Success', 'Book deleted successfully');
                } catch (err) {
                    closeAlert();
                    showAlert('error', 'Error', 'Failed to delete book');
                }
            }
        );
    };

    // Render Helper
    const StatusBadge = ({ isHidden }: { isHidden: boolean }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isHidden ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
            }`}>
            {isHidden ? 'Hidden' : 'Visible'}
        </span>
    );

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <div>
                    <h1 className="text-base font-bold text-gray-900">Published Library Manager</h1>
                    <p className="text-sm text-gray-500">Manage visibility, featured status, and book details.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium text-[12px] flex items-center gap-2">
                    <BookOpen size={16} />
                    Total Books: {pagination.total}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search by title, ISBN, author..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Visibility:</span>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        {['All', 'Visible', 'Hidden'].map((opt) => (
                            <button
                                key={opt}
                                // @ts-ignore
                                onClick={() => setVisibilityFilter(opt)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${visibilityFilter === opt ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Featured:</span>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        {['All', 'Featured'].map((opt) => (
                            <button
                                key={opt}
                                // @ts-ignore
                                onClick={() => setFeaturedFilter(opt)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${featuredFilter === opt ? 'bg-white shadow text-amber-600' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : error ? (
                <div className="text-center py-6 text-red-600 bg-white rounded-lg border border-red-200">
                    {error}
                    <button onClick={fetchBooks} className="ml-2 underline text-red-700">Retry</button>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {books.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                            No published books found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    books.map((book) => (
                                        <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-2">
                                                <div className="flex items-center">
                                                    <div className="h-16 w-12 flex-shrink-0 mr-4 bg-gray-200 rounded overflow-hidden relative group">
                                                        {book.coverImage ? (
                                                            <img className="h-full w-full object-cover" src={book.coverImage} alt="" />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full w-full text-gray-400">
                                                                <ImageIcon size={20} />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                                            <button
                                                                onClick={() => handleCoverClick(book)}
                                                                className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
                                                                title="Change Cover"
                                                            >
                                                                <Edit2 size={20} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{book.title}</div>
                                                        <div className="text-sm text-gray-500">{book.author}</div>
                                                        <div className="text-xs text-gray-400 mt-0.5">ISBN: {book.isbn}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                {book.category}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge isHidden={book.isHidden} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleFeatured(book)}
                                                    className={`p-1 rounded-full transition-colors ${book.isFeatured ? 'text-amber-400 hover:text-amber-500' : 'text-gray-300 hover:text-gray-400'
                                                        }`}
                                                    title={book.isFeatured ? "Remove from Carousel" : "Add to Carousel"}
                                                >
                                                    <Star size={20} fill={book.isFeatured ? "currentColor" : "none"} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleVisibility(book)}
                                                        className={`p-1.5 rounded-md transition-colors ${book.isHidden
                                                            ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                            : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                                                            }`}
                                                        title={book.isHidden ? "Show in Library" : "Hide from Library"}
                                                    >
                                                        {book.isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>

                                                    <button
                                                        onClick={() => handleEditClick(book)}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                        title="Edit Details"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(book.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Delete Book"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-4">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <button
                        disabled={page === pagination.totalPages}
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
            {selectedBook && (
                <EditPublishedBookModal
                    book={selectedBook}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveBook}
                />
            )}
            {selectedBook && (
                <UploadCoverModal
                    book={selectedBook}
                    isOpen={isCoverModalOpen}
                    onClose={() => setIsCoverModalOpen(false)}
                    onSave={handleSaveCover}
                />
            )}

            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={closeAlert}
                showCancel={alertConfig.showCancel}
                onConfirm={alertConfig.onConfirm}
            />
        </div>
    );
};

export default PublishedBookManager;
