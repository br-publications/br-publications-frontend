import React, { useState, useEffect } from 'react';
import {
    Edit, Trash2, Eye, EyeOff,
    Image as ImageIcon, Star, BookOpen, Upload
} from 'lucide-react';
import {
    getAllPublishedChapters,
    updatePublishedChapter,
    updateVisibility,
    updateFeatured,
    deletePublishedChapter,
    getCoverThumbnailUrl,
    updateChapterCover,
    type PublishedBookChapter
} from '../../../services/bookChapterPublishing.service';
import AlertPopup from '../../../components/common/alertPopup';
import EditPublishedChapterModal from './EditPublishedChapterModal';
import UploadChapterCoverModal from './UploadChapterCoverModal';

// Using 'any' for the chapter model temporarily to match rapid scaffolding
type PublishedChapter = any;

const PublishedChapterManager: React.FC = () => {
    // Data State
    const [chapters, setChapters] = useState<PublishedChapter[]>([]);
    const [categories] = useState<string[]>([
        'Engineering & Management',
        'Medical & Health Sciences',
        'Interdisciplinary Sciences'
    ]);
    const [loading, setLoading] = useState(true);

    // Filter & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
    const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'regular'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modal States
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<PublishedChapter | null>(null);
    // Cover Upload Modal State
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
    const [selectedChapterForCover, setSelectedChapterForCover] = useState<PublishedBookChapter | null>(null);

    // UI States
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

    const ITEMS_PER_PAGE = 10;

    const loadData = async () => {
        try {
            setLoading(true);
            const chaptersData = await getAllPublishedChapters({
                page: currentPage,
                limit: ITEMS_PER_PAGE,
                search: searchTerm,
                category: selectedCategory,
                includeHidden: true
            });

            setChapters(chaptersData.items || []);
            setTotalPages(chaptersData.pagination?.totalPages || 1);
            setTotalItems(chaptersData.pagination?.total || 0);
        } catch (error) {
            console.error('Failed to load chapters:', error);
            showAlert('error', 'Error', 'Failed to load published chapters');
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to update cover image'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentPage, searchTerm, selectedCategory]);

    const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, showCancel = false, onConfirm?: () => void) => {
        setAlertConfig({ isOpen: true, type, title, message, showCancel, onConfirm });
    };

    // Action Handlers
    const handleUpdateVisibility = async (id: number, currentStatus: boolean) => {
        try {
            await updateVisibility(id, !currentStatus);
            showAlert('success', 'Success', `Chapter is now ${!currentStatus ? 'hidden' : 'visible'}`);
            loadData();
        } catch (error) {
            showAlert('error', 'Error', 'Failed to update visibility');
        }
    };

    const handleUpdateCover = async (id: number, file: File) => {
        try {
            await updateChapterCover(id, file);
            setAlertConfig({
                isOpen: true,
                type: 'success',
                title: 'Updated',
                message: 'Cover image updated successfully.'
            });
            loadData();
        } catch (err) {
            console.error(err);
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to update cover image.'
            });
        }
    };

    const handleUpdateFeatured = async (id: number, currentStatus: boolean) => {
        try {
            await updateFeatured(id, !currentStatus);
            showAlert('success', 'Success', `Chapter is now ${!currentStatus ? 'featured' : 'unfeatured'}`);
            loadData();
        } catch (error) {
            showAlert('error', 'Error', 'Failed to update featured status');
        }
    };

    const confirmDelete = async (id: number) => {
        try {
            await deletePublishedChapter(id);
            showAlert('success', 'Success', 'Chapter deleted successfully');
            setSelectedChapter(null);
            loadData();
        } catch (error) {
            showAlert('error', 'Error', 'Failed to delete chapter');
        }
    };

    const handleDeleteChapter = async (chapter: PublishedChapter) => {
        showAlert(
            'warning',
            'Delete Chapter',
            `Are you sure you want to delete "${chapter.title}"? This action cannot be undone.`,
            true,
            () => confirmDelete(chapter.id)
        );
    };

    const handleSaveEdit = async (id: number, data: any) => {
        try {
            await updatePublishedChapter(id, data);
            showAlert('success', 'Success', 'Chapter updated successfully');
            loadData();
        } catch (error) {
            throw error; // Handled by modal
        }
    };



    // Derived Data
    const filteredChapters = chapters.filter(chapter => {
        if (visibilityFilter === 'visible' && chapter.isHidden) return false;
        if (visibilityFilter === 'hidden' && !chapter.isHidden) return false;
        if (featuredFilter === 'featured' && !chapter.isFeatured) return false;
        if (featuredFilter === 'regular' && chapter.isFeatured) return false;
        return true;
    });

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-[14px] font-bold text-gray-900">Published Chapters</h1>
                    <p className="text-gray-500 text-[12px] mt-1">Manage all published book chapters in the system</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium text-[12px] flex items-center gap-2">
                    <BookOpen size={16} />
                    Total Chapters: {totalItems}
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] relative">
                    <input
                        type="text"
                        placeholder="Search by title, author, or ISBN..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-8 pr-3 py-1.5 border rounded-md text-[12px] focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="border rounded-md px-2.5 py-1.5 text-[12px] focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <select
                        value={visibilityFilter}
                        onChange={(e) => setVisibilityFilter(e.target.value as any)}
                        className="border rounded-md px-2.5 py-1.5 text-[12px] focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Visibility</option>
                        <option value="visible">Visible Only</option>
                        <option value="hidden">Hidden Only</option>
                    </select>

                    <select
                        value={featuredFilter}
                        onChange={(e) => setFeaturedFilter(e.target.value as any)}
                        className="border rounded-md px-2.5 py-1.5 text-[12px] focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Types</option>
                        <option value="featured">Featured Only</option>
                        <option value="regular">Regular Only</option>
                    </select>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-2 font-medium text-gray-500">Book</th>
                                <th className="px-4 py-2 font-medium text-gray-500">Category</th>
                                <th className="px-4 py-2 font-medium text-gray-500">Status</th>
                                <th className="px-4 py-2 font-medium text-gray-500">Featured</th>
                                <th className="px-4 py-2 font-medium text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Loading chapters...
                                    </td>
                                </tr>
                            ) : filteredChapters.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        No chapters found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredChapters.map((chapter) => (
                                    <tr key={chapter.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="group relative h-12 w-9 bg-gray-100 rounded border flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedChapterForCover(chapter);
                                                        setIsCoverModalOpen(true);
                                                    }}
                                                >
                                                    {chapter.hasCoverImage ? (
                                                        <img
                                                            src={getCoverThumbnailUrl(chapter.id, 48, 64, chapter.updatedAt ? new Date(chapter.updatedAt).getTime() : undefined)}
                                                            alt="Cover"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,...';
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <ImageIcon className="text-gray-400" size={20} />
                                                    )}
                                                    <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Upload className="text-white" size={14} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-[12px] text-gray-900 line-clamp-2">{chapter.title}</div>
                                                    <div className="text-gray-500 mt-0.5 text-[10px]">{chapter.author}</div>
                                                    <div className="flex gap-2 mt-1 text-[10px] font-mono text-gray-400">
                                                        <span>ISBN: {chapter.isbn || 'N/A'}</span>
                                                        {chapter.doi && <span>DOI: {chapter.doi}</span>}
                                                    </div>
                                                    {chapter.keywords && chapter.keywords.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {chapter.keywords.map((kw: string, i: number) => (
                                                                <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] border border-gray-200">
                                                                    {kw}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-gray-600 font-medium">{chapter.category || '–'}</span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${chapter.isHidden
                                                ? 'bg-gray-100 text-gray-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                {chapter.isHidden ? 'Hidden' : 'Visible'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() => handleUpdateFeatured(chapter.id, chapter.isFeatured)}
                                                className={`p-1 transition-colors ${chapter.isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-gray-400'}`}
                                                title={chapter.isFeatured ? 'Unfeature' : 'Feature'}
                                            >
                                                <Star size={16} fill={chapter.isFeatured ? 'currentColor' : 'none'} />
                                            </button>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleUpdateVisibility(chapter.id, chapter.isHidden)}
                                                    className={`p-1 transition-colors ${chapter.isHidden ? 'text-gray-400 hover:text-gray-500' : 'text-blue-600 hover:text-blue-700'}`}
                                                    title={chapter.isHidden ? 'Make Visible' : 'Hide Chapter'}
                                                >
                                                    {chapter.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedChapter(chapter);
                                                        setEditModalOpen(true);
                                                    }}
                                                    className="p-1 text-gray-300 transition-colors"
                                                    title="Edit Details"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteChapter(chapter)}
                                                    className="p-1 text-gray-300 transition-colors"
                                                    title="Delete Chapter"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="border-t px-4 py-3 flex items-center justify-between text-[12px]">
                        <div className="text-gray-500">
                            Showing page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="px-2.5 py-1 border rounded disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="px-2.5 py-1 border rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedChapter && (
                <EditPublishedChapterModal
                    book={selectedChapter}
                    isOpen={editModalOpen}
                    onClose={() => { setEditModalOpen(false); setSelectedChapter(null); }}
                    onSave={handleSaveEdit}
                />
            )}

            <UploadChapterCoverModal
                isOpen={isCoverModalOpen}
                book={selectedChapterForCover}
                onClose={() => setIsCoverModalOpen(false)}
                onSave={handleUpdateCover}
            />

            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                showCancel={alertConfig.showCancel}
                onConfirm={() => {
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                    setAlertConfig(prev => ({ ...prev, isOpen: false }));
                }}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default PublishedChapterManager;
