import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, type User, type UpdateProfilePayload } from '../../../services/user.service';
import AlertPopup from '../../../components/common/alertPopup';
import axios from 'axios';
import { getAuthToken, API_BASE_URL } from '../../../services/api.config';
import { COUNTRIES } from '../../../utils/countries';

/* ── Icons (same sizes as ProfilePage) ── */
const Icons = {
    User: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    Briefcase: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>),
    Academic: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 11-12.32 0L12 14zm0 0v6" /></svg>),
    Globe: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8M12 3a18.85 18.85 0 00-3 9 18.85 18.85 0 003 9 18.85 18.85 0 003-9 18.85 18.85 0 00-3-9z" /></svg>),
    Camera: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
    ArrowLeft: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>),
    Save: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>),
};

/* ── Shared style tokens ── */
const labelCls = "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5";
const inputCls = "w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all text-[13px] text-gray-800 bg-white";
const optBadge = <span className="text-[9px] font-normal text-gray-400 normal-case ml-1">(Optional)</span>;

function Field({ label, optional, req, children }: { label: string; optional?: boolean; req?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-0.5">
            <label className={labelCls}>{label}{optional && optBadge}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
            {children}
        </div>
    );
}

export default function ProfileEditPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'academic' | 'social'>('personal');
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' }>({ isOpen: false, title: '', message: '', type: 'success' });
    const [formData, setFormData] = useState<UpdateProfilePayload & { interestInput?: string; email?: string; username?: string; fullName?: string }>({});

    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Phone & Country Code state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [phoneDigits, setPhoneDigits] = useState('');
    const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
    const [phoneError, setPhoneError] = useState('');
    const [phoneTouched, setPhoneTouched] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const r = await userService.getCurrentUser();
            if (r.success && r.data) {
                setUser(r.data);
                setAvatarPreview(r.data.profilePicture || null);
                setFormData({ ...r.data, dateOfBirth: r.data.dateOfBirth ? new Date(r.data.dateOfBirth).toISOString().split('T')[0] : '' });
            }
        } catch { setAlertConfig({ isOpen: true, title: 'Error', message: 'Failed to load profile data', type: 'error' }); }
        finally { setLoading(false); }
    };

    // Split existing phone number on load
    useEffect(() => {
        if (user?.phoneNumber) {
            // Find if any country code matches the start of the phone number
            // Sort by length descending to match longest code first (e.g. +1-242 vs +1)
            const sortedCountries = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
            const match = sortedCountries.find(c => user.phoneNumber?.startsWith(c.code));

            if (match) {
                setSelectedCountryCode(match.code);
                setPhoneDigits(user.phoneNumber.slice(match.code.length));
            } else {
                setPhoneDigits(user.phoneNumber.replace(/\D/g, ''));
            }
        }
    }, [user]);

    // Dropdown auto-alignment logic
    const toggleDropdown = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isDropdownOpen) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const estimatedHeight = 280; // roughly 8 items * 35px
            setDropdownDirection(spaceBelow < estimatedHeight ? 'up' : 'down');
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const validatePhone = (digits: string) => {
        if (!digits) {
            setPhoneError('Phone number is required');
        } else if (digits.length < 10) {
            setPhoneError('Phone number must be at least 10 digits');
        } else {
            setPhoneError('');
        }
    };

    const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && formData.interestInput?.trim()) {
            e.preventDefault();
            const v = formData.interestInput.trim();
            if (!formData.researchInterests?.includes(v))
                setFormData(prev => ({ ...prev, researchInterests: [...(prev.researchInterests || []), v], interestInput: '' }));
            else setFormData(prev => ({ ...prev, interestInput: '' }));
        }
    };

    const removeInterest = (i: string) =>
        setFormData(prev => ({ ...prev, researchInterests: prev.researchInterests?.filter(x => x !== i) }));

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setAlertConfig({ isOpen: true, title: 'Error', message: 'Please upload an image file.', type: 'error' }); return; }
        if (file.size > 10 * 1024 * 1024) { setAlertConfig({ isOpen: true, title: 'Error', message: 'File size must be less than 10MB.', type: 'error' }); return; }

        // Instant local preview
        const reader = new FileReader();
        reader.onload = ev => setAvatarPreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        setUploadingImage(true);
        try {
            const fd = new FormData();
            fd.append('profilePicture', file);
            const token = getAuthToken();
            const res = await axios.put<{ success: boolean; data: any }>(`${API_BASE_URL}/api/users/me/profile-picture`, fd, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                setUser(prev => prev ? { ...prev, profilePicture: res.data.data.profilePicture } : null);
                setAvatarPreview(res.data.data.profilePicture);
                const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
                if (stored) {
                    const upd = { ...JSON.parse(stored), profilePicture: res.data.data.profilePicture };
                    if (localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(upd));
                    if (sessionStorage.getItem('user')) sessionStorage.setItem('user', JSON.stringify(upd));
                }
                window.dispatchEvent(new Event('auth-changed'));
                setAlertConfig({ isOpen: true, title: 'Success', message: 'Profile picture updated!', type: 'success' });
            }
        } catch (err: any) { setAlertConfig({ isOpen: true, title: 'Upload Failed', message: err.response?.data?.message || 'Failed to update profile picture.', type: 'error' }); }
        finally { setUploadingImage(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName?.trim() || !formData.username?.trim() || !formData.email?.trim()) {
            setAlertConfig({ isOpen: true, title: 'Validation Error', message: 'Full Name, Username, and Email are required.', type: 'error' }); return;
        }
        setIsSaving(true);
        try {
            const { interestInput, ...rest } = formData;

            // Helper: convert empty string → undefined so backend skips the field
            const val = (v: string | undefined | null) => (v === '' || v === null) ? undefined : v;
            const num = (v: any) => (v === '' || v === null || v === undefined) ? undefined : Number(v);

            // Explicitly allow-list updatable fields only.
            // Exclude: profilePicture (handled by separate endpoint), id, role, isActive, etc.
            const payload: UpdateProfilePayload = {
                fullName: rest.fullName?.trim(),
                username: rest.username?.trim().toLowerCase(),
                email: rest.email?.trim().toLowerCase(),
                phoneNumber: (selectedCountryCode && phoneDigits) ? `${selectedCountryCode}${phoneDigits}` : undefined,
                gender: val(rest.gender),
                nationality: val(rest.nationality),
                dateOfBirth: val(rest.dateOfBirth),   // empty string → undefined, not sent
                streetAddress: val(rest.streetAddress),
                city: val(rest.city),
                state: val(rest.state),
                country: val(rest.country),
                zipCode: val(rest.zipCode),
                bio: val(rest.bio),
                designation: val(rest.designation),
                organization: val(rest.organization),
                department: val(rest.department),
                orcidId: val(rest.orcidId),
                experienceYears: num(rest.experienceYears),
                qualification: val(rest.qualification),
                specialization: val(rest.specialization),
                researchInterests: rest.researchInterests,
                linkedinProfile: val(rest.linkedinProfile),
                twitterProfile: val(rest.twitterProfile),
                website: val(rest.website),
                scopusLink: val(rest.scopusLink),
            };

            // Remove keys that are undefined to keep payload clean
            const cleanPayload = Object.fromEntries(
                Object.entries(payload).filter(([, v]) => v !== undefined)
            ) as UpdateProfilePayload;

            const r = await userService.updateCurrentUser(cleanPayload);
            if (r.success) {
                if (r.message.includes('OTP')) { setShowOtpModal(true); setAlertConfig({ isOpen: true, title: 'Verify Email', message: r.message, type: 'warning' }); }
                else {
                    setAlertConfig({ isOpen: true, title: 'Success', message: 'Profile updated successfully', type: 'success' });
                    if (r.data) { setUser(r.data); updateStored(r.data); setTimeout(() => navigate('/dashboard/profile'), 1500); }
                }
            }
        } catch (err: any) {
            // Surface the specific validation errors from the backend if available
            const errorsObj = err.errors;
            const detail = errorsObj ? Object.values(errorsObj).join(' · ') : err.message || 'An error occurred';
            console.error('Profile update failed:', err);
            setAlertConfig({ isOpen: true, title: 'Update Failed', message: detail, type: 'error' });
        }
        finally { setIsSaving(false); }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) { setAlertConfig({ isOpen: true, title: 'Error', message: 'Enter a valid 6-digit OTP.', type: 'error' }); return; }
        setVerifyingOtp(true);
        try {
            const token = getAuthToken();
            const r = await axios.post(`${API_BASE_URL}/api/users/me/verify-email`, { otp }, { headers: { Authorization: `Bearer ${token}` } });
            if (r.data.success) { setShowOtpModal(false); setAlertConfig({ isOpen: true, title: 'Success', message: 'Email verified!', type: 'success' }); updateStored(r.data.data); setTimeout(() => navigate('/dashboard/profile'), 1500); }
        } catch (err: any) { setAlertConfig({ isOpen: true, title: 'Verification Failed', message: err.response?.data?.message || 'Invalid OTP.', type: 'error' }); }
        finally { setVerifyingOtp(false); }
    };

    const updateStored = (data: any) => {
        const s = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (s) {
            const upd = { ...JSON.parse(s), ...data };
            if (localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(upd));
            if (sessionStorage.getItem('user')) sessionStorage.setItem('user', JSON.stringify(upd));
            window.dispatchEvent(new Event('auth-changed'));
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[300px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

    const tabs = [
        { id: 'personal', label: 'Personal', icon: Icons.User },
        { id: 'professional', label: 'Professional', icon: Icons.Briefcase },
        { id: 'academic', label: 'Academic', icon: Icons.Academic },
        { id: 'social', label: 'Social', icon: Icons.Globe },
    ];

    /* Avatar initials */
    const initials = formData.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    return (
        <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">

            {/* ── Hero (mirrors ProfilePage hero) ── */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#2c3e50] to-[#4ca1af] px-6 py-5 text-white shadow-md">
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
                    {/* Clickable avatar */}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group flex-shrink-0 focus:outline-none">
                        <div className="w-20 h-20 rounded-full border-2 border-white/40 overflow-hidden bg-white/10 flex items-center justify-center">
                            {uploadingImage ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : avatarPreview ? (
                                <img 
                                    src={avatarPreview.startsWith('http') || avatarPreview.startsWith('data:') 
                                        ? avatarPreview 
                                        : `${API_BASE_URL}${avatarPreview}`} 
                                    alt="avatar" 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <span className="text-2xl font-bold opacity-60">{initials}</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {Icons.Camera}
                            </div>
                        </div>
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/70 whitespace-nowrap">Click to change</span>
                    </button>
                    {/* Hidden real file input */}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="sr-only" tabIndex={-1} />

                    {/* Name / role row */}
                    <div className="text-center sm:text-left mt-4 sm:mt-0">
                        <h1 className="text-[16px] font-bold leading-tight">{formData.fullName || user?.fullName}</h1>
                        <p className="text-[13px] opacity-80">@{formData.username || user?.username}</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-1.5">
                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-semibold uppercase tracking-wide">{user?.role === 'developer' ? 'Default User' : user?.role}</span>
                            <span className="px-2 py-0.5 bg-amber-400/20 text-amber-200 rounded-full text-[10px] font-semibold">Editing</span>
                        </div>
                    </div>

                    {/* Back button (top-right) */}
                    <button onClick={() => navigate('/dashboard/profile')} className="sm:ml-auto self-start sm:self-center p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors" title="Back to profile">
                        {Icons.ArrowLeft}
                    </button>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-5%] w-36 h-36 bg-black/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* ── Card (mirrors ProfilePage card) ── */}
            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row">

                    {/* Sidebar — identical structure to ProfilePage */}
                    <div className="w-full md:w-48 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-3 flex md:flex-col gap-2 rounded-t-xl md:rounded-tr-none md:rounded-l-xl">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all w-full ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                            >
                                {tab.icon}
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content — same padding & grid rhythm as ProfilePage */}
                    <div className="flex-1 p-4 sm:p-5">
                        <div className="space-y-3">

                            {/* ── PERSONAL ── */}
                            {activeTab === 'personal' && (
                                <div className="space-y-3 animate-slideInRight">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Full Name" req>
                                            <input name="fullName" type="text" value={formData.fullName || ''} onChange={handle} placeholder="John Doe" required className={inputCls} />
                                        </Field>
                                        <Field label="Username" req>
                                            <input name="username" type="text" value={formData.username || ''} onChange={handle} placeholder="johndoe123" required className={inputCls} />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Email" req>
                                            <input name="email" type="email" value={formData.email || ''} onChange={handle} placeholder="john@example.com" required className={inputCls} />
                                            {formData.email !== user?.email && <p className="text-[10px] text-orange-500 mt-0.5">⚠ Changing email requires OTP verification.</p>}
                                        </Field>
                                        <Field label="Phone Number" optional>
                                            <div className="flex flex-col space-y-1">
                                                <div className={`flex items-center rounded-lg border transition-all ${phoneTouched && phoneError ? 'border-red-500 bg-red-50/10' : 'border-gray-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10'} bg-white`}>
                                                    {/* Country Code Dropdown */}
                                                    <div className="relative shrink-0" ref={dropdownRef}>
                                                        <button
                                                            type="button"
                                                            onClick={toggleDropdown}
                                                            className="flex items-center justify-between gap-2 px-3 py-1.5 h-full bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors text-[13px] text-gray-700 min-w-[100px] rounded-l-lg"
                                                        >
                                                            <span className="font-medium">
                                                                {COUNTRIES.find(c => c.code === selectedCountryCode)?.iso} ({selectedCountryCode})
                                                            </span>
                                                            <svg className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>

                                                        {isDropdownOpen && (
                                                            <div className={`absolute z-50 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl overflow-y-auto max-h-[280px] ${dropdownDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                                                                {COUNTRIES.map(c => (
                                                                    <button
                                                                        key={`${c.iso}-${c.code}`}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedCountryCode(c.code);
                                                                            setIsDropdownOpen(false);
                                                                        }}
                                                                        className="flex items-center justify-between w-full px-3 py-2 text-[12px] text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors border-b border-gray-50 last:border-0"
                                                                    >
                                                                        <span className="font-semibold">{c.iso}</span>
                                                                        <span className="text-gray-500">{c.code}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Phone Digits Input */}
                                                    <input
                                                        name="phoneNumber"
                                                        type="tel"
                                                        value={phoneDigits}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            if (val.length <= 15) {
                                                                setPhoneDigits(val);
                                                                if (phoneTouched) validatePhone(val);
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            setPhoneTouched(true);
                                                            validatePhone(phoneDigits);
                                                        }}
                                                        placeholder="Enter 10 or more digits"
                                                        className="flex-1 px-3 py-1.5 outline-none text-[13px] text-gray-800 bg-transparent"
                                                    />
                                                </div>
                                                {phoneTouched && phoneError && (
                                                    <span className="text-[10px] text-red-500 font-medium">{phoneError}</span>
                                                )}
                                            </div>
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <Field label="Gender" optional>
                                            <select name="gender" value={formData.gender || ''} onChange={handle} className={inputCls}>
                                                <option value="">Select</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                                <option value="prefer_not_to_say">Prefer not to say</option>
                                            </select>
                                        </Field>
                                        <Field label="Nationality" optional>
                                            <input name="nationality" type="text" value={formData.nationality || ''} onChange={handle} placeholder="e.g. American" className={inputCls} />
                                        </Field>
                                        <Field label="Date of Birth" optional>
                                            <input name="dateOfBirth" type="date" value={formData.dateOfBirth || ''} onChange={handle} className={inputCls} />
                                        </Field>
                                    </div>

                                    <Field label="Bio" optional>
                                        <textarea name="bio" value={formData.bio || ''} onChange={handle} rows={3} placeholder="Tell us about yourself..." className={`${inputCls} resize-none`} />
                                    </Field>

                                    <Field label="Street Address" optional>
                                        <input name="streetAddress" type="text" value={formData.streetAddress || ''} onChange={handle} placeholder="123 Main St" className={inputCls} />
                                    </Field>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <Field label="City"><input name="city" type="text" value={formData.city || ''} onChange={handle} placeholder="New York" className={inputCls} /></Field>
                                        <Field label="State"><input name="state" type="text" value={formData.state || ''} onChange={handle} placeholder="NY" className={inputCls} /></Field>
                                        <Field label="Zip Code"><input name="zipCode" type="text" value={formData.zipCode || ''} onChange={handle} placeholder="10001" className={inputCls} /></Field>
                                        <Field label="Country"><input name="country" type="text" value={formData.country || ''} onChange={handle} placeholder="United States" className={inputCls} /></Field>
                                    </div>
                                </div>
                            )}

                            {/* ── PROFESSIONAL ── */}
                            {activeTab === 'professional' && (
                                <div className="space-y-3 animate-slideInRight">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Job Title / Designation" optional>
                                            <input name="designation" type="text" value={formData.designation || ''} onChange={handle} placeholder="e.g. Senior Professor" className={inputCls} />
                                        </Field>
                                        <Field label="Years of Experience" optional>
                                            <input name="experienceYears" type="number" value={formData.experienceYears || ''} onChange={handle} placeholder="10" className={inputCls} />
                                        </Field>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Organization / University" optional>
                                            <input name="organization" type="text" value={formData.organization || ''} onChange={handle} placeholder="Stanford University" className={inputCls} />
                                        </Field>
                                        <Field label="Department" optional>
                                            <input name="department" type="text" value={formData.department || ''} onChange={handle} placeholder="Computer Science" className={inputCls} />
                                        </Field>
                                    </div>
                                    <Field label="ORCID iD" optional>
                                        <input name="orcidId" type="text" value={formData.orcidId || ''} onChange={handle} placeholder="0000-0000-0000-0000" className={inputCls} />
                                    </Field>
                                </div>
                            )}

                            {/* ── ACADEMIC ── */}
                            {activeTab === 'academic' && (
                                <div className="space-y-3 animate-slideInRight">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Highest Qualification" optional>
                                            <input name="qualification" type="text" value={formData.qualification || ''} onChange={handle} placeholder="e.g. Ph.D." className={inputCls} />
                                        </Field>
                                        <Field label="Specialization" optional>
                                            <input name="specialization" type="text" value={formData.specialization || ''} onChange={handle} placeholder="e.g. Artificial Intelligence" className={inputCls} />
                                        </Field>
                                    </div>
                                    <Field label="Research Interests" optional>
                                        <div className="space-y-2">
                                            {formData.researchInterests && formData.researchInterests.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 min-h-[34px]">
                                                    {formData.researchInterests.map(interest => (
                                                        <span key={interest} className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-[11px] font-medium">
                                                            {interest}
                                                            <button type="button" onClick={() => removeInterest(interest)} className="text-primary-400 hover:text-primary-600 leading-none">
                                                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <input name="interestInput" type="text" value={formData.interestInput || ''} onChange={handle} onKeyDown={handleInterestKeyDown} placeholder="Type an interest and press Enter..." className={inputCls} />
                                        </div>
                                    </Field>
                                </div>
                            )}

                            {/* ── SOCIAL ── */}
                            {activeTab === 'social' && (
                                <div className="space-y-3 animate-slideInRight">
                                    <Field label="LinkedIn Profile URL" optional>
                                        <input name="linkedinProfile" type="url" value={formData.linkedinProfile || ''} onChange={handle} placeholder="https://linkedin.com/in/username" className={inputCls} />
                                    </Field>
                                    <Field label="Twitter / X Profile URL" optional>
                                        <input name="twitterProfile" type="url" value={formData.twitterProfile || ''} onChange={handle} placeholder="https://twitter.com/username" className={inputCls} />
                                    </Field>
                                    <Field label="Website / Portfolio URL" optional>
                                        <input name="website" type="url" value={formData.website || ''} onChange={handle} placeholder="https://example.com" className={inputCls} />
                                    </Field>
                                    <Field label="Scopus Profile Link" optional>
                                        <input name="scopusLink" type="url" value={formData.scopusLink || ''} onChange={handle} placeholder="https://www.scopus.com/authid/detail.uri?authorId=..." className={inputCls} />
                                    </Field>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions — same position as ProfilePage's Edit button row */}
                        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end gap-2">
                            <button type="button" onClick={() => navigate('/dashboard/profile')} className="px-4 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-[13px] font-semibold transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSaving} className="flex items-center gap-1.5 px-5 py-1.5 bg-primary-600 rounded-lg text-[13px] font-semibold shadow-sm hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSaving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : Icons.Save}
                                {isSaving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* ── OTP Modal ── */}
            {showOtpModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl animate-fadeIn">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-1">Verify Email</h2>
                        <p className="text-[12px] text-gray-500 mb-4">We've sent a 6-digit code to your <span className="font-semibold text-gray-700">new email address</span>. Enter it below to confirm.</p>
                        <input type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="------" className="w-full text-center tracking-[0.4em] text-2xl px-3 py-3 rounded-lg border-2 border-gray-200 focus:border-primary-500 outline-none font-mono mb-4" />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowOtpModal(false)} className="px-4 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-[12px] font-semibold">Cancel</button>
                            <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp || otp.length !== 6} className="px-5 py-1.5 bg-primary-600 rounded-lg text-[12px] font-semibold hover:bg-primary-700 disabled:opacity-50">
                                {verifyingOtp ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertPopup isOpen={alertConfig.isOpen} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} />

            <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out forwards; }
      `}</style>
        </div>
    );
}
