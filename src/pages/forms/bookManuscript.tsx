import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Add, Delete, NavigateNext, NavigateBefore, CheckCircle, Person, Group, Book, RateReview } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import type { SubmitTextBookRequest } from '../../pages/textBookSubmission/types/textBookTypes';
import { submitTextBook } from '../../services/textBookService';
import { authService } from '../../services/auth.service';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import { COUNTRIES, type Country } from '../../utils/countries';
import './bookManuscript.css';

// --- Types ---
interface Author {
  id: string; // Internal ID for UI
  title: string;
  firstName: string;
  lastName: string;
  institute: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  biography: string;
  image?: File | null;
}

interface BookDetails {
  title: string;
  contentFile?: File | null; // >10MB docx/doc/pdf
  fullTextFile?: File | null; // >20MB docx/doc/pdf, 300 pages
}

const AUTHOR_TITLES = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.'];

type TabType = 'author' | 'coauthors' | 'details' | 'review';

const BookManuscript: React.FC = () => {
  const navigate = useNavigate();

  // --- State ---
  const [activeTab, setActiveTab] = useState<TabType>('author');

  const [mainAuthor, setMainAuthor] = useState<Author>({
    id: 'main',
    title: '',
    firstName: '',
    lastName: '',
    institute: '',
    city: '',
    state: '',
    country: '',
    countryCode: '+91',
    phoneNumber: '',
    email: '',
    biography: '',
    image: null
  });

  const [coAuthors, setCoAuthors] = useState<Author[]>([]);

  const [bookDetails, setBookDetails] = useState<BookDetails>({
    title: ''
  });

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Dropdown states
  const [dropdownId, setDropdownId] = useState<string | null>(null);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Refs for file inputs
  const mainAuthorImageRef = useRef<HTMLInputElement>(null);
  const contentFileRef = useRef<HTMLInputElement>(null);
  const fullTextFileRef = useRef<HTMLInputElement>(null);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Auth and Role check
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      const allowedRoles = ['user', 'author'];

      if (!allowedRoles.includes(user.role)) {
        setIsAuthorized(false);
        setAlertConfig({
          isOpen: true,
          type: 'error',
          title: 'Authorization Required',
          message: 'You are not authorized to access this form. Only Authors or Users are allowed.'
        });

        // Redirect after a short delay so the user can see the alert
        const timer = setTimeout(() => {
          navigate('/');
        }, 3000);

        return () => clearTimeout(timer);
      } else {
        setMainAuthor(prev => ({ ...prev, email: user.email || '' }));
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Validation ---
  // --- Validation ---
  const validateField = (name: string, value: any): string => {
    if (name.includes('email') && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    }
    if (name.includes('phoneNumber') && value) {
      const digits = value.replace(/\D/g, '');
      if (!digits) return 'Phone number is required';
      if (digits.length < 10) return 'Phone number must be at least 10 digits';
    }
    if (!value) {
      if (name.includes('coAuthor.image') || name.includes('Optional')) return ''; // Optional
      return 'This field is required';
    }
    return '';
  };

  const handleBlur = (field: string, value: any) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const validateTab = (tab: TabType): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (tab === 'author') {
      if (!mainAuthor.title) newErrors['mainAuthor.title'] = 'Title is required';
      if (!mainAuthor.firstName) newErrors['mainAuthor.firstName'] = 'First Name is required';
      if (!mainAuthor.lastName) newErrors['mainAuthor.lastName'] = 'Last Name is required';
      if (!mainAuthor.institute) newErrors['mainAuthor.institute'] = 'Institute is required';
      if (!mainAuthor.city) newErrors['mainAuthor.city'] = 'City is required';
      if (!mainAuthor.state) newErrors['mainAuthor.state'] = 'State is required';
      if (!mainAuthor.country) newErrors['mainAuthor.country'] = 'Country is required';
      if (!mainAuthor.email) newErrors['mainAuthor.email'] = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mainAuthor.email)) newErrors['mainAuthor.email'] = 'Invalid email format';

      if (!mainAuthor.phoneNumber) newErrors['mainAuthor.phoneNumber'] = 'Phone Number is required';
      else {
        const digits = mainAuthor.phoneNumber.replace(/\D/g, '');
        if (digits.length < 10) newErrors['mainAuthor.phoneNumber'] = 'Min 10 digits required';
      }

      if (!mainAuthor.biography) newErrors['mainAuthor.biography'] = 'Biography is required';
      if (!mainAuthor.image) newErrors['mainAuthor.image'] = 'Author photo is required';
    }

    if (tab === 'coauthors') {
      coAuthors.forEach((author, index) => {
        if (!author.title) newErrors[`coAuthor.${index}.title`] = 'Title is required';
        if (!author.firstName) newErrors[`coAuthor.${index}.firstName`] = 'First Name is required';
        if (!author.lastName) newErrors[`coAuthor.${index}.lastName`] = 'Last Name is required';
        if (!author.institute) newErrors[`coAuthor.${index}.institute`] = 'Institute is required';
        if (!author.email) newErrors[`coAuthor.${index}.email`] = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author.email)) newErrors[`coAuthor.${index}.email`] = 'Invalid email format';

        // Co-author phone is optional in interface Author, but let's check input if it exists or if we enforce it
        // If we want co-author phone to be valid if present:
        if (author.phoneNumber) {
          const digits = author.phoneNumber.replace(/\D/g, '');
          if (digits.length < 10) newErrors[`coAuthor.${index}.phoneNumber`] = 'Min 10 digits required';
        }
      });
    }

    if (tab === 'details') {
      if (!bookDetails.title) newErrors['bookDetails.title'] = 'Book Title is required';
      if (!bookDetails.contentFile) newErrors['bookDetails.contentFile'] = 'Content file is required';
      if (!bookDetails.fullTextFile) newErrors['bookDetails.fullTextFile'] = 'Full Text book file is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Mark all fields in this tab as touched so errors show up
      const newTouched = { ...touched };
      Object.keys(newErrors).forEach(key => { newTouched[key] = true; });
      setTouched(newTouched);
      isValid = false;
    } else {
      setErrors({});
    }

    return isValid;
  };

  // --- Handlers ---
  const handleMainAuthorChange = (field: keyof Author, value: any) => {
    setMainAuthor(prev => ({ ...prev, [field]: value }));
    if (errors[`mainAuthor.${field}`]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[`mainAuthor.${field}`];
        return newErrs;
      });
    }
  };

  const handleCoAuthorChange = (index: number, field: keyof Author, value: any) => {
    setCoAuthors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    if (errors[`coAuthor.${index}.${field}`]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[`coAuthor.${index}.${field}`];
        return newErrs;
      });
    }
  };

  const addCoAuthor = () => {
    if (coAuthors.length >= 6) {
      setAlertConfig({
        isOpen: true,
        type: 'warning',
        title: 'Maximum Co-Authors',
        message: 'You can add a maximum of 6 co-authors.'
      });
      return;
    }
    setCoAuthors(prev => [...prev, {
      id: `co-${Date.now()}`,
      title: '',
      firstName: '',
      lastName: '',
      institute: '',
      city: '',
      state: '',
      country: '',
      countryCode: '+91',
      phoneNumber: '',
      email: '',
      biography: '',
      image: null
    }]);
  };

  const removeCoAuthor = (index: number) => {
    setCoAuthors(prev => prev.filter((_, i) => i !== index));
    // Clear errors for removed author (simplification: clear all co-author errors to be safe or re-validate)
    setErrors(prev => {
      const newErrs = { ...prev };
      Object.keys(newErrs).forEach(key => {
        if (key.startsWith('coAuthor.')) delete newErrs[key];
      });
      return newErrs;
    });
  };

  const handleBookChange = (field: keyof BookDetails, value: any) => {
    setBookDetails(prev => ({ ...prev, [field]: value }));
    if (errors[`bookDetails.${field}`]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[`bookDetails.${field}`];
        return newErrs;
      });
    }
  };

  // File Handlers
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'mainAuthorImage' | 'contentFile' | 'fullTextFile',
    coAuthorIndex?: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    let isValid = true;
    let errorMsg = '';

    if (target === 'contentFile') {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        isValid = false;
        errorMsg = 'Content file must be under 10MB';
      }
    } else if (target === 'fullTextFile') {
      if (file.size > 20 * 1024 * 1024) { // 20MB
        isValid = false;
        errorMsg = 'Full text file must be under 20MB';
      }
    }

    if (!isValid) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'File Too Large',
        message: errorMsg
      });
      e.target.value = ''; // Reset input
      return;
    }

    if (target === 'mainAuthorImage') {
      handleMainAuthorChange('image', file);
    } else if (target === 'contentFile') {
      handleBookChange('contentFile', file);
    } else if (target === 'fullTextFile') {
      handleBookChange('fullTextFile', file);
    } else if (target === 'mainAuthorImage' && coAuthorIndex !== undefined) {
      handleCoAuthorChange(coAuthorIndex, 'image', file);
    }
  };

  const handleCoAuthorImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) handleCoAuthorChange(index, 'image', file);
  };

  const handleNextTab = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const tabs: TabType[] = ['author', 'coauthors', 'details', 'review'];
    const currentIndex = tabs.indexOf(activeTab);

    if (activeTab === 'author' && !validateTab('author')) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required author fields correctly.'
      });
      return;
    }

    if (activeTab === 'coauthors' && coAuthors.length > 0 && !validateTab('coauthors')) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required co-author fields correctly.'
      });
      return;
    }

    if (activeTab === 'details' && !validateTab('details')) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required book details correctly.'
      });
      return;
    }

    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handlePrevTab = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const tabs: TabType[] = ['author', 'coauthors', 'details', 'review'];
    const currentIndex = tabs.indexOf(activeTab);

    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleTabClick = (tab: TabType) => {
    // Prevent navigation if current tab is invalid
    if (activeTab === 'author' && !validateTab('author')) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required author fields correctly.'
      });
      return;
    }

    if (activeTab === 'coauthors' && coAuthors.length > 0 && !validateTab('coauthors')) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required co-author fields correctly.'
      });
      return;
    }

    if (activeTab === 'details' && !validateTab('details')) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required book details correctly.'
      });
      return;
    }

    setActiveTab(tab);
  };

  const toggleDropdown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (dropdownId === id) {
      setDropdownId(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const estimatedHeight = 280; // roughly 8-10 items
      setDropdownDirection(spaceBelow < estimatedHeight ? 'up' : 'down');
      setDropdownId(id);
    }
  };

  const handleCountrySelect = (authorType: 'main' | 'co', index: number, country: Country) => {
    if (authorType === 'main') {
      handleMainAuthorChange('countryCode', country.code);
    } else {
      handleCoAuthorChange(index, 'countryCode', country.code);
    }
    setDropdownId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab !== 'review') return;

    if (!declarationAccepted) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Declaration Required',
        message: 'Please accept the declaration before submitting.'
      });
      return;
    }

    // Final validation
    if (!validateTab('author') || (coAuthors.length > 0 && !validateTab('coauthors')) || !validateTab('details')) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please correct all errors before submitting.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Map form data to API request types
      // Note: We need to cast to any first because our form Author type has extra fields (title) 
      // and missing fields (designation, departmentName) compared to the API type
      const submissionData: SubmitTextBookRequest = {
        mainAuthor: {
          ...mainAuthor,
          firstName: mainAuthor.firstName,
          lastName: mainAuthor.lastName,
          email: mainAuthor.email,
          phoneNumber: `${mainAuthor.countryCode}${mainAuthor.phoneNumber.replace(/\D/g, '')}`,
          // Provide default values for required fields not in form
          designation: '',
          departmentName: '',
          instituteName: mainAuthor.institute,
          city: mainAuthor.city,
          state: mainAuthor.state,
          country: mainAuthor.country,
          isCorrespondingAuthor: true
        } as any,
        coAuthors: coAuthors.length > 0 ? coAuthors.map(ca => ({
          ...ca,
          firstName: ca.firstName,
          lastName: ca.lastName,
          email: ca.email,
          phoneNumber: ca.phoneNumber ? `${ca.countryCode}${ca.phoneNumber.replace(/\D/g, '')}` : '',
          designation: '',
          departmentName: '',
          instituteName: ca.institute,
          city: ca.city,
          state: ca.state,
          country: ca.country,
          isCorrespondingAuthor: false
        } as any)) : null,
        bookTitle: bookDetails.title,
        contentFile: bookDetails.contentFile || undefined,
        fullTextFile: bookDetails.fullTextFile || undefined
      };

      await submitTextBook(submissionData);

      setAlertConfig({
        isOpen: true,
        type: 'success',
        title: 'Submission Successful',
        message: 'Your book content has been submitted successfully! We will review it shortly.'
      });

      // Refresh user profile to update role (User -> Author)
      try {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          localStorage.setItem('user', JSON.stringify(userResponse.data));
          // Dispatch event to notify Header/Dashboard of role change
          window.dispatchEvent(new Event('auth-changed'));
        }
      } catch (authError) {
        console.error('⚠️ Failed to refresh user profile:', authError);
      }

      // Navigate after delay
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/dashboard/author/textbooks');
      }, 2000);

    } catch (error: any) {
      console.error('Submission error:', error);
      setIsSubmitting(false);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Failed to submit manuscript. Please try again.'
      });
    }
  };

  return (
    <main>
      <section className="textBook_hero">
        <h1>Submit Book Content</h1>
        <p>Start your publishing journey with us</p>
      </section>

      <div className="textBook_wrapper">
        <div className="textBook_container">
          {/* Tab Navigation */}
          <div className="textBook_tabNavigation">
            <button
              className={`textBook_tabButton ${activeTab === 'author' ? 'active' : ''}`}
              onClick={() => handleTabClick('author')}
            >
              <div className="textBook_tabNumber">1</div>
              <span className="textBook_tabLabel">Main Author</span>
            </button>
            <button
              className={`textBook_tabButton ${activeTab === 'coauthors' ? 'active' : ''}`}
              onClick={() => handleTabClick('coauthors')}
            >
              <div className="textBook_tabNumber">2</div>
              <span className="textBook_tabLabel">Co-Authors</span>
            </button>
            <button
              className={`textBook_tabButton ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => handleTabClick('details')}
            >
              <div className="textBook_tabNumber">3</div>
              <span className="textBook_tabLabel">Book Details</span>
            </button>
            <button
              className={`textBook_tabButton ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => handleTabClick('review')}
            >
              <div className="textBook_tabNumber">4</div>
              <span className="textBook_tabLabel">Review</span>
            </button>
          </div>

          <form className="textBook_submitSection" onSubmit={handleSubmit}>
            {/* Step 1: Main Author */}
            {activeTab === 'author' && (
              <div className="textBook_tabContent">
                <h3 className="textBook_sectionTitle">Main Author Details</h3>

                <div className="textBook_formRow">
                  <div className="textBook_formGroup">
                    <label>Title*</label>
                    <select
                      value={mainAuthor.title}
                      onChange={(e) => handleMainAuthorChange('title', e.target.value)}
                      onBlur={(e) => handleBlur('mainAuthor.title', e.target.value)}
                    >
                      <option value="">Select Title</option>
                      {AUTHOR_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {touched['mainAuthor.title'] && errors['mainAuthor.title'] && <span className="textBook_errorMessage">{errors['mainAuthor.title']}</span>}
                  </div>
                  <div className="textBook_formGroup">
                    {/* Empty spacer or remove if single column flow is preferred, but formRow implies 2 cols */}
                  </div>
                </div>

                <div className="textBook_formRow">
                  <div className="textBook_formGroup">
                    <label>First Name*</label>
                    <input
                      type="text"
                      value={mainAuthor.firstName}
                      onChange={(e) => handleMainAuthorChange('firstName', e.target.value)}
                      onBlur={(e) => handleBlur('mainAuthor.firstName', e.target.value)}
                      placeholder="e.g. John"
                    />
                    {touched['mainAuthor.firstName'] && errors['mainAuthor.firstName'] && <span className="textBook_errorMessage">{errors['mainAuthor.firstName']}</span>}
                  </div>
                  <div className="textBook_formGroup">
                    <label>Last Name*</label>
                    <input
                      type="text"
                      value={mainAuthor.lastName}
                      onChange={(e) => handleMainAuthorChange('lastName', e.target.value)}
                      onBlur={(e) => handleBlur('mainAuthor.lastName', e.target.value)}
                      placeholder="e.g. Doe"
                    />
                    {touched['mainAuthor.lastName'] && errors['mainAuthor.lastName'] && <span className="textBook_errorMessage">{errors['mainAuthor.lastName']}</span>}
                  </div>
                </div>

                <div className="textBook_formRow">
                  <div className="textBook_formGroup">
                    <label>Institute / University*</label>
                    <input
                      type="text"
                      value={mainAuthor.institute}
                      onChange={(e) => handleMainAuthorChange('institute', e.target.value)}
                      onBlur={(e) => handleBlur('mainAuthor.institute', e.target.value)}
                      placeholder="e.g. Harvard Medical School"
                    />
                    {touched['mainAuthor.institute'] && errors['mainAuthor.institute'] && <span className="textBook_errorMessage">{errors['mainAuthor.institute']}</span>}
                  </div>
                  <div className="textBook_formGroup">
                    <label>City*</label>
                    <input
                      type="text"
                      value={mainAuthor.city}
                      onChange={(e) => handleMainAuthorChange('city', e.target.value)}
                      onBlur={(e) => handleBlur('mainAuthor.city', e.target.value)}
                      placeholder="e.g. Boston"
                    />
                    {touched['mainAuthor.city'] && errors['mainAuthor.city'] && <span className="textBook_errorMessage">{errors['mainAuthor.city']}</span>}
                  </div>
                </div>

                <div className="textBook_formRow">
                  <div className="textBook_formGroup">
                    <label>State*</label>
                    <input
                      type="text"
                      value={mainAuthor.state}
                      onChange={(e) => handleMainAuthorChange('state', e.target.value)}
                      onBlur={(e) => handleBlur('mainAuthor.state', e.target.value)}
                      placeholder="e.g. MA"
                    />
                    {touched['mainAuthor.state'] && errors['mainAuthor.state'] && <span className="textBook_errorMessage">{errors['mainAuthor.state']}</span>}
                  </div>
                  <div className="textBook_formGroup">
                    <label>Country*</label>
                    <input
                      type="text"
                      value={mainAuthor.country}
                      onChange={(e) => handleMainAuthorChange('country', e.target.value)}
                      onBlur={(e) => handleBlur('mainAuthor.country', e.target.value)}
                      placeholder="e.g. USA"
                    />
                    {touched['mainAuthor.country'] && errors['mainAuthor.country'] && <span className="textBook_errorMessage">{errors['mainAuthor.country']}</span>}
                  </div>
                </div>

                <div className="textBook_formRow">
                  <div className="textBook_formGroup">
                    <label>Email*</label>
                    <input
                      type="email"
                      value={mainAuthor.email}
                      readOnly
                      disabled
                      style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#666' }}
                      title="Email is automatically filled from your account"
                      placeholder="e.g. john.doe@example.com"
                    />
                    {touched['mainAuthor.email'] && errors['mainAuthor.email'] && <span className="textBook_errorMessage">{errors['mainAuthor.email']}</span>}
                  </div>
                  <div className="textBook_formGroup">
                    <label>Phone Number*</label>
                    <div className="textBook_phoneInputGroup">
                      <div className="textBook_countryDropdown" ref={dropdownId === 'mainAuthor' ? dropdownRef : null}>
                        <div className="textBook_countrySelect" onClick={(e) => toggleDropdown(e, 'mainAuthor')}>
                          <span>{COUNTRIES.find(c => c.code === mainAuthor.countryCode)?.iso} ({mainAuthor.countryCode})</span>
                          <span className="textBook_dropdownArrow">▼</span>
                        </div>
                        {dropdownId === 'mainAuthor' && (
                          <div className={`textBook_countryOptions ${dropdownDirection}`}>
                            {COUNTRIES.map(c => (
                              <div key={c.iso} className="textBook_countryOption" onClick={() => handleCountrySelect('main', 0, c)}>
                                <span className="textBook_iso">{c.iso}</span>
                                <span className="textBook_code">{c.code}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="tel"
                        value={mainAuthor.phoneNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 15) handleMainAuthorChange('phoneNumber', val);
                        }}
                        onBlur={(e) => handleBlur('mainAuthor.phoneNumber', e.target.value)}
                        placeholder="Enter Phone Number"
                      />
                    </div>
                    {touched['mainAuthor.phoneNumber'] && errors['mainAuthor.phoneNumber'] && <span className="textBook_errorMessage">{errors['mainAuthor.phoneNumber']}</span>}
                  </div>
                </div>

                <div className="textBook_formGroup full">
                  <label>Author Photo*</label>
                  <div className="textBook_fileInputContainer">
                    <button type="button" className="textBook_fileInputButton" onClick={() => mainAuthorImageRef.current?.click()}>
                      <Upload fontSize="small" style={{ marginRight: 8 }} /> Upload Author Image
                    </button>
                    <input
                      type="file"
                      className="textBook_fileInputHidden"
                      ref={mainAuthorImageRef}
                      onChange={(e) => handleFileChange(e, 'mainAuthorImage')}
                      accept="image/*"
                    />

                    <div className={`textBook_fileNameDisplay ${mainAuthor.image ? 'textBook_hasFile' : ''}`}>
                      {mainAuthor.image ? mainAuthor.image.name : 'No file chosen'}
                    </div>
                  </div>
                  {touched['mainAuthor.image'] && errors['mainAuthor.image'] && <span className="textBook_errorMessage">{errors['mainAuthor.image']}</span>}
                </div>

                <div className="textBook_formGroup full">
                  <label>Biography*</label>
                  <textarea
                    value={mainAuthor.biography}
                    onChange={(e) => handleMainAuthorChange('biography', e.target.value)}
                    placeholder="e.g. Dr. John Doe is a professor of Computer Science at Harvard University with over 15 years of experience in AI and Machine Learning..."
                  />
                  {errors['mainAuthor.biography'] && <span className="textBook_errorMessage">{errors['mainAuthor.biography']}</span>}
                </div>
              </div>
            )}

            {/* Step 2: Co-Authors */}
            {activeTab === 'coauthors' && (
              <div className="textBook_tabContent">
                <h3 className="textBook_sectionTitle">Co-Authors</h3>

                {coAuthors.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontStyle: 'italic' }}>
                    <p>No co-authors added yet.</p>
                    <p>Click the "Add Co-Author" button below to add co-authors involved in this book.</p>
                  </div>
                )}

                {coAuthors.map((author, index) => (
                  <div key={author.id} className="textBook_coAuthorContainer">
                    <div className="textBook_coAuthorHeader">
                      <h3>Co-Author {index + 1}</h3>
                      <button type="button" className="textBook_deleteCoAuthorBtn" onClick={() => removeCoAuthor(index)}>
                        <Delete fontSize="small" />
                      </button>
                    </div>

                    <div className="textBook_formRow">
                      <div className="textBook_formGroup">
                        <label>Title*</label>
                        <select value={author.title} onChange={(e) => handleCoAuthorChange(index, 'title', e.target.value)}>
                          <option value="">Select Title</option>
                          {AUTHOR_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {errors[`coAuthor.${index}.title`] && <span className="textBook_errorMessage">{errors[`coAuthor.${index}.title`]}</span>}
                      </div>
                      <div className="textBook_formGroup">
                        {/* Spacer */}
                      </div>
                    </div>

                    <div className="textBook_formRow">
                      <div className="textBook_formGroup">
                        <label>First Name*</label>
                        <input type="text" value={author.firstName} onChange={(e) => handleCoAuthorChange(index, 'firstName', e.target.value)} placeholder="e.g. Jane" />
                        {errors[`coAuthor.${index}.firstName`] && <span className="textBook_errorMessage">{errors[`coAuthor.${index}.firstName`]}</span>}
                      </div>
                      <div className="textBook_formGroup">
                        <label>Last Name*</label>
                        <input type="text" value={author.lastName} onChange={(e) => handleCoAuthorChange(index, 'lastName', e.target.value)} placeholder="e.g. Smith" />
                        {errors[`coAuthor.${index}.lastName`] && <span className="textBook_errorMessage">{errors[`coAuthor.${index}.lastName`]}</span>}
                      </div>
                    </div>

                    <div className="textBook_formRow">
                      <div className="textBook_formGroup">
                        <label>Institute*</label>
                        <input type="text" value={author.institute} onChange={(e) => handleCoAuthorChange(index, 'institute', e.target.value)} placeholder="e.g. Oxford University" />
                        {errors[`coAuthor.${index}.institute`] && <span className="textBook_errorMessage">{errors[`coAuthor.${index}.institute`]}</span>}
                      </div>
                      <div className="textBook_formGroup">
                        <label>City</label>
                        <input type="text" value={author.city} onChange={(e) => handleCoAuthorChange(index, 'city', e.target.value)} placeholder="e.g. London" />
                      </div>
                    </div>

                    <div className="textBook_formRow">
                      <div className="textBook_formGroup">
                        <label>State</label>
                        <input type="text" value={author.state} onChange={(e) => handleCoAuthorChange(index, 'state', e.target.value)} placeholder="e.g. Greater London" />
                      </div>
                      <div className="textBook_formGroup">
                        <label>Country</label>
                        <input
                          type="text"
                          value={author.country}
                          onChange={(e) => handleCoAuthorChange(index, 'country', e.target.value)}
                          placeholder="e.g. UK"
                        />
                      </div>
                    </div>

                    <div className="textBook_formRow">
                      <div className="textBook_formGroup">
                        <label>Email*</label>
                        <input type="text" value={author.email} onChange={(e) => handleCoAuthorChange(index, 'email', e.target.value)} placeholder="e.g. jane.smith@example.com" />
                        {errors[`coAuthor.${index}.email`] && <span className="textBook_errorMessage">{errors[`coAuthor.${index}.email`]}</span>}
                      </div>
                      <div className="textBook_formGroup">
                        <label>Phone Number</label>
                        <div className="textBook_phoneInputGroup">
                          <div className="textBook_countryDropdown" ref={dropdownId === `coAuthor-${index}` ? dropdownRef : null}>
                            <div className="textBook_countrySelect" onClick={(e) => toggleDropdown(e, `coAuthor-${index}`)}>
                              <span>{COUNTRIES.find(c => c.code === author.countryCode)?.iso} ({author.countryCode})</span>
                              <span className="textBook_dropdownArrow">▼</span>
                            </div>
                            {dropdownId === `coAuthor-${index}` && (
                              <div className={`textBook_countryOptions ${dropdownDirection}`}>
                                {COUNTRIES.map(c => (
                                  <div key={c.iso} className="textBook_countryOption" onClick={() => handleCountrySelect('co', index, c)}>
                                    <span className="textBook_iso">{c.iso}</span>
                                    <span className="textBook_code">{c.code}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <input
                            type="tel"
                            value={author.phoneNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 15) handleCoAuthorChange(index, 'phoneNumber', val);
                            }}
                            onBlur={(e) => handleBlur(`coAuthor.${index}.phoneNumber`, e.target.value)}
                            placeholder="Enter Phone Number"
                          />
                        </div>
                        {touched[`coAuthor.${index}.phoneNumber`] && errors[`coAuthor.${index}.phoneNumber`] && <span className="textBook_errorMessage">{errors[`coAuthor.${index}.phoneNumber`]}</span>}
                      </div>
                    </div>

                    <div className="textBook_formGroup full">
                      <label>Biography</label>
                      <textarea rows={3} value={author.biography} onChange={(e) => handleCoAuthorChange(index, 'biography', e.target.value)} placeholder="e.g. Dr. Jane Smith specializes in Astrophysics and has published several papers..." />
                    </div>

                    <div className="textBook_formGroup full">
                      <label>Photo</label>
                      <div className="textBook_fileInputContainer">
                        <button type="button" className="textBook_fileInputButton" onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.click()}>
                          <Upload fontSize="small" style={{ marginRight: 8 }} /> Co-Author Image
                          <input type="file" className="textBook_fileInputHidden" accept="image/*" onChange={(e) => handleCoAuthorImageChange(e, index)} />
                        </button>
                        <div className={`textBook_fileNameDisplay ${author.image ? 'textBook_hasFile' : ''}`}>
                          {author.image ? author.image.name : 'No file chosen'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" className="textBook_addCoAuthorBtn" onClick={addCoAuthor}>
                  <Add /> Add Co-Author
                </button>
              </div>
            )}

            {/* Step 3: Book Details */}
            {activeTab === 'details' && (
              <div className="textBook_tabContent">
                <h3 className="textBook_sectionTitle">Book Details</h3>

                <div className="textBook_formGroup full">
                  <label>Text Book Title*</label>
                  <input
                    type="text"
                    value={bookDetails.title}
                    onChange={(e) => handleBookChange('title', e.target.value)}
                    placeholder="e.g. Advanced Quantum Mechanics"
                  />
                  {errors['bookDetails.title'] && <span className="textBook_errorMessage">{errors['bookDetails.title']}</span>}
                </div>

                <div className="textBook_formGroup full">
                  <label>Upload Content (&gt;10MB DOCX/PDF)*</label>
                  <div className="textBook_fileInputContainer">
                    <button type="button" className="textBook_fileInputButton" onClick={() => contentFileRef.current?.click()}>
                      <Upload fontSize="small" style={{ marginRight: 8 }} /> Upload Content
                    </button>
                    <input
                      type="file"
                      className="textBook_fileInputHidden"
                      ref={contentFileRef}
                      accept=".doc,.docx,.pdf"
                      onChange={(e) => handleFileChange(e, 'contentFile')}
                    />
                    <div className={`textBook_fileNameDisplay ${bookDetails.contentFile ? 'textBook_hasFile' : ''}`}>
                      {bookDetails.contentFile ? bookDetails.contentFile.name : 'No file chosen'}
                    </div>
                  </div>
                  {errors['bookDetails.contentFile'] && <span className="textBook_errorMessage">{errors['bookDetails.contentFile']}</span>}
                </div>

                <div className="textBook_formGroup full">
                  <label>Upload Full Text Book (&gt;20MB or 300 Pages)*</label>
                  <div className="textBook_fileInputContainer">
                    <button type="button" className="textBook_fileInputButton" onClick={() => fullTextFileRef.current?.click()}>
                      <Upload fontSize="small" style={{ marginRight: 8 }} /> Upload Full Text
                    </button>
                    <input
                      type="file"
                      className="textBook_fileInputHidden"
                      ref={fullTextFileRef}
                      accept=".doc,.docx,.pdf"
                      onChange={(e) => handleFileChange(e, 'fullTextFile')}
                    />
                    <div className={`textBook_fileNameDisplay ${bookDetails.fullTextFile ? 'textBook_hasFile' : ''}`}>
                      {bookDetails.fullTextFile ? bookDetails.fullTextFile.name : 'No file chosen'}
                    </div>
                  </div>
                  {errors['bookDetails.fullTextFile'] && <span className="textBook_errorMessage">{errors['bookDetails.fullTextFile']}</span>}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {activeTab === 'review' && (
              <div className="textBook_tabContent">
                <h3 className="textBook_sectionTitle">Review Submission</h3>

                <div className="textBook_reviewSection">
                  <h4>Main Author</h4>
                  <div className="textBook_reviewGrid">
                    <div className="textBook_reviewItem"><label>Name:</label> <p>{mainAuthor.title} {mainAuthor.firstName} {mainAuthor.lastName}</p></div>
                    <div className="textBook_reviewItem"><label>Institute:</label> <p>{mainAuthor.institute}</p></div>
                    <div className="textBook_reviewItem"><label>City:</label> <p>{mainAuthor.city}</p></div>
                    <div className="textBook_reviewItem"><label>State:</label> <p>{mainAuthor.state}</p></div>
                    <div className="textBook_reviewItem"><label>Country:</label> <p>{mainAuthor.country || '-'}</p></div>
                    <div className="textBook_reviewItem"><label>Email:</label> <p>{mainAuthor.email}</p></div>
                    <div className="textBook_reviewItem"><label>Phone:</label> <p>{mainAuthor.phoneNumber}</p></div>
                    <div className="textBook_reviewItem"><label>Photo:</label> <p>{mainAuthor.image ? mainAuthor.image.name : 'Not provided'}</p></div>
                    <div className="textBook_reviewItem full"><label>Biography:</label> <p>{mainAuthor.biography}</p></div>
                  </div>
                </div>

                {coAuthors.length > 0 && (
                  <div className="textBook_reviewSection">
                    <h4>Co-Authors ({coAuthors.length})</h4>
                    {coAuthors.map((author, i) => (
                      <div key={i} className="textBook_coAuthorReviewItem">
                        <h5>Co-Author {i + 1}: {author.title} {author.firstName} {author.lastName}</h5>
                        <div className="textBook_reviewGrid">
                          <div className="textBook_reviewItem"><label>Institute:</label> <p>{author.institute}</p></div>
                          <div className="textBook_reviewItem"><label>City:</label> <p>{author.city || '-'}</p></div>
                          <div className="textBook_reviewItem"><label>State:</label> <p>{author.state || '-'}</p></div>
                          <div className="textBook_reviewItem"><label>Country:</label> <p>{author.country || '-'}</p></div>
                          <div className="textBook_reviewItem"><label>Email:</label> <p>{author.email}</p></div>
                          <div className="textBook_reviewItem"><label>Phone:</label> <p>{author.phoneNumber || '-'}</p></div>
                          <div className="textBook_reviewItem"><label>Photo:</label> <p>{author.image ? author.image.name : 'Not provided'}</p></div>
                          <div className="textBook_reviewItem full"><label>Biography:</label> <p>{author.biography || '-'}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="textBook_reviewSection">
                  <h4>Book Details</h4>
                  <div className="textBook_reviewGrid">
                    <div className="textBook_reviewItem"><label>Title:</label> <p>{bookDetails.title}</p></div>
                    <div className="textBook_reviewItem"><label>Content File:</label> <p>{bookDetails.contentFile?.name}</p></div>
                    <div className="textBook_reviewItem"><label>Full Text File:</label> <p>{bookDetails.fullTextFile?.name}</p></div>
                  </div>
                </div>

                {/* Revision Notification Section 
                <div className="textBook_reviewSection" style={{ borderLeft: '4px solid #1e5292', background: '#f0f7ff' }}>
                  <h4 style={{ color: '#1e5292' }}>Submission Notification</h4>
                  <p style={{ fontSize: '10px', color: '#666', marginBottom: '10px' }}>
                    Note: Upon submission, a revision submission notification will be automatically sent to the assigned Reviewer.
                  </p>
                  <label className="textBook_declarationCheckbox" style={{ fontSize: '12px', color: '#1e5292', fontWeight: 600 }}>
                    <CheckCircle fontSize="small" style={{ color: '#1e5292', marginRight: '5px' }} />
                    Revision submission notification for Reviewer enabled
                  </label>
                </div> */}

                {/* Declaration Section */}
                <div className="textBook_declarationSection">
                  <h3 className="textBook_sectionTitle">Declaration</h3>
                  <div className="textBook_declarationBox">
                    <p className="textBook_declarationText">
                      I/We declare that the submitted manuscript is original work and has not been previously published
                      nor is it before another journal for consideration. I/We agree to comply with the journal's policies
                      and guidelines. All authors have approved the manuscript and agree with its submission.
                    </p>
                    <label className="textBook_declarationCheckbox">
                      <input
                        type="checkbox"
                        checked={declarationAccepted}
                        onChange={(e) => setDeclarationAccepted(e.target.checked)}
                      />
                      <span className="textBook_declarationLabel">
                        I accept the declaration and confirm that all information provided is accurate and complete.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="textBook_formNavigation">
              {activeTab !== 'author' ? (
                <button type="button" className="textBook_navButton textBook_prevButton" onClick={handlePrevTab}>
                  <NavigateBefore /> Previous
                </button>
              ) : <div></div>}

              {activeTab !== 'review' ? (
                <button type="button" className="textBook_navButton textBook_nextButton" onClick={handleNextTab}>
                  Next <NavigateNext />
                </button>
              ) : (
                <button
                  type="submit"
                  className="textBook_navButton textBook_nextButton"
                  disabled={!declarationAccepted || isSubmitting || !isAuthorized}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} style={{ color: 'white' }} />
                  ) : (
                    <>Submit Manuscript <CheckCircle fontSize="small" /></>
                  )}
                </button>
              )}
            </div>

          </form>
        </div>
      </div >

      <AlertPopup
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </main >
  );
};

export default BookManuscript;