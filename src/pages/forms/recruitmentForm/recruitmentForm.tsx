import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    NavigateNext,
    NavigateBefore,
    CheckCircle
} from '@mui/icons-material';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import { COUNTRIES, type Country } from '../../../utils/countries';
import './recruitmentForm.css';

// --- Types ---
interface RecruitmentData {
    firstName: string;
    lastName: string;
    designation: string;
    department: string;
    instituteName: string;
    email: string;
    phoneNumber: string;
    city: string;
    state: string;
    country: string;
    highestQualification: string;
    scopusId: string;
    biography: string;
    personalImage: File | null;
    appliedRole: 'editor' | 'reviewer' | '';
}

type TabType = 'personal' | 'educational' | 'review';

const RecruitmentForm: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // --- State ---
    const [activeTab, setActiveTab] = useState<TabType>('personal');
    const [formData, setFormData] = useState<RecruitmentData>({
        firstName: '',
        lastName: '',
        designation: '',
        department: '',
        instituteName: '',
        email: '',
        phoneNumber: '',
        city: '',
        state: '',
        country: '',
        highestQualification: '',
        scopusId: '',
        biography: '',
        personalImage: null,
        appliedRole: ''
    });

    // Handle query parameter for role
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const role = params.get('role');
        if (role === 'editor' || role === 'reviewer') {
            setFormData(prev => ({ ...prev, appliedRole: role as 'editor' | 'reviewer' }));
        }
    }, [location.search]);

    const [eligibilityLoading, setEligibilityLoading] = useState(true);
    const [isEligible, setIsEligible] = useState(true);
    const [eligibilityError, setEligibilityError] = useState('');

    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [declarationAccepted, setDeclarationAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
    }>({ isOpen: false, type: 'info', title: '', message: '' });

    const [countryCode, setCountryCode] = useState('+91');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scroll to top on tab change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    useEffect(() => {
        if (alertConfig.isOpen) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [alertConfig.isOpen]);

    // Dropdown close & positioning logic
    const toggleDropdown = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isDropdownOpen) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const estimatedHeight = 280; // roughly 8-10 items
            setDropdownDirection(spaceBelow < estimatedHeight ? 'up' : 'down');
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleCountrySelect = (code: string) => {
        setCountryCode(code);
        setIsDropdownOpen(false);
    };

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

    // Check Eligibility and Authentication
    useEffect(() => {
        const checkEligibility = async () => {
            setEligibilityLoading(true);
            try {
                const { isAuthenticated, getStoredUser } = await import('../../../services/api.config');
                const { recruitmentService } = await import('../../../services/recruitment.service');

                if (!isAuthenticated()) {
                    showAlert('info', 'Authentication Required', 'Please login to submit the recruitment form.');
                    setTimeout(() => navigate('/login'), 2000);
                    return;
                }

                const user = getStoredUser();

                // Pre-fill email
                if (user?.email) {
                    setFormData(prev => ({ ...prev, email: user.email }));
                }

                // Check role
                const allowedRoles = ['user', 'student'];
                if (!allowedRoles.includes(user.role)) {
                    setIsEligible(false);
                    setEligibilityError(`You do not have permission to access this form. Please create a new account to continue with the submission.`);
                    return;
                }

                // Check pending applications
                const myApps = await recruitmentService.getMyApplications();
                const pending = myApps.find(app => app.status === 'PENDING');
                if (pending) {
                    setIsEligible(false);
                    setEligibilityError('You already have a pending application under review.');
                    return;
                }

                setIsEligible(true);
            } catch (error) {
                console.error('Eligibility check failed:', error);
            } finally {
                setEligibilityLoading(false);
            }
        };

        checkEligibility();
    }, [navigate]);

    // --- Validation Logic ---
    const validateField = (name: string, value: any): string => {
        if (!value && ['firstName', 'lastName', 'designation', 'department', 'instituteName', 'email', 'phoneNumber', 'city', 'state', 'country', 'highestQualification', 'appliedRole'].includes(name)) {
            return 'This field is required';
        }
        if (name === 'appliedRole' && !value) return 'Please select a role to apply for';

        if (name === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) return 'Invalid email format';
        }

        if (name === 'phoneNumber' && value) {
            const phoneRegex = /^\+?\d{10,15}$/;
            if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) return 'Phone number must be at least 10 digits';
        }

        if (name === 'scopusId' && value) {
            if (!value.includes('http') && !value.includes('scopus.com')) {
                return 'Please include the full Scopus profile link';
            }
        }

        return '';
    };

    const handleBlur = (name: string) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, formData[name as keyof RecruitmentData]);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // If field was already touched, update error immediately
        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({ ...prev, personalImage: file }));
        setTouched(prev => ({ ...prev, personalImage: true }));
        const error = validateField('personalImage', file);
        setErrors(prev => ({ ...prev, personalImage: error }));
    };

    const validateTab = (tab: TabType): boolean => {
        const fieldsToValidate: (keyof RecruitmentData)[] = [];

        if (tab === 'personal') {
            fieldsToValidate.push(
                'firstName', 'lastName', 'designation', 'department',
                'instituteName', 'email', 'phoneNumber', 'city', 'state', 'country', 'appliedRole'
            );
        } else if (tab === 'educational') {
            fieldsToValidate.push('highestQualification', 'scopusId', 'biography', 'personalImage');
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

    // --- Navigation Handlers ---
    const handleNext = () => {
        if (activeTab === 'personal') {
            if (validateTab('personal')) setActiveTab('educational');
            else showAlert('error', 'Validation Error', 'Please fill in all personal information correctly.');
        } else if (activeTab === 'educational') {
            if (validateTab('educational')) setActiveTab('review');
            else showAlert('error', 'Validation Error', 'Please complete the educational qualification section.');
        }
    };

    const handleBack = () => {
        if (activeTab === 'educational') setActiveTab('personal');
        else if (activeTab === 'review') setActiveTab('educational');
    };

    const showAlert = (type: AlertType, title: string, message: string) => {
        setAlertConfig({ isOpen: true, type, title, message });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Double check eligibility before submission
        const { getStoredUser } = await import('../../../services/api.config');
        const user = getStoredUser();
        const allowedRoles = ['user', 'student'];
        if (!user || !allowedRoles.includes(user.role)) {
            showAlert('error', 'Authorization Required', 'Only authorized users (Students/Users) are allowed to submit this form.');
            setIsEligible(false);
            setTimeout(() => navigate('/dashboard'), 2000);
            return;
        }

        if (!declarationAccepted) {
            showAlert('warning', 'Agreement Required', 'Please accept the declaration to proceed.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { recruitmentService } = await import('../../../services/recruitment.service');
            const submissionData = {
                ...formData,
                phoneNumber: `${countryCode}${formData.phoneNumber.replace(/\D/g, '')}`
            };
            await recruitmentService.submitApplication(submissionData as any);

            showAlert('success', 'Application Submitted', 'Your recruitment application has been received successfully. You can track your status in your dashboard.');

            setTimeout(() => {
                navigate('/dashboard/user/recruitment'); // Or specific recruitment dashboard
            }, 3000);
        } catch (error: any) {
            showAlert('error', 'Submission Failed', error.message || 'Something went wrong. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main>
            <section className="recruitment_hero">
                <h1>Join Our Team</h1>
                <p>Submit your details to pursue career opportunities with us</p>
            </section>

            {eligibilityLoading ? (
                <div className="recruitment_loadingContainer">
                    <div className="recruitment_spinner"></div>
                    <p>Checking eligibility...</p>
                </div>
            ) : !isEligible ? (
                <div className="recruitment_errorContainer">
                    <div className="recruitment_errorIcon">⚠️</div>
                    <h2>Access Denied</h2>
                    <p>{eligibilityError}</p>
                </div>
            ) : (
                <div className="recruitment_wrapper">
                    <div className="recruitment_container">
                        {/* Tab Navigation */}
                        <div className="recruitment_tabNavigation">
                            <button
                                className={`recruitment_tabButton ${activeTab === 'personal' ? 'active' : ''}`}
                                onClick={() => setActiveTab('personal')}
                            >
                                <div className="recruitment_tabNumber">1</div>
                                <span className="recruitment_tabLabel">Personal Information</span>

                            </button>
                            <button
                                className={`recruitment_tabButton ${activeTab === 'educational' ? 'active' : ''}`}
                                onClick={() => {
                                    if (validateTab('personal')) setActiveTab('educational');
                                }}
                            >
                                <div className="recruitment_tabNumber">2</div>
                                <span className="recruitment_tabLabel">Educational Qualification</span>

                            </button>
                            <button
                                className={`recruitment_tabButton ${activeTab === 'review' ? 'active' : ''}`}
                                onClick={() => {
                                    if (validateTab('personal') && validateTab('educational')) setActiveTab('review');
                                }}
                            >
                                <div className="recruitment_tabNumber">3</div>
                                <span className="recruitment_tabLabel">Review & Submit</span>

                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Tab 1: Personal Information */}
                            {activeTab === 'personal' && (
                                <div className="recruitment_tabContent">
                                    <h3 className="recruitment_sectionTitle">Personal Information</h3>

                                    <div className="recruitment_formGroup full">
                                        <label>Position Applying For*</label>
                                        <select
                                            name="appliedRole"
                                            value={formData.appliedRole}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('appliedRole')}
                                            className="recruitment_select"
                                        >
                                            <option value="">-- Select a Role --</option>
                                            <option value="reviewer">Reviewer</option>
                                            <option value="editor">Editor</option>
                                        </select>
                                        {touched.appliedRole && errors.appliedRole && <span className="recruitment_errorMessage">{errors.appliedRole}</span>}
                                    </div>

                                    <div className="recruitment_formRow">
                                        <div className="recruitment_formGroup">
                                            <label>First Name*</label>
                                            <input
                                                type="text" name="firstName" value={formData.firstName}
                                                onChange={handleChange} onBlur={() => handleBlur('firstName')}
                                                placeholder="Enter first name"
                                            />
                                            {touched.firstName && errors.firstName && <span className="recruitment_errorMessage">{errors.firstName}</span>}
                                        </div>
                                        <div className="recruitment_formGroup">
                                            <label>Last Name*</label>
                                            <input
                                                type="text" name="lastName" value={formData.lastName}
                                                onChange={handleChange} onBlur={() => handleBlur('lastName')}
                                                placeholder="Enter last name"
                                            />
                                            {touched.lastName && errors.lastName && <span className="recruitment_errorMessage">{errors.lastName}</span>}
                                        </div>
                                    </div>

                                    <div className="recruitment_formRow">
                                        <div className="recruitment_formGroup">
                                            <label>Designation*</label>
                                            <input
                                                type="text" name="designation" value={formData.designation}
                                                onChange={handleChange} onBlur={() => handleBlur('designation')}
                                                placeholder="Current designation"
                                            />
                                            {touched.designation && errors.designation && <span className="recruitment_errorMessage">{errors.designation}</span>}
                                        </div>
                                        <div className="recruitment_formGroup">
                                            <label>Department*</label>
                                            <input
                                                type="text" name="department" value={formData.department}
                                                onChange={handleChange} onBlur={() => handleBlur('department')}
                                                placeholder="Assigned department"
                                            />
                                            {touched.department && errors.department && <span className="recruitment_errorMessage">{errors.department}</span>}
                                        </div>
                                    </div>

                                    <div className="recruitment_formGroup full">
                                        <label>College / Institute Name*</label>
                                        <input
                                            type="text" name="instituteName" value={formData.instituteName}
                                            onChange={handleChange} onBlur={() => handleBlur('instituteName')}
                                            placeholder="Full name of your institution"
                                        />
                                        {touched.instituteName && errors.instituteName && <span className="recruitment_errorMessage">{errors.instituteName}</span>}
                                    </div>

                                    <div className="recruitment_formRow">
                                        <div className="recruitment_formGroup">
                                            <label>Email ID* (Linked to your account)</label>
                                            <input
                                                type="email" name="email" value={formData.email}
                                                onChange={handleChange} onBlur={() => handleBlur('email')}
                                                placeholder="Example@domain.com"
                                                readOnly
                                                className="recruitment_inputReadOnly"
                                            />
                                            {touched.email && errors.email && <span className="recruitment_errorMessage">{errors.email}</span>}
                                        </div>
                                        <div className="recruitment_formGroup">
                                            <label>Phone Number*</label>
                                            <div className={`recruitment_phoneInputGroup ${touched.phoneNumber && errors.phoneNumber ? 'error' : ''}`}>
                                                <div
                                                    ref={dropdownRef}
                                                    className="recruitment_customDropdownContainer"
                                                >
                                                    <div
                                                        className="recruitment_countrySelect"
                                                        onClick={toggleDropdown}
                                                    >
                                                        <span>
                                                            {COUNTRIES.find((c: Country) => c.code === countryCode)?.iso} ({countryCode})
                                                        </span>
                                                        <span className="recruitment_dropdownArrow">▼</span>
                                                    </div>

                                                    {isDropdownOpen && (
                                                        <div className={`recruitment_countryOptions ${dropdownDirection}`}>
                                                            {COUNTRIES.map((c: Country) => (
                                                                <div
                                                                    key={`${c.iso}-${c.code}`}
                                                                    className="recruitment_countryOption"
                                                                    onClick={() => handleCountrySelect(c.code)}
                                                                >
                                                                    <span className="recruitment_iso">{c.iso}</span>
                                                                    <span className="recruitment_code">{c.code}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    type="tel" name="phoneNumber" value={formData.phoneNumber}
                                                    placeholder="Enter Phone Number"
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        if (val.length <= 15) {
                                                            setFormData(p => ({ ...p, phoneNumber: val }));
                                                            if (touched.phoneNumber) {
                                                                setErrors(prev => ({ ...prev, phoneNumber: validateField('phoneNumber', val) }));
                                                            }
                                                        }
                                                    }}
                                                    onBlur={() => handleBlur('phoneNumber')}
                                                />
                                            </div>
                                            {touched.phoneNumber && errors.phoneNumber && <span className="recruitment_errorMessage">{errors.phoneNumber}</span>}
                                        </div>
                                    </div>

                                    <div className="recruitment_formRow">
                                        <div className="recruitment_formGroup">
                                            <label>City*</label>
                                            <input
                                                type="text" name="city" value={formData.city}
                                                onChange={handleChange} onBlur={() => handleBlur('city')}
                                                placeholder="Enter city"
                                            />
                                            {touched.city && errors.city && <span className="recruitment_errorMessage">{errors.city}</span>}
                                        </div>
                                        <div className="recruitment_formGroup">
                                            <label>State*</label>
                                            <input
                                                type="text" name="state" value={formData.state}
                                                onChange={handleChange} onBlur={() => handleBlur('state')}
                                                placeholder="Enter state"
                                            />
                                            {touched.state && errors.state && <span className="recruitment_errorMessage">{errors.state}</span>}
                                        </div>
                                    </div>

                                    <div className="recruitment_formGroup">
                                        <label>Country*</label>
                                        <input
                                            type="text" name="country" value={formData.country}
                                            onChange={handleChange} onBlur={() => handleBlur('country')}
                                            placeholder="Enter country"
                                        />
                                        {touched.country && errors.country && <span className="recruitment_errorMessage">{errors.country}</span>}
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Educational Qualification */}
                            {activeTab === 'educational' && (
                                <div className="recruitment_tabContent">
                                    <h3 className="recruitment_sectionTitle">Educational Qualification & Profile</h3>

                                    <div className="recruitment_formGroup full">
                                        <label>Highest Qualification*</label>
                                        <input
                                            type="text" name="highestQualification" value={formData.highestQualification}
                                            onChange={handleChange} onBlur={() => handleBlur('highestQualification')}
                                            placeholder="e.g. Ph.D., Master's Degree, etc."
                                        />
                                        {touched.highestQualification && errors.highestQualification && <span className="recruitment_errorMessage">{errors.highestQualification}</span>}
                                    </div>

                                    <div className="recruitment_formGroup full">
                                        <label>Scopus ID with Link (Optional)</label>
                                        <input
                                            type="text" name="scopusId" value={formData.scopusId || ''}
                                            onChange={handleChange} onBlur={() => handleBlur('scopusId')}
                                            placeholder="Paste your Scopus profile URL here"
                                        />
                                        {touched.scopusId && errors.scopusId && <span className="recruitment_errorMessage">{errors.scopusId}</span>}
                                    </div>

                                    <div className="recruitment_formGroup full">
                                        <label>Biography (Optional)</label>
                                        <textarea
                                            name="biography" value={formData.biography || ''}
                                            onChange={handleChange} onBlur={() => handleBlur('biography')}
                                            rows={5} placeholder="Tell us about your professional background..."
                                        />
                                        {touched.biography && errors.biography && <span className="recruitment_errorMessage">{errors.biography}</span>}
                                    </div>

                                    <div className="recruitment_formGroup full">
                                        <label>Personal Image (Optional)</label>
                                        <div className="recruitment_fileInputContainer" onClick={() => fileInputRef.current?.click()}>
                                            <div className="recruitment_fileInputRow">
                                                <button type="button" className="recruitment_fileInputButton">
                                                    Select Image
                                                </button>
                                                <div className={`recruitment_fileNameDisplay ${formData.personalImage ? 'recruitment_hasFile' : ''}`}>
                                                    {formData.personalImage ? formData.personalImage.name : 'No file chosen'}
                                                </div>
                                            </div>
                                            <span className="recruitment_fileRecommendation">
                                                Dimension recommendation: 400x400 px (JPEG/PNG)
                                            </span>
                                            <input
                                                type="file" ref={fileInputRef}
                                                className="recruitment_hiddenInput"
                                                accept="image/*" onChange={handleFileChange}
                                            />
                                        </div>
                                        {touched.personalImage && errors.personalImage && <span className="recruitment_errorMessage">{errors.personalImage}</span>}
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Review & Submit */}
                            {activeTab === 'review' && (
                                <div className="recruitment_tabContent">
                                    <h3 className="recruitment_sectionTitle">Review & Submission</h3>

                                    <div className="recruitment_reviewSection">
                                        <div className="recruitment_reviewHeader">
                                            <h4>Personal Information</h4>
                                            <button type="button" className="recruitment_editBtn" onClick={() => setActiveTab('personal')}>Edit</button>
                                        </div>
                                        <div className="recruitment_reviewGrid">
                                            <div className="recruitment_reviewItem"><label>Applied As</label><span style={{ textTransform: 'capitalize' }}>{formData.appliedRole}</span></div>
                                            <div className="recruitment_reviewItem"><label>Name</label><span>{formData.firstName} {formData.lastName}</span></div>
                                            <div className="recruitment_reviewItem"><label>Designation</label><span>{formData.designation}</span></div>
                                            <div className="recruitment_reviewItem"><label>Department</label><span>{formData.department}</span></div>
                                            <div className="recruitment_reviewItem"><label>Email</label><span>{formData.email}</span></div>
                                            <div className="recruitment_reviewItem"><label>Phone</label><span>{countryCode} {formData.phoneNumber}</span></div>
                                            <div className="recruitment_reviewItem"><label>Location</label><span>{formData.city}, {formData.state}, {formData.country}</span></div>
                                        </div>
                                    </div>

                                    <div className="recruitment_reviewSection">
                                        <div className="recruitment_reviewHeader">
                                            <h4>Educational & Profile</h4>
                                            <button type="button" className="recruitment_editBtn" onClick={() => setActiveTab('educational')}>Edit</button>
                                        </div>
                                        <div className="recruitment_reviewGrid">
                                            <div className="recruitment_reviewItem"><label>Highest Qualification</label><span>{formData.highestQualification}</span></div>
                                            <div className="recruitment_reviewItem"><label>Image Uploaded</label><span>{formData.personalImage ? formData.personalImage.name : 'Not provided'}</span></div>
                                            <div className="recruitment_reviewItem full"><label>Scopus Link</label><span>{formData.scopusId || 'Not provided'}</span></div>
                                            <div className="recruitment_reviewItem full"><label>Biography</label><span>{formData.biography || 'Not provided'}</span></div>
                                        </div>
                                    </div>

                                    <div className="recruitment_declarationBox">
                                        <label className="recruitment_declarationCheckbox">
                                            <input
                                                type="checkbox" checked={declarationAccepted}
                                                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                                            />
                                            <div className="recruitment_declarationText">
                                                <strong>Declaration:</strong> I hereby declare that all the information provided above is true to the best of my knowledge and belief. I understand that any false information may lead to the rejection of my application.
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="recruitment_actions">
                                <div>
                                    {activeTab !== 'personal' && (
                                        <button type="button" className="recruitment_prevBtn" onClick={handleBack}>
                                            <NavigateBefore /> Back
                                        </button>
                                    )}
                                </div>
                                <div>
                                    {activeTab !== 'review' ? (
                                        <button
                                            key="next-btn"
                                            type="button" className="recruitment_nextBtn"
                                            onClick={handleNext}
                                        >
                                            Next <NavigateNext />
                                        </button>
                                    ) : (
                                        <button
                                            key="submit-btn"
                                            type="submit" className="recruitment_submitBtn"
                                            disabled={isSubmitting || !declarationAccepted || !isEligible}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Confirm & Submit Application'}
                                            <CheckCircle fontSize="small" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

export default RecruitmentForm;
