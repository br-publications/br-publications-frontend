import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search as SearchIcon, Calendar, User, BookOpen } from 'lucide-react';

interface SearchProps {
  isOpen: boolean;
  onClose: () => void;
}

type PublicationType = 'book-chapter' | 'text-books' | 'conference';

const PUBLICATION_TYPES: { value: PublicationType; label: string; icon: string }[] = [
  { value: 'book-chapter', label: 'Book Chapter', icon: '📖' },
  { value: 'text-books', label: 'Text Books', icon: '📚' },
  { value: 'conference', label: 'Conference', icon: '🎤' },
];

const Search: React.FC<SearchProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [publicationType, setPublicationType] = useState<PublicationType>('book-chapter');
  const [publishedAfter, setPublishedAfter] = useState('');
  const [publishedBefore, setPublishedBefore] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [typeError, setTypeError] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasData =
    searchQuery.trim() !== '' ||
    publishedAfter !== '' ||
    publishedBefore !== '' ||
    author.trim() !== '' ||
    subject !== '';

  const handleClear = () => {
    setSearchQuery('');
    setPublishedAfter('');
    setPublishedBefore('');
    setAuthor('');
    setSubject('');
    setTypeError(false);

    // After clearing state, trigger navigation with empty filters
    // Prepare the state payload for the navigate call
    const statePayload = {
      searchQuery: '', // Clear search query
      author: '',      // Clear author
      publishedAfter: '', // Clear published after date
      publishedBefore: '', // Clear published before date
      category: 'All', // Reset category to 'All'
      activeTab: 'All' // Assuming 'All' is a default active tab, adjust if needed
    };

    if (publicationType === 'book-chapter') {
      navigate('/bookchapters', { state: statePayload });
    } else if (publicationType === 'text-books') {
      navigate('/books', { state: statePayload });
    } else if (publicationType === 'conference') {
      navigate('/bookchapters', { state: statePayload });
    }

    onClose();
  };

  const handleSearch = () => {
    if (!hasData) return;

    const trimmedQuery = searchQuery.trim();
    // Basic ISBN detection (9-13 digits, allowing hyphens)
    const isbnRegex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;
    const isIsbn = isbnRegex.test(trimmedQuery);

    if (isIsbn) {
      navigate(`/product/find/${trimmedQuery}`);
      onClose();
      return;
    }

    const statePayload = {
      searchQuery: trimmedQuery,
      author: author.trim(),
      publishedAfter: publishedAfter,
      publishedBefore: publishedBefore,
      category: subject !== '' ? subject : 'All',
    };

    if (publicationType === 'book-chapter') {
      navigate('/bookchapters', { state: statePayload });
    } else if (publicationType === 'text-books') {
      navigate('/books', { state: statePayload });
    } else if (publicationType === 'conference') {
      // Conference page — navigate and pass state (extend when conference page is added)
      navigate('/bookchapters', { state: statePayload });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex justify-center items-start pt-[40px] px-4 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white w-full max-w-[600px] rounded-lg shadow-2xl p-4 relative animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-[#1e5292] transition-colors"
          aria-label="Close search"
        >
          <X size={20} />
        </button>

        <h2 className="text-base font-bold text-[#1e5292] mb-3 border-b pb-1">Search Repository</h2>

        {/* Publication Type Selector — mandatory */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
            <BookOpen size={14} />
            Publication Type <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {PUBLICATION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setPublicationType(type.value);
                  setTypeError(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 font-medium text-xs transition-all duration-200 ${publicationType === type.value
                  ? 'border-[#1e5292] bg-[#1e5292] text-white shadow-md'
                  : 'border-gray-200 text-gray-600 hover:border-[#1e5292]/50 hover:bg-blue-50'
                  }`}
              >
                <span>{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
          {typeError && (
            <p className="text-red-500 text-[10px] mt-1">Please select a publication type before searching.</p>
          )}
        </div>

        {/* Main Search Input */}
        <div className="flex mb-4 border-2 border-[#1e5292] rounded-md overflow-hidden shadow-sm">
          <div
            className="flex-1 flex"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && hasData) {
                handleSearch();
              }
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                publicationType === 'book-chapter'
                  ? 'Search book chapters...'
                  : publicationType === 'text-books'
                    ? 'Search textbooks...'
                    : 'Search conferences...'
              }
              className="flex-1 px-4 py-2 outline-none text-xs text-gray-700"
              autoFocus
            />
            <div
              className="bg-[#1e5292] px-4 flex items-center justify-center cursor-pointer hover:bg-[#163e70] transition-colors"
              onClick={() => hasData && handleSearch()}
            >
              <SearchIcon className="text-white" size={18} />
            </div>
          </div>
        </div>

        {/* Advanced Search Section */}
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <h3 className="text-sm font-semibold text-[#1e5292] mb-2 flex items-center gap-2">
            Advanced Search Options
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Calendar size={14} /> Published After
              </label>
              <input
                type="date"
                value={publishedAfter}
                onChange={(e) => setPublishedAfter(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 outline-none text-xs focus:border-[#1e5292] focus:ring-1 focus:ring-[#1e5292]/20 transition-all"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Calendar size={14} /> Published Before
              </label>
              <input
                type="date"
                value={publishedBefore}
                onChange={(e) => setPublishedBefore(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 outline-none text-xs focus:border-[#1e5292] focus:ring-1 focus:ring-[#1e5292]/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="flex flex-col gap-0.5">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <User size={14} /> By Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
                className="border border-gray-300 rounded px-2 py-1.5 outline-none text-xs focus:border-[#1e5292] focus:ring-1 focus:ring-[#1e5292]/20 transition-all"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <BookOpen size={14} /> Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 outline-none text-xs focus:border-[#1e5292] focus:ring-1 focus:ring-[#1e5292]/20 transition-all bg-white"
              >
                <option value="">Select Subject</option>
                <option value="Engineering & Management">Engineering &amp; Management</option>
                <option value="Medical & Health Sciences">Medical &amp; Health Sciences</option>
                <option value="Interdisciplinary Sciences">Interdisciplinary Sciences</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClear}
              disabled={!hasData}
              className={`px-4 py-2 rounded font-bold text-xs border transition-all duration-200 ${hasData
                ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                : 'border-gray-200 text-gray-300 cursor-not-allowed'
                }`}
            >
              Clear
            </button>
            <button
              onClick={handleSearch}
              disabled={!hasData}
              className={`flex-1 py-1.5 rounded font-bold text-white text-xs transition-all duration-200 flex items-center justify-center gap-2 ${hasData
                ? 'bg-[#1e5292] hover:bg-[#163e70] shadow-md transform hover:-translate-y-0.5'
                : 'bg-gray-400 cursor-not-allowed opacity-70'
                }`}
            >
              <SearchIcon size={16} />
              Search{' '}
              {publicationType === 'book-chapter'
                ? 'Book Chapters'
                : publicationType === 'text-books'
                  ? 'Text Books'
                  : 'Conferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;