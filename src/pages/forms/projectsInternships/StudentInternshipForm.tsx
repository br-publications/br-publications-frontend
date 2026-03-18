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

interface InternshipData {
    name: string;
    email: string;
    phone: string;
    college: string;
    course: string;
    year: string;
    domain: string;
    message: string;
}

type TabType = 'personal' | 'academic' | 'review';

const StudentInternshipForm: React.FC = () => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>('personal');
    const [formData, setFormData] = useState<InternshipData>({
        name: '',
        email: '',
        phone: '',
        college: '',
        course: '',
        year: '',
        domain: '',
        message: ''
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
            const allowedRoles = ['user', 'student'];
            if (!allowedRoles.includes(userData.role)) {
                setIsAuthorized(false);
                setAlertConfig({
                    isOpen: true,
                    type: 'error',
                    title: 'Authorization Required',
                    message: 'You are not authorized to access this form. Only students are allowed to fill the form.'
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
        if (!value) return 'This field is required';

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
        const error = validateField(name, formData[name as keyof InternshipData]);
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
        const fieldsToValidate: (keyof InternshipData)[] = [];

        if (tab === 'personal') {
            fieldsToValidate.push('name', 'email', 'phone');
        } else if (tab === 'academic') {
            fieldsToValidate.push('college', 'course', 'year', 'domain', 'message');
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
        if (activeTab === 'personal') {
            if (validateTab('personal')) setActiveTab('academic');
            else showAlert('error', 'Validation Error', 'Please fill in all personal details correctly.');
        } else if (activeTab === 'academic') {
            if (validateTab('academic')) setActiveTab('review');
            else showAlert('error', 'Validation Error', 'Please complete the academic details section.');
        }
    };

    const handleBack = () => {
        if (activeTab === 'academic') setActiveTab('personal');
        else if (activeTab === 'review') setActiveTab('academic');
    };

    const showAlert = (type: AlertType, title: string, message: string) => {
        setAlertConfig({ isOpen: true, type, title, message });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting || isSubmittingRef.current) return;

        // Double check authorization before submission
        const userData = getStoredUser();
        const allowedRoles = ['user', 'student'];
        if (!userData || !allowedRoles.includes(userData.role)) {
            showAlert('error', 'Authorization Required', 'Only students are allowed to submit this form.');
            setIsAuthorized(false);
            setTimeout(() => navigate('/'), 2000);
            return;
        }

        setIsSubmitting(true);
        isSubmittingRef.current = true;

        try {
            await projectInternshipService.submitApplication({
                submissionType: 'INTERNSHIP',
                data: {
                    ...formData,
                    phone: `${countryCode}${formData.phone.replace(/\D/g, '')}`
                }
            });

            showAlert('success', 'Application Submitted', 'Thank you for your application! We will review it and get back to you.');
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
                <h1>Internship Program</h1>
                <p>Join us to gain hands-on experience and industry exposure</p>
            </section>

            <div className="project_wrapper">
                <div className="project_container">
                    {/* Tab Navigation */}
                    <div className="project_tabNavigation">
                        <button
                            type="button"
                            className={`project_tabButton ${activeTab === 'personal' ? 'active' : ''}`}
                            onClick={() => setActiveTab('personal')}
                        >
                            <div className="project_tabNumber">1</div>
                            <span className="project_tabLabel">Personal Details</span>
                        </button>
                        <button
                            type="button"
                            className={`project_tabButton ${activeTab === 'academic' ? 'active' : ''}`}
                            onClick={() => {
                                if (validateTab('personal')) setActiveTab('academic');
                            }}
                        >
                            <div className="project_tabNumber">2</div>
                            <span className="project_tabLabel">Academic Info</span>
                        </button>
                        <button
                            type="button"
                            className={`project_tabButton ${activeTab === 'review' ? 'active' : ''}`}
                            onClick={() => {
                                if (validateTab('personal') && validateTab('academic')) setActiveTab('review');
                            }}
                        >
                            <div className="project_tabNumber">3</div>
                            <span className="project_tabLabel">Review & Submit</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Tab 1: Personal Details */}
                        {activeTab === 'personal' && (
                            <div className="project_tabContent">
                                <h3 className="project_sectionTitle">Personal Information</h3>
                                <div className="project_formRow">
                                    <div className="project_formGroup full">
                                        <label>Your Name*</label>
                                        <input
                                            type="text" name="name" value={formData.name}
                                            onChange={handleChange} onBlur={() => handleBlur('name')}
                                            placeholder="e.g. John Doe"
                                        />
                                        {touched.name && errors.name && <span className="project_errorMessage">{errors.name}</span>}
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

                        {/* Tab 2: Academic Info */}
                        {activeTab === 'academic' && (
                            <div className="project_tabContent">
                                <h3 className="project_sectionTitle">Academic & Professional Interests</h3>
                                <div className="project_formRow">
                                    <div className="project_formGroup">
                                        <label>College/University*</label>
                                        <input
                                            type="text" name="college" value={formData.college}
                                            onChange={handleChange} onBlur={() => handleBlur('college')}
                                            placeholder="e.g. University of Technology"
                                        />
                                        {touched.college && errors.college && <span className="project_errorMessage">{errors.college}</span>}
                                    </div>
                                    <div className="project_formGroup">
                                        <label>Course*</label>
                                        <input
                                            type="text" name="course" value={formData.course}
                                            onChange={handleChange} onBlur={() => handleBlur('course')}
                                            placeholder="e.g. B.Tech Computer Science"
                                        />
                                        {touched.course && errors.course && <span className="project_errorMessage">{errors.course}</span>}
                                    </div>
                                </div>
                                <div className="project_formRow">
                                    <div className="project_formGroup">
                                        <label>Current Year*</label>
                                        <select
                                            name="year" value={formData.year}
                                            onChange={handleChange} onBlur={() => handleBlur('year')}
                                            className="project_select"
                                        >
                                            <option value="">Select Year</option>
                                            <option value="1st">1st Year</option>
                                            <option value="2nd">2nd Year</option>
                                            <option value="3rd">3rd Year</option>
                                            <option value="4th">4th Year / Final</option>
                                            <option value="graduated">Graduated</option>
                                        </select>
                                        {touched.year && errors.year && <span className="project_errorMessage">{errors.year}</span>}
                                    </div>
                                    <div className="project_formGroup">
                                        <label>Preferred Domain*</label>
                                        <input
                                            type="text" name="domain" value={formData.domain}
                                            onChange={handleChange} onBlur={() => handleBlur('domain')}
                                            placeholder="e.g. Full Stack, AI/ML, Data Science"
                                        />
                                        {touched.domain && errors.domain && <span className="project_errorMessage">{errors.domain}</span>}
                                    </div>
                                </div>
                                <div className="project_formGroup full">
                                    <label>Why do you want to join?*</label>
                                    <textarea
                                        name="message" value={formData.message}
                                        onChange={handleChange} onBlur={() => handleBlur('message')}
                                        rows={5}
                                        placeholder="Tell us about your interests, goals, and what you hope to achieve..."
                                    />
                                    {touched.message && errors.message && <span className="project_errorMessage">{errors.message}</span>}
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Review */}
                        {activeTab === 'review' && (
                            <div className="project_tabContent">
                                <h3 className="project_sectionTitle">Review Your Application</h3>
                                <div className="project_reviewSection">
                                    <div className="project_reviewHeader">
                                        <h4>Personal Information</h4>
                                        <button type="button" className="project_editBtn" onClick={() => setActiveTab('personal')}>Edit</button>
                                    </div>
                                    <div className="project_reviewGrid">
                                        <div className="project_reviewItem"><label>Name</label><span>{formData.name}</span></div>
                                        <div className="project_reviewItem"><label>Email</label><span>{formData.email}</span></div>
                                        <div className="project_reviewItem"><label>Phone</label><span>{countryCode} {formData.phone}</span></div>
                                    </div>
                                </div>
                                <div className="project_reviewSection">
                                    <div className="project_reviewHeader">
                                        <h4>Academic Details</h4>
                                        <button type="button" className="project_editBtn" onClick={() => setActiveTab('academic')}>Edit</button>
                                    </div>
                                    <div className="project_reviewGrid">
                                        <div className="project_reviewItem"><label>College</label><span>{formData.college}</span></div>
                                        <div className="project_reviewItem"><label>Course</label><span>{formData.course}</span></div>
                                        <div className="project_reviewItem"><label>Year</label><span>{formData.year}</span></div>
                                        <div className="project_reviewItem"><label>Domain</label><span>{formData.domain}</span></div>
                                        <div className="project_reviewItem full"><label>Motivation</label><span>{formData.message}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="project_actions">
                            <div>
                                {activeTab !== 'personal' && (
                                    <button type="button" className="project_prevBtn" onClick={handleBack}>
                                        <NavigateBefore /> Back
                                    </button>
                                )}
                            </div>
                            <div>
                                {activeTab !== 'review' ? (
                                    <button
                                        key="next-btn"
                                        type="button" className="project_nextBtn"
                                        onClick={handleNext}
                                    >
                                        Next <NavigateNext />
                                    </button>
                                ) : (
                                    <button
                                        key="submit-btn"
                                        type="submit" className="project_submitBtn"
                                        disabled={isSubmitting || !isAuthorized}
                                    >
                                        {isSubmitting ? (
                                            <>Submitting... <span className="project_btnSpinner"></span></>
                                        ) : (
                                            <>Submit Application <CheckCircle fontSize="small" /></>
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

export default StudentInternshipForm;
