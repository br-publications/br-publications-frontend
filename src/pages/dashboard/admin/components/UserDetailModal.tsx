import React, { useState } from 'react';
import { X, Mail, Shield, User as UserIcon, Briefcase, GraduationCap, Globe } from 'lucide-react';
import { type User } from '../../../../services/user.service';

interface UserDetailModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onEmail: () => void;
}

const Icons = {
    User: <UserIcon className="w-4 h-4" />,
    Briefcase: <Briefcase className="w-4 h-4" />,
    Academic: <GraduationCap className="w-4 h-4" />,
    Globe: <Globe className="w-4 h-4" />,
};

const labelCls = "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5";
const valueCls = "w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-transparent text-[13px] text-gray-800";

function Field({ label, children, colSpan = 1 }: { label: string; children: React.ReactNode, colSpan?: number }) {
    return (
        <div className={`space-y-0.5 ${colSpan === 2 ? 'sm:col-span-2' : ''} ${colSpan === 3 ? 'sm:col-span-3' : ''} ${colSpan === 4 ? 'sm:col-span-4' : ''}`}>
            <span className={labelCls}>{label}</span>
            {children}
        </div>
    );
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose, onEmail }) => {
    const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'academic' | 'social'>('personal');

    if (!isOpen || !user) return null;

    const tabs = [
        { id: 'personal', label: 'Personal', icon: Icons.User },
        { id: 'professional', label: 'Professional', icon: Icons.Briefcase },
        { id: 'academic', label: 'Academic', icon: Icons.Academic },
        { id: 'social', label: 'Social', icon: Icons.Globe },
    ];

    return (
        <div className="fixed inset-0 z-[2000] flex animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl mx-auto h-[90vh] sm:h-auto sm:max-h-[90vh] bg-transparent flex flex-col mt-auto sm:mt-[5vh] mb-[5vh] px-4">

                {/* Hero / Header */}
                <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-r from-[#2c3e50] to-[#4ca1af] px-6 py-5 text-white shadow-md rounded-b-xl sm:rounded-b-none z-10 shrink-0">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold opacity-60">
                                    {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                            )}
                        </div>
                        {/* Info */}
                        <div className="text-center sm:text-left">
                            <h1 className="text-[16px] font-bold leading-tight">{user.fullName}</h1>
                            <p className="text-[13px] opacity-80">@{user.username}</p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-1.5">
                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    {user.role === 'developer' ? 'Default User' : user.role}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${user.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-[-20%] left-[-5%] w-36 h-36 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-white rounded-b-xl border border-gray-100 shadow-xl overflow-hidden flex flex-col md:flex-row -mt-4 sm:mt-0 pt-4 sm:pt-0 pb-safe sm:pb-0 z-0">

                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-48 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-3 flex md:flex-col gap-2 overflow-x-auto no-scrollbar shrink-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all min-w-max md:w-full ${activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                {tab.icon}
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col overflow-y-auto min-h-0">
                        <div className="flex-1 space-y-3 pb-4">
                            {/* PERSONAL */}
                            {activeTab === 'personal' && (
                                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Full Name"><div className={valueCls}>{user.fullName || '—'}</div></Field>
                                        <Field label="Username"><div className={valueCls}>{user.username || '—'}</div></Field>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Email"><div className={valueCls}>{user.email || '—'}</div></Field>
                                        <Field label="Phone Number"><div className={valueCls}>{user.phoneNumber || '—'}</div></Field>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Field label="Gender"><div className={`${valueCls} capitalize`}>{user.gender?.replace(/_/g, ' ') || '—'}</div></Field>
                                        <Field label="Nationality"><div className={valueCls}>{user.nationality || '—'}</div></Field>
                                        <Field label="Date of Birth">
                                            <div className={valueCls}>{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '—'}</div>
                                        </Field>
                                    </div>
                                    <Field label="Bio" colSpan={2}><div className={`${valueCls} min-h-[60px] whitespace-pre-wrap`}>{user.bio || '—'}</div></Field>
                                    <Field label="Street Address" colSpan={2}><div className={valueCls}>{user.streetAddress || '—'}</div></Field>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <Field label="City"><div className={valueCls}>{user.city || '—'}</div></Field>
                                        <Field label="State"><div className={valueCls}>{user.state || '—'}</div></Field>
                                        <Field label="Zip Code"><div className={valueCls}>{user.zipCode || '—'}</div></Field>
                                        <Field label="Country"><div className={valueCls}>{user.country || '—'}</div></Field>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                        <Field label="Joined Date">
                                            <div className={valueCls}>{new Date(user.createdAt).toLocaleDateString()}</div>
                                        </Field>
                                        <Field label="Last Updated">
                                            <div className={valueCls}>{new Date(user.updatedAt).toLocaleDateString()}</div>
                                        </Field>
                                        <Field label="Email Verified">
                                            <div className={`${valueCls} ${user.isVerified ? 'text-green-700 font-medium' : 'text-amber-600'}`}>
                                                {user.isVerified ? 'Yes' : 'No'}
                                            </div>
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {/* PROFESSIONAL */}
                            {activeTab === 'professional' && (
                                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Job Title / Designation"><div className={valueCls}>{user.designation || '—'}</div></Field>
                                        <Field label="Years of Experience"><div className={valueCls}>{user.experienceYears ?? '—'}</div></Field>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Organization / University"><div className={valueCls}>{user.organization || '—'}</div></Field>
                                        <Field label="Department"><div className={valueCls}>{user.department || '—'}</div></Field>
                                    </div>
                                    <Field label="ORCID iD"><div className={valueCls}>{user.orcidId || '—'}</div></Field>
                                </div>
                            )}

                            {/* ACADEMIC */}
                            {activeTab === 'academic' && (
                                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Highest Qualification"><div className={valueCls}>{user.qualification || '—'}</div></Field>
                                        <Field label="Specialization"><div className={valueCls}>{user.specialization || '—'}</div></Field>
                                    </div>
                                    <Field label="Research Interests">
                                        <div className={`${valueCls} min-h-[40px]`}>
                                            {user.researchInterests && user.researchInterests.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    {user.researchInterests.map(interest => (
                                                        <span key={interest} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-medium border border-indigo-100">{interest}</span>
                                                    ))}
                                                </div>
                                            ) : '—'}
                                        </div>
                                    </Field>
                                </div>
                            )}

                            {/* SOCIAL */}
                            {activeTab === 'social' && (
                                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                                    {[
                                        { label: 'LinkedIn Profile URL', val: user.linkedinProfile },
                                        { label: 'Twitter / X Profile URL', val: user.twitterProfile },
                                        { label: 'Website / Portfolio URL', val: user.website },
                                    ].map(({ label, val }) => (
                                        <Field key={label} label={label}>
                                            <div className={valueCls}>
                                                {val ? <a href={val} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline break-all">{val}</a> : '—'}
                                            </div>
                                        </Field>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white">
                            <button
                                onClick={() => {
                                    onEmail();
                                    onClose();
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors"
                            >
                                <Mail className="w-4 h-4 text-gray-400" />
                                Send Email
                            </button>
                            <button
                                onClick={onClose}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 shadow-sm hover:bg-indigo-700 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @supports (padding-bottom: env(safe-area-inset-bottom)) {
                    .pb-safe { padding-bottom: calc(0.5rem + env(safe-area-inset-bottom)); }
                }
            `}</style>
        </div>
    );
};

export default UserDetailModal;
