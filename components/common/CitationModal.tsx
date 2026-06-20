'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy } from 'lucide-react';
import './citationModal.css';

interface CitationItem {
  type: 'book' | 'chapter';
  title: string;
  authors: string | string[];
  editors?: string[];
  year?: string;
  publisher?: string;
  isbn?: string;
  doi?: string;
  pages?: string;
  containerTitle?: string;
}

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CitationItem;
}

/**
 * Normalizes author names by adding a space after initials if missing
 * e.g., "P.D.Sharma" -> "P. D. Sharma"
 */
const normalizeAuthorName = (name: string): string => {
  return name
    .replace(/\.([a-zA-Z])/g, '. $1')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Parses names from a string or string list into CSL-JSON compliant author/editor structure
 */
const parseAuthors = (authors: string | string[]): any[] => {
  let list: string[] = [];
  if (Array.isArray(authors)) {
    list = authors;
  } else if (typeof authors === 'string') {
    list = authors.split(/, and | and |,/).map(s => s.trim()).filter(Boolean);
  }

  return list.map(nameStr => {
    const name = normalizeAuthorName(nameStr);
    if (!name) return {};
    const parts = name.split(/\s+/);
    if (parts.length > 1) {
      const family = parts[parts.length - 1];
      const given = parts.slice(0, parts.length - 1).join(' ');
      return { family, given };
    }
    return { literal: name };
  });
};

/**
 * Resolves the Cite constructor from window.Cite or window.require('citation-js')
 */
const getCite = () => {
  const w = window as any;
  if (w.Cite) return w.Cite;
  if (typeof w.require === 'function') {
    try {
      const mod = w.require('citation-js');
      if (mod) {
        if (typeof mod === 'function') return mod;
        if (mod.Cite) return mod.Cite;
      }
    } catch (e) {
      console.warn('require("citation-js") failed:', e);
    }
  }
  return null;
};

const CitationModal: React.FC<CitationModalProps> = ({ isOpen, onClose, item }) => {
  const [style, setStyle] = useState<string>('mla');
  const [loadingStyle, setLoadingStyle] = useState<boolean>(false);
  const [citationHtml, setCitationHtml] = useState<string>('');
  const [citationText, setCitationText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLibraryReady, setIsLibraryReady] = useState<boolean>(!!getCite());

  // Dynamically load Citation.js script if not loaded
  useEffect(() => {
    if (isOpen && !getCite()) {
      const existingScript = document.querySelector('script[src*="citation-js"]');
      if (existingScript) {
        // Script exists but not finished loading
        const interval = setInterval(() => {
          if (getCite()) {
            setIsLibraryReady(true);
            clearInterval(interval);
          }
        }, 100);
        return () => clearInterval(interval);
      } else {
        // Inject script dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/citation-js/build/citation.min.js';
        script.async = true;
        script.onload = () => setIsLibraryReady(true);
        script.onerror = () => setError('Failed to load citation library.');
        document.head.appendChild(script);
      }
    } else if (isOpen) {
      setIsLibraryReady(true);
    }
  }, [isOpen]);

  // Generate citation dynamically when style or item properties update
  useEffect(() => {
    if (!isOpen || !isLibraryReady) return;

    const generateCitation = async () => {
      const Cite = getCite();
      if (!Cite) {
        setError('Citation library is not ready.');
        return;
      }

      try {
        setError(null);
        const templates = Cite.plugins.config.get('@csl').templates;

        // Dynamically fetch and register external CSL styles if not already cached
        if (style === 'mla' && !templates.has('mla')) {
          setLoadingStyle(true);
          const res = await fetch('https://cdn.jsdelivr.net/gh/citation-style-language/styles@master/modern-language-association.csl');
          if (!res.ok) throw new Error('Failed to fetch MLA style XML');
          const xml = await res.text();
          templates.add('mla', xml);
          setLoadingStyle(false);
        } else if (style === 'chicago' && !templates.has('chicago')) {
          setLoadingStyle(true);
          const res = await fetch('https://cdn.jsdelivr.net/gh/citation-style-language/styles@master/chicago-author-date.csl');
          if (!res.ok) throw new Error('Failed to fetch Chicago style XML');
          const xml = await res.text();
          templates.add('chicago', xml);
          setLoadingStyle(false);
        }

        // Map inputs to CSL-JSON structure
        const citeData: any = {
          type: item.type === 'chapter' ? 'chapter' : 'book',
          title: item.title,
          publisher: item.publisher || 'BR Publications',
        };

        if (item.authors && (Array.isArray(item.authors) ? item.authors.length > 0 : String(item.authors).trim().length > 0)) {
          citeData.author = parseAuthors(item.authors);
        }
        if (item.editors && item.editors.length > 0) {
          citeData.editor = parseAuthors(item.editors);
        }
        if (item.year) {
          const parsedYear = parseInt(item.year.replace(/[^\d]/g, ''));
          if (!isNaN(parsedYear)) {
            citeData.issued = { 'date-parts': [[parsedYear]] };
          }
        }
        if (item.isbn) {
          citeData.ISBN = item.isbn;
        }
        if (item.doi) {
          citeData.DOI = item.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
        }
        if (item.pages) {
          citeData.page = item.pages;
        }
        if (item.type === 'chapter' && item.containerTitle) {
          citeData['container-title'] = item.containerTitle;
        }

        // Create Cite processor
        const cite = new Cite(citeData);

        // Format outputs
        const html = cite.format('bibliography', {
          format: 'html',
          template: style,
          lang: 'en-US'
        });

        const text = cite.format('bibliography', {
          format: 'text',
          template: style,
          lang: 'en-US'
        });

        setCitationHtml(html);
        setCitationText(text);
      } catch (err) {
        console.error('Error generating citation:', err);
        setError('Failed to format citation. Please check the metadata or try another style.');
        setLoadingStyle(false);
      }
    };

    generateCitation();
  }, [isOpen, style, item, isLibraryReady]);

  // Reset local style state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStyle('mla');
      setCitationHtml('');
      setCitationText('');
      setError(null);
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (!citationText) return;
    
    // Fallback if formatting template output includes wrapping tags
    const cleanText = citationText.trim();
    
    navigator.clipboard.writeText(cleanText).then(() => {
      // Fire custom event which triggers the global toast/notification alert
      // window.dispatchEvent(new CustomEvent('app-alert', {
      //   detail: {
      //     type: 'success',
      //     title: 'Copied',
      //     message: 'Citation copied to clipboard!'
      //   }
      // }));
    }).catch(err => {
      console.error('Failed to copy citation:', err);
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = cleanText;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        window.dispatchEvent(new CustomEvent('app-alert', {
          detail: {
            type: 'success',
            title: 'Copied',
            message: 'Citation copied to clipboard!'
          }
        }));
      } catch (e) {
        alert('Could not copy citation automatically. Please select the text and copy.' + e);
      }
      document.body.removeChild(textarea);
    });
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="citation-overlay" onClick={handleOverlayClick}>
      <div className="citation-modal">
        {/* Modal Header */}
        <div className="citation-header">
          <h3>Cite this {item.type === 'chapter' ? 'Chapter' : 'Book'}</h3>
          <button className="citation-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="citation-body">
          <div className="citation-action-bar">
            <div className="citation-select-wrapper">
              <label htmlFor="citation-style-select">Format</label>
              <select
                id="citation-style-select"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={loadingStyle}
              >
                <option value="mla">MLA (Default)</option>
                <option value="apa">APA</option>
                <option value="chicago">Chicago</option>
                <option value="harvard1">Harvard</option>
                <option value="vancouver">Vancouver</option>
              </select>
            </div>

            <button
              className="citation-copy-btn"
              onClick={handleCopy}
              disabled={!citationText || loadingStyle || !!error}
              title="Copy citation to clipboard"
            >
              <Copy size={16} />
              <span>Copy Citation</span>
            </button>
          </div>

          <div className="citation-divider" />

          {/* Citation Output Box */}
          <div className="citation-display-container">
            {loadingStyle || !isLibraryReady ? (
              <div className="citation-loader-container">
                <div className="citation-spinner"></div>
                <p>Generating citation format...</p>
              </div>
            ) : error ? (
              <div className="citation-error-message">
                <p>{error}</p>
              </div>
            ) : (
              <div
                className="citation-formatted-content"
                dangerouslySetInnerHTML={{ __html: citationHtml }}
              />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CitationModal;
