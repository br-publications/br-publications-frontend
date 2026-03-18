import { useState, useCallback } from 'react';
import BookTitleManager from './BookTitleManager';
import BookChapterManager from './BookChapterManager';
import EditorAssignmentManager from './EditorAssignmentManager';
import './bookManagement.css';

type View = 'titles' | 'chapters' | 'editors';

export interface ToastMsg {
    id: number;
    type: 'success' | 'error' | 'warn';
    message: string;
}

export interface BookTitleNav {
    id: number;
    title: string;
}

let toastSeq = 0;

export default function BookManagement() {
    const [view, setView] = useState<View>('titles');
    const [selectedBook, setSelectedBook] = useState<BookTitleNav | null>(null);
    const [toasts, setToasts] = useState<ToastMsg[]>([]);

    const addToast = useCallback((type: ToastMsg['type'], message: string) => {
        const id = ++toastSeq;
        setToasts((p) => [...p, { id, type, message }]);
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
    }, []);

    const navigateTo = (v: View, book?: BookTitleNav) => {
        setView(v);
        if (book) setSelectedBook(book);
    };

    const viewLabel: Record<View, string> = {
        titles: 'Book Titles',
        chapters: 'Chapter Management',
        editors: 'Editor Assignments',
    };

    return (
        <div className="bms-root">
            {/* ── Top bar ── */}
            <header className="bms-topbar">
                <div className="bms-topbar-title">
                    <div className="bms-topbar-icon">&#128218;</div>
                    <div>
                        <h1>Book Chapter Management System</h1>
                        <div className="bms-topbar-sub">Editorial Administration</div>
                    </div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'var(--ff-body)', fontStyle: 'italic' }}>
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </header>
            <div className="bms-topbar-rule" />

            {/* ── Layout ── */}
            <div className="bms-layout">

                {/* Main */}
                <main className="bms-main">
                    <div className="bms-content">
                        {view === 'titles' && (
                            <BookTitleManager
                                addToast={addToast}
                                onManageChapters={(book) => navigateTo('chapters', book)}
                                onManageEditors={(book) => navigateTo('editors', book)}
                            />
                        )}
                        {view === 'chapters' && selectedBook && (
                            <BookChapterManager
                                bookTitle={selectedBook}
                                addToast={addToast}
                                onBack={() => navigateTo('titles')}
                            />
                        )}
                        {view === 'editors' && selectedBook && (
                            <EditorAssignmentManager
                                bookTitle={selectedBook}
                                addToast={addToast}
                                onBack={() => navigateTo('titles')}
                            />
                        )}
                    </div>
                </main>
            </div>

            {/* ── Toast stack ── */}
            <div className="bms-toast-wrap">
                {toasts.map((t) => (
                    <div key={t.id} className={`bms-toast ${t.type}`}>
                        <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : '!'}</span>
                        {t.message}
                    </div>
                ))}
            </div>
        </div>
    );
}