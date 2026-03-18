import { useState, useEffect } from 'react';
import { userService, type User } from '../../../services/user.service';
import AlertPopup from '../../../components/common/alertPopup';
import { API_BASE_URL } from '../../../services/api.config';

const Icons = {
    User: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    Briefcase: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>),
    Academic: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 11-12.32 0L12 14zm0 0v6" /></svg>),
    Globe: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8M12 3a18.85 18.85 0 00-3 9 18.85 18.85 0 003 9 18.85 18.85 0 003-9 18.85 18.85 0 00-3-9z" /></svg>),
};

const labelCls = "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5";
const valueCls = "w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-transparent text-[13px] text-gray-800";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-0.5">
            <span className={labelCls}>{label}</span>
            {children}
        </div>
    );
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'academic' | 'social'>('personal');
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' }>({ isOpen: false, title: '', message: '', type: 'success' });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const response = await userService.getCurrentUser();
            if (response.success && response.data) {
                setUser(response.data);
                updateStored(response.data);
            }
        } catch {
            setAlertConfig({ isOpen: true, title: 'Error', message: 'Failed to load profile data', type: 'error' });
        } finally {
            setLoading(false);
        }
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const tabs = [
        { id: 'personal', label: 'Personal', icon: Icons.User },
        { id: 'professional', label: 'Professional', icon: Icons.Briefcase },
        { id: 'academic', label: 'Academic', icon: Icons.Academic },
        { id: 'social', label: 'Social', icon: Icons.Globe },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#2c3e50] to-[#4ca1af] px-6 py-5 text-white shadow-md">
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                        {user?.profilePicture ? (
                            <img 
                                src={user.profilePicture.startsWith('http') || user.profilePicture.startsWith('data:') 
                                    ? user.profilePicture 
                                    : `${API_BASE_URL}${user.profilePicture}`} 
                                alt={user.fullName} 
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            <span className="text-2xl font-bold opacity-60">
                                {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                        )}
                    </div>
                    {/* Info */}
                    <div className="text-center sm:text-left">
                        <h1 className="text-[16px] font-bold leading-tight">{user?.fullName}</h1>
                        <p className="text-[13px] opacity-80">@{user?.username}</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-1.5">
                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-semibold uppercase tracking-wide">{user?.role === 'developer' ? 'Default User' : user?.role}</span>
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full text-[10px] font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>Active
                            </span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-20%] left-[-5%] w-36 h-36 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">

                {/* Sidebar */}
                <div className="w-full md:w-48 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-3 flex md:flex-col gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all w-full ${activeTab === tab.id
                                ? 'bg-primary-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            {tab.icon}
                            <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-5">
                    <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-3">

                            {/* PERSONAL */}
                            {activeTab === 'personal' && (
                                <div className="space-y-3 animate-slideInRight">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Full Name"><div className={valueCls}>{user?.fullName || '—'}</div></Field>
                                        <Field label="Username"><div className={valueCls}>{user?.username || '—'}</div></Field>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Email"><div className={valueCls}>{user?.email || '—'}</div></Field>
                                        <Field label="Phone Number">
                                            <div className={valueCls}>
                                                {(() => {
                                                    if (!user?.phoneNumber) return '—';
                                                    // This is a simple heuristic to show country code if it starts with +
                                                    const match = user.phoneNumber.match(/^(\+\d+)(.*)$/);
                                                    if (match) {
                                                        return (
                                                            <span>
                                                                <span className="font-bold text-primary-600 mr-2">{match[1]}</span>
                                                                {match[2]}
                                                            </span>
                                                        );
                                                    }
                                                    return user.phoneNumber;
                                                })()}
                                            </div>
                                        </Field>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <Field label="Gender"><div className={`${valueCls} capitalize`}>{user?.gender?.replace(/_/g, ' ') || '—'}</div></Field>
                                        <Field label="Nationality"><div className={valueCls}>{user?.nationality || '—'}</div></Field>
                                        <Field label="Date of Birth">
                                            <div className={valueCls}>{user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '—'}</div>
                                        </Field>
                                    </div>
                                    <Field label="Bio"><div className={`${valueCls} min-h-[60px] whitespace-pre-wrap`}>{user?.bio || '—'}</div></Field>
                                    <Field label="Street Address"><div className={valueCls}>{user?.streetAddress || '—'}</div></Field>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <Field label="City"><div className={valueCls}>{user?.city || '—'}</div></Field>
                                        <Field label="State"><div className={valueCls}>{user?.state || '—'}</div></Field>
                                        <Field label="Zip Code"><div className={valueCls}>{user?.zipCode || '—'}</div></Field>
                                        <Field label="Country"><div className={valueCls}>{user?.country || '—'}</div></Field>
                                    </div>
                                </div>
                            )}

                            {/* PROFESSIONAL */}
                            {activeTab === 'professional' && (
                                <div className="space-y-3 animate-slideInRight">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Job Title / Designation"><div className={valueCls}>{user?.designation || '—'}</div></Field>
                                        <Field label="Years of Experience"><div className={valueCls}>{user?.experienceYears ?? '—'}</div></Field>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Organization / University"><div className={valueCls}>{user?.organization || '—'}</div></Field>
                                        <Field label="Department"><div className={valueCls}>{user?.department || '—'}</div></Field>
                                    </div>
                                    <Field label="ORCID iD"><div className={valueCls}>{user?.orcidId || '—'}</div></Field>
                                </div>
                            )}

                            {/* ACADEMIC */}
                            {activeTab === 'academic' && (
                                <div className="space-y-3 animate-slideInRight">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Highest Qualification"><div className={valueCls}>{user?.qualification || '—'}</div></Field>
                                        <Field label="Specialization"><div className={valueCls}>{user?.specialization || '—'}</div></Field>
                                    </div>
                                    <Field label="Research Interests">
                                        <div className={`${valueCls} min-h-[40px]`}>
                                            {user?.researchInterests && user.researchInterests.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {user.researchInterests.map(interest => (
                                                        <span key={interest} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-[11px] font-medium">{interest}</span>
                                                    ))}
                                                </div>
                                            ) : '—'}
                                        </div>
                                    </Field>
                                </div>
                            )}

                            {/* SOCIAL */}
                            {activeTab === 'social' && (
                                <div className="space-y-3 animate-slideInRight">
                                    {[
                                        { label: 'LinkedIn Profile URL', val: user?.linkedinProfile },
                                        { label: 'Twitter / X Profile URL', val: user?.twitterProfile },
                                        { label: 'Website / Portfolio URL', val: user?.website },
                                    ].map(({ label, val }) => (
                                        <Field key={label} label={label}>
                                            <div className={valueCls}>
                                                {val ? <a href={val} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">{val}</a> : '—'}
                                            </div>
                                        </Field>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => window.location.href = '/dashboard/profile/edit'}
                                className="flex items-center gap-1.5 px-5 py-1.5 bg-primary-600 text-white rounded-lg text-[13px] font-semibold shadow-sm hover:bg-primary-700 transition-all"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AlertPopup
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />

            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideInRight { animation: slideInRight 0.35s ease-out forwards; }
      `}</style>
        </div>
    );
}
