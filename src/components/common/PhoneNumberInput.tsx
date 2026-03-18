import React, { useState, useEffect, useRef } from 'react';
import { COUNTRIES, type Country } from '../../utils/countries';
import './phoneNumberInput.css';

interface PhoneNumberInputProps {
    value: string; // Full concatenated phone number, e.g., "+919876543210"
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    id?: string;
    className?: string;
    onBlur?: () => void;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
    value = '',
    onChange,
    placeholder = 'Enter Phone Number',
    required = false,
    disabled = false,
    id,
    className = '',
    onBlur
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
    const [countryCode, setCountryCode] = useState('+91');
    const [phoneDigits, setPhoneDigits] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial sync and parse
    useEffect(() => {
        if (!value) {
            setPhoneDigits('');
            // Keep current countryCode or stick to default
            return;
        }

        // Find longest matching country code
        const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
        const match = sorted.find(c => value.startsWith(c.code));

        if (match) {
            setCountryCode(match.code);
            setPhoneDigits(value.slice(match.code.length).replace(/\D/g, ''));
        } else {
            // If no match (e.g. old data without + prefix properly set), 
            // fallback to default country and assume all are digits
            setPhoneDigits(value.replace(/\D/g, ''));
        }
    }, [value]);

    const toggleDropdown = (e: React.MouseEvent) => {
        e.preventDefault();
        if (disabled) return;

        if (!isDropdownOpen) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const estimatedHeight = 280; // Roughly 8-10 items
            setDropdownDirection(spaceBelow < estimatedHeight ? 'up' : 'down');
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleCountrySelect = (code: string) => {
        setCountryCode(code);
        setIsDropdownOpen(false);
        onChange(code + phoneDigits);
    };

    const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 15) {
            setPhoneDigits(val);
            onChange(countryCode + val);
        }
    };

    // Close dropdown on click outside or scroll
    useEffect(() => {
        const handleClose = (event: MouseEvent | Event) => {
            if (isDropdownOpen) {
                if (event.type === 'scroll') {
                    const target = event.target as Node;
                    if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                        setIsDropdownOpen(false);
                    }
                } else {
                    const mouseEvent = event as MouseEvent;
                    if (dropdownRef.current && !dropdownRef.current.contains(mouseEvent.target as Node)) {
                        setIsDropdownOpen(false);
                    }
                }
            }
        };

        document.addEventListener('mousedown', handleClose);
        window.addEventListener('scroll', handleClose, true);
        return () => {
            document.removeEventListener('mousedown', handleClose);
            window.removeEventListener('scroll', handleClose, true);
        };
    }, [isDropdownOpen]);

    const currentCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES.find(c => c.code === '+91');

    return (
        <div className={`phone-input-group ${disabled ? 'disabled' : ''} ${className}`}>
            <div
                ref={dropdownRef}
                className="phone-dropdown-container"
            >
                <div
                    className="phone-country-select"
                    onClick={toggleDropdown}
                >
                    <span className="phone-country-display">
                        {currentCountry?.iso} ({countryCode})
                    </span>
                    <span className="phone-dropdown-arrow">▼</span>
                </div>

                {isDropdownOpen && (
                    <div className={`phone-country-options ${dropdownDirection}`}>
                        {COUNTRIES.map((c: Country) => (
                            <div
                                key={`${c.iso}-${c.code}`}
                                className={`phone-country-option ${c.code === countryCode ? 'selected' : ''}`}
                                onClick={() => handleCountrySelect(c.code)}
                            >
                                <span className="option-iso">{c.iso}</span>
                                <span className="option-code">{c.code}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <input
                id={id}
                type="tel"
                className="phone-digits-field"
                placeholder={placeholder}
                value={phoneDigits}
                onChange={handleDigitsChange}
                onBlur={onBlur}
                disabled={disabled}
                required={required}
            />
        </div>
    );
};

export default PhoneNumberInput;
