import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './bookCarousel.css';
import { toSlug } from '../../utils/stringUtils';

// Book type definition
interface Book {
  id?: number;
  title: string;
  author: string;
  editors?: string[];
  image: string;
}

export default function BookCarousel() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [books, setBooks] = useState<Book[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Load books from API
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const { getAllPublishedChapters, getCoverUrl } = await import('../../services/bookChapterPublishing.service');
        const response = await getAllPublishedChapters({ featured: true, limit: 10 });

        const items = response.items || [];
        const apiBooks = items.map((book: any) => ({
          title: book.title || 'Untitled',
          author: book.author || 'Unknown Author',
          editors: book.editors || [],
          image: book.hasCoverImage ? getCoverUrl(book.id) : '/placeholder-book.png',
          id: book.id // Store ID for potential navigation
        }));

        setBooks(apiBooks);
      } catch (error) {
        console.error('Error loading featured books:', error);
      }
    };

    loadBooks();
  }, []);

  // Calculate visible count based on window width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
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

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = books.length - visibleCount;
        if (maxIndex <= 0) return 0;
        return prevIndex >= maxIndex ? 0 : prevIndex + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [books.length, visibleCount, isPaused]);

  // Gap between items in pixels (must match CSS .carousel-track gap)
  const gap = 10;

  const handleBookClick = (book: Book) => {
    const slug = toSlug(book.title);
    navigate(`/bookchapter/${book.id}/${slug}`, {
      state: { book }
    });
  };

  return (
    <section className="book-carousel-section">
      <div className="carousel-container">
        {/* Section Header */}
        <h2 className="carousel-title">
          Academic Books
        </h2>
        <div className="book-carousel-underline"></div>

        {/* Carousel Container */}
        <div
          className="carousel-wrapper"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="carousel-track"
            style={{ transform: `translateX(calc(-${currentIndex} * (100% + ${gap}px) / ${visibleCount}))` }}
          >
            {books.map((book, index) => (
              <div key={index} className="book-card">
                {/* Book Cover */}
                <div className="book-cover">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="book-image"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-book.png';
                    }}
                  />
                </div>

                {/* Book Info */}
                <div className="book-info">
                  <h3 className="book-title">
                    {book.title}
                  </h3>
                  {/* <p className="book-author">
                    by {book.author}
                  </p> */}
                  <p className="book-author">
                    {book.editors && book.editors.length > 0
                      ? `Editors: ${book.editors.join(', ')}`
                      : `Editors: ${book.author}`}
                  </p>

                  {/* Buttons */}
                  <div className="book-actions">
                    <button
                      className="action-btn"
                      onClick={() => handleBookClick(book)}
                    >
                      Preview
                    </button>
                    <button
                      className="action-btn"
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
          <div className="carousel-dots">
            {Array.from({ length: Math.max(0, books.length - visibleCount + 1) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`dot ${currentIndex === index ? 'active' : ''}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}