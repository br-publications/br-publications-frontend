import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    NavigateNext,
    NavigateBefore,
    CheckCircle
} from '@mui/icons-material';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import authService from '../../../services/auth.service';
import { projectInternshipService } from '../../../services/projectInternship.service';
import { getStoredUser } from '../../../services/api.config';
import { COUNTRIES, type Country } from '../../../utils/countries';
import './projectInternshipForm.css';

interface MobileProjectData {
    name: string;
    email: string;
    phone: string;
    company: string;
    platform: string;
    timeline: string;
    description: string;
}

type TabType = 'contact' | 'details' | 'review';

const MobileDevelopmentForm: React.FC = () => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>('contact');
    const [formData, setFormData] = useState<MobileProjectData>({
        name: '',
        email: '',
        phone: '',
        company: '',
        platform: '',
        timeline: '',
        description: ''
    });

    const [countryCode, setCountryCode] = useState('+91');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);
    const [isAuthorized, setIsAuthorized] = useState(true);
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
    }>({ isOpen: false, type: 'info', title: '', message: '' });

    // Check authentication on mount
    useEffect(() => {
        if (!authService.isAuthenticated()) {
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Authentication Required',
                message: 'You must be logged in to access this form.'
            });
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            return;
        }

        const userData = getStoredUser();
        if (userData) {
            const allowedRoles = ['user', 'student', 'author'];
            if (!allowedRoles.includes(userData.role)) {
                setIsAuthorized(false);
                setAlertConfig({
                    isOpen: true,
                    type: 'error',
                    title: 'Authorization Required',
                    message: 'You do not have permission to access this form. Please create a new account to continue with the submission.'
                });
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            }
        }
    }, [navigate]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    useEffect(() => {
        if (alertConfig.isOpen) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [alertConfig.isOpen]);

    // Dropdown close logic
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

    const toggleDropdown = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isDropdownOpen) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const estimatedHeight = 280;
            setDropdownDirection(spaceBelow < estimatedHeight ? 'up' : 'down');
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleCountrySelect = (code: string) => {
        setCountryCode(code);
        setIsDropdownOpen(false);
    };

    const validateField = (name: string, value: any): string => {
        if (!value && name !== 'company') return 'This field is required';

        if (name === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) return 'Invalid email format';
        }

        if (name === 'phone' && value) {
            const digits = value.replace(/\D/g, '');
            if (digits.length < 10) return 'Phone number must be at least 10 digits';
        }

        return '';
    };

    const handleBlur = (name: string) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, formData[name as keyof MobileProjectData]);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'phone') {
            finalValue = value.replace(/\D/g, '');
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));

        if (touched[name]) {
            const error = validateField(name, finalValue);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const validateTab = (tab: TabType): boolean => {
        const fieldsToValidate: (keyof MobileProjectData)[] = [];

        if (tab === 'contact') {
            fieldsToValidate.push('name', 'email', 'phone', 'company');
        } else if (tab === 'details') {
            fieldsToValidate.push('platform', 'timeline', 'description');
        }

        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = { ...touched };
        let isValid = true;

        fieldsToValidate.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
            newTouched[field] = true;
        });

        setErrors(prev => ({ ...prev, ...newErrors }));
        setTouched(newTouched);
        return isValid;
    };

    const handleNext = () => {
        if (activeTab === 'contact') {
            if (validateTab('contact')) setActiveTab('details');
            else showAlert('error', 'Validation Error', 'Please fill in all contact details correctly.');
        } else if (activeTab === 'details') {
            if (validateTab('details')) setActiveTab('review');
            else showAlert('error', 'Validation Error', 'Please complete the app details section.');
        }
    };

    const handleBack = () => {
        if (activeTab === 'details') setActiveTab('contact');
        else if (activeTab === 'review') setActiveTab('details');
    };

    const showAlert = (type: AlertType, title: string, message: string) => {
        setAlertConfig({ isOpen: true, type, title, message });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting || isSubmittingRef.current) return;

        // Double check authorization before submission
        const userData = getStoredUser();
        const allowedRoles = ['user', 'student', 'author'];
        if (!userData || !allowedRoles.includes(userData.role)) {
            showAlert('error', 'Authorization Required', 'Only authorized users are allowed to submit this form.');
            setIsAuthorized(false);
            setTimeout(() => navigate('/'), 2000);
            return;
        }

        setIsSubmitting(true);
        isSubmittingRef.current = true;

        try {
            await projectInternshipService.submitApplication({
                submissionType: 'MOBILE',
                data: {
                    ...formData,
                    phone: `${countryCode}${formData.phone.replace(/\D/g, '')}`
                }
            });

            showAlert('success', 'Request Submitted', 'Thank you for your interest! We will contact you shortly.');
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (error: any) {
            console.error('Submission error:', error);
            showAlert('error', 'Submission Failed', error.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    return (
        <main>
            <section className="project_hero">
                <h1>Launch Your Mobile App</h1>
                <p>Let's build a powerful mobile experience for your users</p>
            </section>

            <div className="project_wrapper">
                <div className="project_container">
                    {/* Tab Navigation */}
                    <div className="project_tabNavigation">
                        <button
                            type="button"
                            className={`project_tabButton ${activeTab === 'contact' ? 'active' : ''}`}
                            onClick={() => setActiveTab('contact')}
                        >
                            <div className="project_tabNumber">1</div>
                            <span className="project_tabLabel">Contact Details</span>
                        </button>
                        <button
                            type="button"
                            className={`project_tabButton ${activeTab === 'details' ? 'active' : ''}`}
                            onClick={() => {
                                if (validateTab('contact')) setActiveTab('details');
                            }}
                        >
                            <div className="project_tabNumber">2</div>
                            <span className="project_tabLabel">App Details</span>
                        </button>
                        <button
                            type="button"
                            className={`project_tabButton ${activeTab === 'review' ? 'active' : ''}`}
                            onClick={() => {
                                if (validateTab('contact') && validateTab('details')) setActiveTab('review');
                            }}
                        >
                            <div className="project_tabNumber">3</div>
                            <span className="project_tabLabel">Review & Submit</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Tab 1: Contact Details */}
                        {activeTab === 'contact' && (
                            <div className="project_tabContent">
                                <h3 className="project_sectionTitle">Contact Information</h3>
                                <div className="project_formRow">
                                    <div className="project_formGroup">
                                        <label>Your Name*</label>
                                        <input
                                            type="text" name="name" value={formData.name}
                                            onChange={handleChange} onBlur={() => handleBlur('name')}
                                            placeholder="e.g. John Doe"
                                        />
                                        {touched.name && errors.name && <span className="project_errorMessage">{errors.name}</span>}
                                    </div>
                                    <div className="project_formGroup">
                                        <label>Company Name</label>
                                        <input
                                            type="text" name="company" value={formData.company}
                                            onChange={handleChange} onBlur={() => handleBlur('company')}
                                            placeholder="e.g. App Studio Inc."
                                        />
                                        {touched.company && errors.company && <span className="project_errorMessage">{errors.company}</span>}
                                    </div>
                                </div>
                                <div className="project_formRow">
                                    <div className="project_formGroup">
                                        <label>Email Address*</label>
                                        <input
                                            type="email" name="email" value={formData.email}
                                            onChange={handleChange} onBlur={() => handleBlur('email')}
                                            placeholder="e.g. john@example.com"
                                        />
                                        {touched.email && errors.email && <span className="project_errorMessage">{errors.email}</span>}
                                    </div>
                                    <div className="project_formGroup">
                                        <label>Phone Number*</label>
                                        <div className={`project_phone_input_group ${touched.phone && errors.phone ? 'error' : ''}`}>
                                            <div
                                                ref={dropdownRef}
                                                style={{ position: 'relative', width: '90px', flexShrink: 0 }}
                                            >
                                                <div
                                                    className="project_country_select"
                                                    onClick={toggleDropdown}
                                                    style={{
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '0 8px',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 600 }}>
                                                        {COUNTRIES.find((c: Country) => c.code === countryCode)?.iso} ({countryCode})
                                                    </span>
                                                    <span style={{ fontSize: '9px' }}>▼</span>
                                                </div>

                                                {isDropdownOpen && (
                                                    <div
                                                        className="project_country_options"
                                                        style={{
                                                            maxHeight: '220px',
                                                            width: '100px',
                                                            ...(dropdownDirection === 'up' ? { bottom: '100%' } : { top: '100%' })
                                                        }}
                                                    >
                                                        {COUNTRIES.map((c: Country) => (
                                                            <div
                                                                key={`${c.iso}-${c.code}`}
                                                                className="project_country_option"
                                                                onClick={() => handleCountrySelect(c.code)}
                                                            >
                                                                <span style={{ fontWeight: 'bold' }}>{c.iso}</span>
                                                                <span style={{ color: '#64748b' }}>{c.code}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                className="project_phone_field"
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    if (val.length <= 15) {
                                                        handleChange(e as any);
                                                    }
                                                }}
                                                onBlur={() => handleBlur('phone')}
                                                placeholder="e.g. 9876543210"
                                            />
                                        </div>
                                        {touched.phone && errors.phone && <span className="project_errorMessage">{errors.phone}</span>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: App Details */}
                        {activeTab === 'details' && (
                            <div className="project_tabContent">
                                <h3 className="project_sectionTitle">App Requirements</h3>
                                <div className="project_formRow">
                                    <div className="project_formGroup">
                                        <label>Platform Preference*</label>
                                        <select
                                            name="platform" value={formData.platform}
                                            onChange={handleChange} onBlur={() => handleBlur('platform')}
                                            className="project_select"
                                        >
                                            <option value="">Select Platform</option>
                                            <option value="ios">iOS Only</option>
                                            <option value="android">Android Only</option>
                                            <option value="both">Both iOS & Android (Cross-platform)</option>
                                            <option value="unsure">Not Sure Yet</option>
                                        </select>
                                        {touched.platform && errors.platform && <span className="project_errorMessage">{errors.platform}</span>}
                                    </div>
                                    <div className="project_formGroup">
                                        <label>Estimated Timeline*</label>
                                        <input
                                            type="text" name="timeline" value={formData.timeline}
                                            onChange={handleChange} onBlur={() => handleBlur('timeline')}
                                            placeholder="e.g. 3-6 months"
                                        />
                                        {touched.timeline && errors.timeline && <span className="project_errorMessage">{errors.timeline}</span>}
                                    </div>
                                </div>
                                <div className="project_formGroup full">
                                    <label>App Idea Description*</label>
                                    <textarea
                                        name="description" value={formData.description}
                                        onChange={handleChange} onBlur={() => handleBlur('description')}
                                        rows={5}
                                        placeholder="Describe your app concept, key features, target users, monetization strategy, etc."
                                    />
                                    {touched.description && errors.description && <span className="project_errorMessage">{errors.description}</span>}
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Review */}
                        {activeTab === 'review' && (
                            <div className="project_tabContent">
                                <h3 className="project_sectionTitle">Review Your Request</h3>
                                <div className="project_reviewSection">
                                    <div className="project_reviewHeader">
                                        <h4>Contact Information</h4>
                                        <button type="button" className="project_editBtn" onClick={() => setActiveTab('contact')}>Edit</button>
                                    </div>
                                    <div className="project_reviewGrid">
                                        <div className="project_reviewItem"><label>Name</label><span>{formData.name}</span></div>
                                        <div className="project_reviewItem"><label>Company</label><span>{formData.company}</span></div>
                                        <div className="project_reviewItem"><label>Email</label><span>{formData.email}</span></div>
                                        <div className="project_reviewItem"><label>Phone</label><span>{countryCode} {formData.phone}</span></div>
                                    </div>
                                </div>
                                <div className="project_reviewSection">
                                    <div className="project_reviewHeader">
                                        <h4>App Details</h4>
                                        <button type="button" className="project_editBtn" onClick={() => setActiveTab('details')}>Edit</button>
                                    </div>
                                    <div className="project_reviewGrid">
                                        <div className="project_reviewItem"><label>Platform</label><span style={{ textTransform: 'capitalize' }}>{formData.platform}</span></div>
                                        <div className="project_reviewItem"><label>Timeline</label><span>{formData.timeline}</span></div>
                                        <div className="project_reviewItem full"><label>Description</label><span>{formData.description}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="project_actions">
                            <div>
                                {activeTab !== 'contact' && (
                                    <button type="button" className="project_prevBtn" onClick={handleBack}>
                                        <NavigateBefore /> Back
                                    </button>
                                )}
                            </div>
                            <div>
                                {activeTab !== 'review' ? (
                                    <button
                                        key="next-btn"
                                        type="button"
                                        className="project_nextBtn"
                                        onClick={handleNext}
                                    >
                                        Next <NavigateNext />
                                    </button>
                                ) : (
                                    <button
                                        key="submit-btn"
                                        type="submit"
                                        className="project_submitBtn"
                                        disabled={isSubmitting || !isAuthorized}
                                    >
                                        {isSubmitting ? (
                                            <>Submitting... <span className="project_btnSpinner"></span></>
                                        ) : (
                                            <>Submit Request <CheckCircle fontSize="small" /></>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </main>
    );
};

export default MobileDevelopmentForm;
