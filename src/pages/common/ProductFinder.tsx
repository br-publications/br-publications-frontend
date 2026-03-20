import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productBooksService from '../../services/productbooksservice';
import bookChapterService from '../../services/bookChapterService';
import { Loader2, Search, BookX } from 'lucide-react';
import { toSlug } from '../../utils/stringUtils';

const ProductFinder: React.FC = () => {
    const { isbn } = useParams<{ isbn: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const findProduct = async () => {
            if (!isbn) {
                setError('No ISBN provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Normalize ISBN for robust matching
                const cleanIsbn = isbn.replace(/[\s-]/g, '');

                // Try finding in Textbooks first using the original ISBN string (to match DB formatting)
                const textbooks = await productBooksService.searchBooks({ query: isbn });
                if (textbooks.length > 0) {
                    const exactMatch = textbooks.find(b => 
                        b.isbn === isbn || (b.isbn && b.isbn.replace(/[\s-]/g, '') === cleanIsbn)
                    ) || textbooks[0];
                    
                    const slug = toSlug(exactMatch.title);
                    navigate(`/book/${exactMatch.id}/${slug}`, { replace: true, state: { book: exactMatch } });
                    return;
                }

                // If not found, try Book Chapters
                const chapters = await bookChapterService.searchBooks({ query: isbn });
                if (chapters.length > 0) {
                    const exactMatch = chapters.find(c => 
                        c.isbn === isbn || (c.isbn && c.isbn.replace(/[\s-]/g, '') === cleanIsbn)
                    ) || chapters[0];
                    
                    const slug = toSlug(exactMatch.title);
                    navigate(`/bookchapter/${exactMatch.id}/${slug}`, { replace: true, state: { book: exactMatch } });
                    return;
                }

                setError(`Product with ISBN ${isbn} not found.`);
            } catch (err) {
                console.error('Error finding product:', err);
                setError('Failed to find product. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        findProduct();
    }, [isbn, navigate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-[#1e5292] animate-spin" />
                <p className="text-gray-600 font-medium">Resolving product for ISBN: {isbn}...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            {error ? (
                <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-red-100 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookX className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
                    <p className="text-gray-600 mb-8">{error}</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="bg-[#1e5292] hover:bg-[#163e70] text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            <Search className="w-4 h-4" /> Go to Home Search
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ProductFinder;
