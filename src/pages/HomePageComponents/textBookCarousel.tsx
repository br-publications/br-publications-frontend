import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './textBookCarousel.css';
import { toSlug } from '../../utils/stringUtils';

// Book type definition
interface Book {
    id?: number;
    title: string;
    author: string;
    image: string;
    coverImage?: string; // Need coverImage for productBooksDetail compatibility
}

export default function TextBookCarousel() {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(4);
    const [books, setBooks] = useState<Book[]>([]);
    const [isPaused, setIsPaused] = useState(false);

    // Load books from API
    useEffect(() => {
        const loadBooks = async () => {
            try {
                const { default: productBooksService } = await import('../../services/productbooksservice');
                const response = await productBooksService.getAllBooks({ featured: true, limit: 10 });

                // Take up to 10 books for the carousel
                const booksData = response.slice(0, 10);

                const apiBooks = booksData.map(book => ({
                    ...book,
                    image: book.coverImage || '/placeholder-book.png',
                    coverImage: book.coverImage || '/placeholder-book.png'
                }));

                setBooks(apiBooks);
            } catch (error) {
                console.error('Error loading text books:', error);
            }
        };

        loadBooks();
    }, []);

    // Calculate visible count based on window width
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            // Matches textBookCarousel.css breakpoints
            if (width < 480) setVisibleCount(1);
            else if (width < 768) setVisibleCount(2);
            else if (width < 1024) setVisibleCount(3);
            else if (width < 1280) setVisibleCount(4);
            else setVisibleCount(5);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-rotate carousel
    useEffect(() => {
        if (isPaused) return;

        if (books.length <= visibleCount) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const maxIndex = books.length - visibleCount;
                if (maxIndex <= 0) return 0;
                return prevIndex >= maxIndex ? 0 : prevIndex + 1;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [books.length, visibleCount, isPaused]);

    // Gap between items in pixels (must match CSS .textbook-carousel-track gap)
    const gap = 10;

    if (books.length === 0) {
        return null; // Don't render if no books
    }

    const handleBookClick = (book: Book) => {
        const slug = toSlug(book.title);
        navigate(`/book/${book.id}/${slug}`, {
            state: { book }
        });
    };

    return (
        <section className="textbook-carousel-section">
            <div className="textbook-carousel-container">
                {/* Section Header */}
                <h2 className="textbook-carousel-title">
                    Text Books
                </h2>
                <div className="textbook-carousel-underline"></div>

                {/* Carousel Container */}
                <div
                    className="textbook-carousel-wrapper"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div
                        className="textbook-carousel-track"
                        style={{ transform: `translateX(calc(-${currentIndex} * (100% + ${gap}px) / ${visibleCount}))` }}
                    >
                        {books.map((book, index) => (
                            <div key={index} className="textbook-card">
                                {/* Book Cover */}
                                <div className="textbook-cover">
                                    <img
                                        src={book.image}
                                        alt={book.title}
                                        className="textbook-image"
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => {
                                            e.currentTarget.src = '/placeholder-book.png';
                                        }}
                                    />
                                </div>

                                {/* Book Info */}
                                <div className="textbook-info">
                                    <h3 className="textbook-title">
                                        {book.title}
                                    </h3>
                                    <p className="textbook-author">
                                        by {book.author}
                                    </p>

                                    {/* Buttons */}
                                    <div className="textbook-actions">
                                        <button
                                            className="textbook-action-btn"
                                            onClick={() => handleBookClick(book)}
                                        >
                                            Preview
                                        </button>
                                        <button
                                            className="textbook-action-btn"
                                            onClick={() => handleBookClick(book)}
                                        >
                                            Buy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Dots */}
                {books.length > visibleCount && (
                    <div className="textbook-carousel-dots">
                        {Array.from({ length: Math.max(0, books.length - visibleCount + 1) }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`textbook-dot ${currentIndex === index ? 'active' : ''}`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
