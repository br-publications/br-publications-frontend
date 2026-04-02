import React, { useState, useRef, useEffect } from 'react';
import './authorMultiSelect.css';

interface AuthorMultiSelectProps {
    authorOptions: string[];
    selectedNames: string;
    onChange: (newNames: string) => void;
    placeholder?: string;
}

const AuthorMultiSelect: React.FC<AuthorMultiSelectProps> = ({
    authorOptions,
    selectedNames,
    onChange,
    placeholder = "Select Author(s)..."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Convert comma-separated string to array of names
    const selectedList = selectedNames
        ? selectedNames.split(',').map(n => n.trim()).filter(Boolean)
        : [];

    const toggleAuthor = (name: string) => {
        const trimmedName = name.trim();
        let newList: string[];
        if (selectedList.includes(trimmedName)) {
            newList = selectedList.filter(n => n !== trimmedName);
        } else {
            newList = [...selectedList, trimmedName];
        }
        onChange(newList.join(', '));
    };

    const removeAuthor = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        const newList = selectedList.filter(n => n !== name);
        onChange(newList.join(', '));
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="author-multi-select-container" ref={containerRef}>
            <div 
                className={`author-multi-select-box ${isOpen ? 'open' : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedList.length > 0 ? (
                    <div className="selected-authors-pills">
                        {selectedList.map(name => (
                            <span key={name} className="author-pill">
                                {name}
                                <button 
                                    type="button" 
                                    className="pill-remove" 
                                    onClick={(e) => removeAuthor(e, name)}
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="placeholder-text">{placeholder}</span>
                )}
                <span className="dropdown-arrow">▼</span>
            </div>

            {isOpen && (
                <div className="author-options-dropdown">
                    {authorOptions.length > 0 ? (
                        authorOptions.map((name, idx) => {
                            const trimmedName = name.trim();
                            const isSelected = selectedList.includes(trimmedName);
                            return (
                                <div 
                                    key={`${trimmedName}-${idx}`}
                                    className={`author-option ${isSelected ? 'selected' : ''}`}
                                    onClick={() => toggleAuthor(trimmedName)}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected} 
                                        readOnly 
                                    />
                                    <span>{trimmedName}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-authors-msg">No authors found in biographies.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AuthorMultiSelect;
