import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Close, Add, Delete, NavigateNext, NavigateBefore } from '@mui/icons-material';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import type { Author, SubmitBookChapterPayload } from '../../types/bookChapterManuscriptTypes';
import { DESIGNATIONS } from '../../types/bookChapterManuscriptTypes';
import { COUNTRIES as PHONE_COUNTRIES } from '../../utils/countries';
import './bookChapterManuscript.css';
import { bookChapterService } from '../../services/bookChapterSumission.service';
import { authService } from '../../services/auth.service';
import bookManagementService from '../../services/bookManagement.service';

interface CoAuthorWithId extends Author {
  tempId: string;
}

interface FormErrors {
  [key: string]: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

type TabType = 'author' | 'coauthors' | 'details' | 'review';

interface UserInfo {
  userId: string;
  username: string;
  email: string;
  fullName?: string;
}

const BookChapterManuscript: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<TabType>('author');

  // Touched fields for validation
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});

  // Main Author State
  const [mainAuthor, setMainAuthor] = useState<Author>({
    id: 'main-author',
    firstName: '',
    lastName: '',
    designation: '',
    departmentName: '',
    instituteName: '',
    city: '',
    state: '',
    country: '',
    email: '',
    phoneNumber: '',
    isCorrespondingAuthor: true, // Default to true
    otherDesignation: ''
  });

  // Co-Authors State (max 6)
  const [coAuthors, setCoAuthors] = useState<CoAuthorWithId[]>([]);

  // Book Chapter Details State
  const [bookTitle, setBookTitle] = useState<string>('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]); // Multi-select
  const [availableChapters, setAvailableChapters] = useState<Array<{ id: string, chapterTitle: string }>>([]);
  const [bookTitles, setBookTitles] = useState<Array<{ id: number, title: string }>>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(false);
  const [manuscript, setManuscript] = useState<File | null>(null);
  const [abstract, setAbstract] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');

  // Editor Selection State
  const [availableEditors, setAvailableEditors] = useState<Array<{
    id: number;
    fullName: string;
    email: string;
    isPrimary: boolean;
  }>>([]);
  const [selectedEditor, setSelectedEditor] = useState<string>('');
  const [isPrimaryEditorForced, setIsPrimaryEditorForced] = useState<boolean>(false);
  const [isLoadingEditors, setIsLoadingEditors] = useState<boolean>(false);

  // Declaration checkbox
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(false);

  // Phone Validation State
  const [mainPhoneDigits, setMainPhoneDigits] = useState('');
  const [mainCountryCode, setMainCountryCode] = useState('+91');
  const [coAuthorPhoneDigits, setCoAuthorPhoneDigits] = useState<Record<string, string>>({});
  const [coAuthorCountryCodes, setCoAuthorCountryCodes] = useState<Record<string, string>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null); // 'main' or tempId
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // UI State
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Check authentication and fetch book titles on component mount
  useEffect(() => {
    checkAuthentication();
    fetchBookTitles();

    // Click outside dropdown handler
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkAuthentication = () => {


    const token = localStorage.getItem('authToken');
    const userDataStr = localStorage.getItem('user');

    if (!token || !userDataStr) {

      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      showAlert('error', 'Authentication Required', 'Please login to submit a manuscript.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    try {
      const userData = JSON.parse(userDataStr);


      const allowedRoles = ['user', 'author'];
      if (!allowedRoles.includes(userData.role)) {
        setIsAuthorized(false);
        setIsCheckingAuth(false);
        setAlertConfig({
          isOpen: true,
          type: 'error',
          title: 'Authorization Required',
          message: 'You are not authorized to access this form. Only Authors or Users are allowed.'
        });
        setTimeout(() => {
          navigate('/');
        }, 3000);
        return;
      }

      setCurrentUser({
        userId: userData.userId || userData.id || '',
        username: userData.username || '',
        email: userData.email || '',
        fullName: userData.fullName || userData.username || ''
      });
      const { code, digits } = splitPhone(userData.phoneNumber);
      setMainCountryCode(code);
      setMainPhoneDigits(digits);

      setMainAuthor(prev => ({
        ...prev,
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || ''
      }));

      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      showAlert('error', 'Authentication Error', 'Invalid session. Please login again.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  // Fetch book titles from API
  const fetchBookTitles = async () => {
    setIsLoadingBooks(true);
    try {
      const response = await bookManagementService.bookTitle.getAllBookTitles({ activeOnly: true });
      if (response.success && response.data && response.data.bookTitles) {
        setBookTitles(response.data.bookTitles.map((book: any) => ({
          id: book.id,
          title: book.title
        })));
      }
    } catch (error) {
      console.error('Error fetching book titles:', error);
      showAlert('error', 'Error', 'Failed to load book titles. Please refresh the page.');
    } finally {
      setIsLoadingBooks(false);
    }
  };

  // Fetch chapters when book title changes
  const fetchChapters = async (bookTitleId: string) => {
    try {
      const response = await bookManagementService.bookChapter.getChaptersByBookTitle(parseInt(bookTitleId), true, false);
      if (response.success && response.data && response.data.chapters) {
        setAvailableChapters(response.data.chapters.map((chapter: any) => ({
          id: chapter.id.toString(),
          chapterTitle: chapter.chapterTitle
        })));
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      showAlert('error', 'Error', 'Failed to load chapters. Please try again.');
      setAvailableChapters([]);
    } finally {
    }
  };


  // Fetch editors assigned to the selected book title
  const fetchEditors = async (bookTitleId: string) => {
    setIsLoadingEditors(true);
    try {
      const response = await bookManagementService.bookEditor.getEditorsByBookTitle(parseInt(bookTitleId));
      if (response.success && response.data && response.data.editors) {
        setAvailableEditors(
          response.data.editors.map((assignment: any) => ({
            id: assignment.editor.id,
            fullName: assignment.editor.fullName,
            email: assignment.editor.email,
            isPrimary: assignment.isPrimary
          }))
        );

        // Auto-select primary editor if exists
        const primary = response.data.editors.find((a: any) => a.isPrimary);
        if (primary) {
          setSelectedEditor(primary.editorId.toString());
          setIsPrimaryEditorForced(true);
        } else {
          setIsPrimaryEditorForced(false);
        }
      } else {
        setAvailableEditors([]);
      }
    } catch (error) {
      console.error('Error fetching editors:', error);
      // Don't show error alert for editors - it's optional
      setAvailableEditors([]);
    } finally {
      setIsLoadingEditors(false);
    }
  };

  // Update available chapters and editors when book title changes
  useEffect(() => {
    if (bookTitle) {
      fetchChapters(bookTitle);
      fetchEditors(bookTitle);
      setSelectedChapters([]); // Reset chapter selection
      setSelectedEditor(''); // Reset editor selection
    } else {
      setAvailableChapters([]);
      setAvailableEditors([]);
      setSelectedEditor('');
    }
  }, [bookTitle]);

  // Field validation function
  const validateField = (fieldName: string, value: any): string => {
    let error = '';

    // Main Author Validations
    if (fieldName === 'mainAuthor.firstName') {
      if (!value || !value.trim()) {
        error = 'First name is required';
      } else if (value.trim().length < 2) {
        error = 'First name must be at least 2 characters';
      }
    }

    if (fieldName === 'mainAuthor.lastName') {
      if (!value || !value.trim()) {
        error = 'Last name is required';
      } else if (value.trim().length < 1) {
        error = 'Last name must be at least 1 character';
      }
    }

    if (fieldName === 'mainAuthor.designation' && !value) {
      error = 'Designation is required';
    }

    if (fieldName === 'mainAuthor.otherDesignation' && mainAuthor.designation === 'other') {
      if (!value || !value.trim()) {
        error = 'Please specify your designation';
      }
    }

    if (fieldName === 'mainAuthor.departmentName') {
      if (!value || !value.trim()) {
        error = 'Department name is required';
      }
    }

    if (fieldName === 'mainAuthor.instituteName') {
      if (!value || !value.trim()) {
        error = 'Institute/University name is required';
      }
    }

    if (fieldName === 'mainAuthor.city') {
      if (!value || !value.trim()) {
        error = 'City is required';
      }
    }

    if (fieldName === 'mainAuthor.state') {
      if (!value || !value.trim()) {
        error = 'State is required';
      }
    }

    if (fieldName === 'mainAuthor.country' && !value) {
      error = 'Country is required';
    }

    if (fieldName === 'mainAuthor.email') {
      if (!value || !value.trim()) {
        error = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Please enter a valid email address (e.g., john.doe@example.com)';
      }
    }

    if ((fieldName === 'mainAuthor.phoneNumber' || fieldName.includes('.phoneNumber')) && value) {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        error = 'Phone number must have at least 10 digits';
      }
    }

    // Co-Author Validations (similar pattern)
    if (fieldName.startsWith('coAuthor.') && fieldName.includes('.firstName')) {
      if (!value || !value.trim()) {
        error = 'First name is required';
      }
    }

    if (fieldName.startsWith('coAuthor.') && fieldName.includes('.lastName')) {
      if (!value || !value.trim()) {
        error = 'Last name is required';
      }
    }

    if (fieldName.startsWith('coAuthor.') && fieldName.includes('.designation') && !value) {
      error = 'Designation is required';
    }

    if (fieldName.startsWith('coAuthor.') && fieldName.includes('.otherDesignation')) {
      const coAuthorId = fieldName.split('.')[1];
      const coAuthor = coAuthors.find(a => a.tempId === coAuthorId);
      if (coAuthor?.designation === 'other' && (!value || !value.trim())) {
        error = 'Please specify the designation';
      }
    }

    if (fieldName.startsWith('coAuthor.') && fieldName.includes('.departmentName')) {
      if (!value || !value.trim()) {
        error = 'Department name is required';
      }
    }

    if (fieldName.startsWith('coAuthor.') && fieldName.includes('.instituteName')) {
      if (!value || !value.trim()) {
        error = 'Institute name is required';
      }
    }

    if (fieldName.startsWith('coAuthor.') && fieldName.includes('.city')) {
      if (!value || !value.trim()) {
        error = 'City is required';
      }
    }

    if (fieldName.startsWith('coAuthor.') && fieldName.includes('.state')) {
      if (!value || !value.trim()) {
        error = 'State is required';
      }
    }

    if (fieldName.startsWith('coAuthor.') && fieldName.includes('.country') && !value) {
      error = 'Country is required';
    }

    if (fieldName.startsWith('coAuthor.') && fieldName.includes('.email')) {
      if (!value || !value.trim()) {
        error = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Please enter a valid email address (e.g., jane.doe@example.com)';
      }
    }


    // Details Validations
    if (fieldName === 'bookTitle' && !value) {
      error = 'Book title is required';
    }

    if (fieldName === 'bookChapterTitle' && (!value || value.length === 0)) {
      error = 'At least one chapter must be selected';
    }

    if (fieldName === 'abstract') {
      if (!value || !value.trim()) {
        error = 'Abstract is required';
      } else {
        const wordCount = value.trim().split(/\s+/).filter((w: string) => w).length;
        if (wordCount > 300) {
          error = 'Abstract must not exceed 300 words';
        }
      }
    }


    if (fieldName === 'keywords') {
      if (!value || !value.trim()) {
        error = 'Keywords are required';
      }
    }

    if (fieldName === 'selectedEditor') {
      if (availableEditors.length > 0 && !value) {
        error = 'Please select an editor';
      }
    }

    return error;
  };

  // Mark field as touched and validate
  const handleFieldBlur = (fieldName: string, value: any) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));

    const error = validateField(fieldName, value);
    if (error) {
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Handle main author field changes
  const handleMainAuthorChange = (field: keyof Author, value: any) => {
    // Handle Corresponing Author toggle

    if (field === 'isCorrespondingAuthor') {
      if (value === true) {
        // If main author is set to corresponding, uncheck all co-authors
        setCoAuthors(prev => prev.map(a => ({ ...a, isCorrespondingAuthor: false })));
        setMainAuthor(prev => ({ ...prev, isCorrespondingAuthor: value }));
      }
      // If value is false, DO NOTHING. We don't allow unchecking directly.
      // Must select another author to switch.
      return;
    }

    setMainAuthor(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate immediately if field was already touched
    const fieldName = `mainAuthor.${field}`;
    if (touchedFields[fieldName]) {
      const error = validateField(fieldName, value);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    }
  };

  // Add co-author
  const addCoAuthor = () => {
    if (coAuthors.length >= 6) {
      showAlert('warning', 'Maximum Co-Authors', 'You can add a maximum of 6 co-authors.');
      return;
    }

    const newCoAuthor: CoAuthorWithId = {
      id: `co-author-${Date.now()}`,
      tempId: `temp-${Date.now()}`,
      firstName: '',
      lastName: '',
      designation: '',
      departmentName: '',
      instituteName: '',
      city: '',
      state: '',
      country: '',
      email: '',
      phoneNumber: '',
      isCorrespondingAuthor: false,
      otherDesignation: ''
    };

    setCoAuthors(prev => [...prev, newCoAuthor]);
  };

  // Remove co-author
  const removeCoAuthor = (tempId: string) => {
    // Check if the author being removed is the corresponding author
    const authorToRemove = coAuthors.find(a => a.tempId === tempId);
    if (authorToRemove && authorToRemove.isCorrespondingAuthor) {
      // Fallback: Main Author becomes corresponding
      setMainAuthor(prev => ({ ...prev, isCorrespondingAuthor: true }));
    }

    setCoAuthors(prev => prev.filter(author => author.tempId !== tempId));

    // Remove errors and touched fields for this co-author
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`coAuthor.${tempId}`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });

    setTouchedFields(prev => {
      const newTouched = { ...prev };
      Object.keys(newTouched).forEach(key => {
        if (key.startsWith(`coAuthor.${tempId}`)) {
          delete newTouched[key];
        }
      });
      return newTouched;
    });
  };

  // Handle co-author field changes
  const handleCoAuthorChange = (tempId: string, field: keyof Author, value: string | boolean) => {
    setCoAuthors(prev => prev.map(author =>
      author.tempId === tempId ? { ...author, [field]: value } : author
    ));

    // Validate immediately if field was already touched
    const fieldName = `coAuthor.${tempId}.${field}`;
    if (touchedFields[fieldName]) {
      const error = validateField(fieldName, value);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    }
  };

  // Handle corresponding author change
  const handleCorrespondingAuthorChange = (tempId: string) => {
    // Set main author as NOT corresponding
    setMainAuthor(prev => ({ ...prev, isCorrespondingAuthor: false }));

    // Set selected co-author as corresponding, others as false
    setCoAuthors(prev => prev.map(author => ({
      ...author,
      isCorrespondingAuthor: author.tempId === tempId
    })));
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    // Check file type
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return 'Only PDF, DOC, and DOCX files are allowed';
    }

    // Check file size (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const fileError = validateFile(file);
      if (fileError) {
        showAlert('error', 'Invalid File', fileError);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setManuscript(file);
      const fileName = file.name;
      const fileSize = (file.size / (1024 * 1024)).toFixed(2); // Convert to MB
      const fileNameSpan = document.getElementById('file-name-display');
      const deleteBtn = document.getElementById('file-delete-btn');

      if (fileNameSpan) {
        fileNameSpan.textContent = `${fileName} (${fileSize} MB)`;
        fileNameSpan.classList.add('has-file');
      }

      if (deleteBtn) {
        deleteBtn.style.display = 'flex';
      }


    }
  };

  // Handle file delete
  const handleDeleteFile = () => {
    setManuscript(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const fileNameSpan = document.getElementById('file-name-display');
    const deleteBtn = document.getElementById('file-delete-btn');

    if (fileNameSpan) {
      fileNameSpan.textContent = 'No file chosen';
      fileNameSpan.classList.remove('has-file');
    }

    if (deleteBtn) {
      deleteBtn.style.display = 'none';
    }
  };

  // Validate specific tab
  const validateTab = (tab: TabType): boolean => {
    const newErrors: FormErrors = {};

    if (tab === 'author') {
      // Validate main author
      Object.keys(mainAuthor).forEach(key => {
        if (key !== 'id' && key !== 'isCorrespondingAuthor') {
          const fieldName = `mainAuthor.${key}`;
          const error = validateField(fieldName, mainAuthor[key as keyof Author]);
          if (error) {
            newErrors[fieldName] = error;
          }
        }
      });
    } else if (tab === 'coauthors') {
      // Validate co-authors (if any exist)
      coAuthors.forEach((author) => {
        Object.keys(author).forEach(key => {
          if (key !== 'id' && key !== 'tempId' && key !== 'isCorrespondingAuthor') {
            const fieldName = `coAuthor.${author.tempId}.${key}`;
            const error = validateField(fieldName, author[key as keyof Author]);
            if (error) {
              newErrors[fieldName] = error;
            }
          }
        });
      });
    } else if (tab === 'details') {
      // Validate book chapter details
      const detailsFields = {
        bookTitle,
        bookChapterTitle: selectedChapters,
        abstract,
        keywords,
        selectedEditor // Add selectedEditor to validation
      };

      Object.entries(detailsFields).forEach(([key, value]) => {
        const error = validateField(key, value);
        if (error) {
          newErrors[key] = error;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle tab navigation
  const handleNextTab = () => {
    const tabs: TabType[] = ['author', 'coauthors', 'details', 'review'];
    const currentIndex = tabs.indexOf(activeTab);

    // Validate current tab before proceeding
    if (activeTab === 'author' && !validateTab('author')) {
      showAlert('error', 'Validation Error', 'Please fill in all required author fields correctly.');
      return;
    }

    if (activeTab === 'coauthors' && coAuthors.length > 0 && !validateTab('coauthors')) {
      showAlert('error', 'Validation Error', 'Please fill in all required co-author fields correctly.');
      return;
    }

    if (activeTab === 'details' && !validateTab('details')) {
      showAlert('error', 'Validation Error', 'Please fill in all required book chapter details correctly.');
      return;
    }

    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevTab = () => {
    const tabs: TabType[] = ['author', 'coauthors', 'details', 'review'];
    const currentIndex = tabs.indexOf(activeTab);

    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Show alert
  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message
    });
  };

  // Close alert
  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  // --- Phone Helpers ---
  const toggleDropdown = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      setDropdownDirection(spaceBelow < 250 ? 'up' : 'down');
      setActiveDropdown(id);
    }
  };

  const handlePhoneDigitsChange = (id: string, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (id === 'main') {
      setMainPhoneDigits(digits);
      handleMainAuthorChange('phoneNumber', digits ? `${mainCountryCode}${digits}` : '');
    } else {
      setCoAuthorPhoneDigits(prev => ({ ...prev, [id]: digits }));
      const code = coAuthorCountryCodes[id] || '+91';
      handleCoAuthorChange(id, 'phoneNumber', digits ? `${code}${digits}` : '');
    }
  };

  const handleCountryCodeChange = (id: string, code: string) => {
    if (id === 'main') {
      setMainCountryCode(code);
      const digits = mainPhoneDigits;
      setMainAuthor(prev => ({ ...prev, phoneNumber: `${code}${digits}` }));
    } else {
      setCoAuthorCountryCodes(prev => ({ ...prev, [id]: code }));
      const digits = coAuthorPhoneDigits[id] || '';
      setCoAuthors(prev => prev.map(a =>
        a.tempId === id ? { ...a, phoneNumber: `${code}${digits}` } : a
      ));
    }
    setActiveDropdown(null);
  };

  // Split phone number into country code and digits
  const splitPhone = (phone?: string) => {
    if (!phone || !phone.trim()) return { code: '+91', digits: '' };
    // Find the country code by matching against PHONE_COUNTRIES
    const match = PHONE_COUNTRIES
      .slice()
      .sort((a, b) => b.code.length - a.code.length) // Longest code first
      .find(c => phone.trim().startsWith(c.code));

    if (match) {
      return { code: match.code, digits: phone.trim().substring(match.code.length) };
    }
    return { code: '+91', digits: phone.trim() };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();



    // Check authentication again before submission
    if (!isAuthenticated || !currentUser) {
      showAlert('error', 'Authentication Required', 'Your session has expired. Please login again.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    // Check declaration
    if (!declarationAccepted) {
      showAlert('error', 'Declaration Required', 'Please accept the declaration before submitting.');
      return;
    }

    // Final validation of all tabs
    const isAuthorValid = validateTab('author');
    const isCoAuthorsValid = coAuthors.length === 0 || validateTab('coauthors');
    const isDetailsValid = validateTab('details');

    if (!isAuthorValid || !isCoAuthorsValid || !isDetailsValid) {
      showAlert('error', 'Validation Error', 'Please correct all errors before submitting.');
      // Navigate to first tab with errors
      if (!isAuthorValid) {
        setActiveTab('author');
      } else if (!isCoAuthorsValid) {
        setActiveTab('coauthors');
      } else if (!isDetailsValid) {
        setActiveTab('details');
      }
      return;
    }

    setIsSubmitting(true);

    try {


      // Prepare payload
      const payload: SubmitBookChapterPayload = {
        mainAuthor,
        coAuthors: coAuthors.length > 0
          ? coAuthors.map(({ tempId, id, ...author }) => author)
          : undefined,
        bookTitle: getBookTitleName(bookTitle),
        bookChapterTitles: selectedChapters,
        abstract: abstract.trim(),
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        manuscript: manuscript || undefined,
        selectedEditorId: selectedEditor ? parseInt(selectedEditor) : undefined,
      };

      const response = await bookChapterService.submitBookChapter(payload);

      if (response.success) {


        showAlert(
          'success',
          'Submission Successful',
          response.message || 'Thank you for your submission! We will review your manuscript and get back to you soon.'
        );

        // Refresh user profile to update role (User -> Author)
        try {
          const userResponse = await authService.getCurrentUser();
          if (userResponse.success && userResponse.data) {

            localStorage.setItem('user', JSON.stringify(userResponse.data));

            // Dispatch event to notify Header/Dashboard of role change
            window.dispatchEvent(new Event('auth-changed'));

            // Update local state
            setCurrentUser({
              userId: userResponse.data.userId || userResponse.data.id.toString(),
              username: userResponse.data.username,
              email: userResponse.data.email,
              fullName: userResponse.data.fullName
            });
          }
        } catch (authError) {
          console.error('⚠️ Failed to refresh user profile:', authError);
        }

        // Reload page after delay to reflect role changes and show dashboard link
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.message || 'Submission failed');
      }

    } catch (error: any) {
      console.error('❌ Submission error:', error);
      showAlert(
        'error',
        'Submission Failed',
        error.message || 'There was an error submitting your manuscript. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };



  // Get book title name
  const getBookTitleName = (id: string) => {
    return bookTitles.find(book => book.id.toString() === id)?.title || '';
  };

  // Loading state
  if (isCheckingAuth) {
    return (
      <main className="content">
        <section className="book-page">
          <div className="loading-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            fontSize: '18px'
          }}>
            <p>Checking authentication...</p>
          </div>
        </section>
      </main>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <main className="content">
        <section className="book-page">
          <div className="auth-error-container" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            padding: '20px'
          }}>
            <h2>Authentication Required</h2>
            <p>Please login to submit a manuscript.</p>
            <p>Redirecting to login page...</p>
          </div>
        </section>
        <AlertPopup
          isOpen={alertConfig.isOpen}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={closeAlert}
        />
      </main>
    );
  }

  return (
    <main className="content">
      <section id="bookPage" className="book-page">
        <section className="book-hero">
          <h1>Submit Book Chapter</h1>
          <p>Publish with us</p>
          {currentUser && (
            <p style={{ fontSize: '14px', marginTop: '10px', opacity: 0.9 }}>
              Logged in as: {currentUser.fullName || currentUser.username}
            </p>
          )}
        </section>

        <div className="book-wrapper">
          <div className="book-container">

            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button
                type="button"
                className={`tab-button ${activeTab === 'author' ? 'active' : ''}`}
                onClick={() => setActiveTab('author')}
              >
                <span className="tab-number">1</span>
                <span className="tab-label">Author</span>
              </button>
              <button
                type="button"
                className={`tab-button ${activeTab === 'coauthors' ? 'active' : ''}`}
                onClick={() => {
                  if (activeTab === 'author') {
                    if (!validateTab('author')) {
                      showAlert('error', 'Validation Error', 'Please fill in all required author fields correctly.');
                      return;
                    }
                  }
                  setActiveTab('coauthors');
                }}
              >
                <span className="tab-number">2</span>
                <span className="tab-label">Co-Authors</span>
              </button>
              <button
                type="button"
                className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => {
                  if (activeTab === 'author' && !validateTab('author')) {
                    showAlert('error', 'Validation Error', 'Please fill in all required author fields correctly.');
                    return;
                  }
                  if (activeTab === 'coauthors' && coAuthors.length > 0 && !validateTab('coauthors')) {
                    showAlert('error', 'Validation Error', 'Please fill in all required co-author fields correctly.');
                    return;
                  }
                  setActiveTab('details');
                }}
              >
                <span className="tab-number">3</span>
                <span className="tab-label">Book Chapter Details</span>
              </button>
              <button
                type="button"
                className={`tab-button ${activeTab === 'review' ? 'active' : ''}`}
                onClick={() => {
                  if (activeTab === 'author' && !validateTab('author')) {
                    showAlert('error', 'Validation Error', 'Please fill in all required author fields correctly.');
                    return;
                  }
                  if (activeTab === 'coauthors' && coAuthors.length > 0 && !validateTab('coauthors')) {
                    showAlert('error', 'Validation Error', 'Please fill in all required co-author fields correctly.');
                    return;
                  }
                  if (activeTab === 'details' && !validateTab('details')) {
                    showAlert('error', 'Validation Error', 'Please fill in all required book chapter details correctly.');
                    return;
                  }
                  setActiveTab('review');
                }}
              >
                <span className="tab-number">4</span>
                <span className="tab-label">Review & Submit</span>
              </button>
            </div>

            <form className="manuscript-form" onSubmit={handleSubmit}>

              {/* TAB 1: MAIN AUTHOR */}
              {activeTab === 'author' && (
                <section className="submit-section tab-content" id="main-author-section">

                  <div className="form-row">
                    <div className="bookFormGroup">
                      <label>First Name*</label>
                      <input
                        type="text"
                        placeholder="e.g. John"
                        value={mainAuthor.firstName}
                        onChange={(e) => handleMainAuthorChange('firstName', e.target.value)}
                        onBlur={(e) => handleFieldBlur('mainAuthor.firstName', e.target.value)}
                        className={errors['mainAuthor.firstName'] ? 'input-error' : ''}
                      />
                      {errors['mainAuthor.firstName'] && (
                        <span className="error-messages">{errors['mainAuthor.firstName']}</span>
                      )}
                    </div>
                    <div className="bookFormGroup">
                      <label>Last Name*</label>
                      <input
                        type="text"
                        placeholder="e.g. Doe"
                        value={mainAuthor.lastName}
                        onChange={(e) => handleMainAuthorChange('lastName', e.target.value)}
                        onBlur={(e) => handleFieldBlur('mainAuthor.lastName', e.target.value)}
                        className={errors['mainAuthor.lastName'] ? 'input-error' : ''}
                      />
                      {errors['mainAuthor.lastName'] && (
                        <span className="error-messages">{errors['mainAuthor.lastName']}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="bookFormGroup">
                      <label>Designation*</label>
                      <select
                        value={mainAuthor.designation}
                        onChange={(e) => handleMainAuthorChange('designation', e.target.value)}
                        onBlur={(e) => handleFieldBlur('mainAuthor.designation', e.target.value)}
                        className={errors['mainAuthor.designation'] ? 'input-error' : ''}
                      >
                        <option value="">Select Designation</option>
                        {DESIGNATIONS.map(des => (
                          <option key={des.value} value={des.value}>{des.label}</option>
                        ))}
                      </select>
                      {errors['mainAuthor.designation'] && (
                        <span className="error-messages">{errors['mainAuthor.designation']}</span>
                      )}
                    </div>
                    {mainAuthor.designation === 'other' && (
                      <div className="bookFormGroup">
                        <label>Specify Designation*</label>
                        <input
                          type="text"
                          placeholder="e.g. Senior Research Fellow"
                          value={mainAuthor.otherDesignation}
                          onChange={(e) => handleMainAuthorChange('otherDesignation', e.target.value)}
                          onBlur={(e) => handleFieldBlur('mainAuthor.otherDesignation', e.target.value)}
                          className={errors['mainAuthor.otherDesignation'] ? 'input-error' : ''}
                        />
                        {errors['mainAuthor.otherDesignation'] && (
                          <span className="error-messages">{errors['mainAuthor.otherDesignation']}</span>
                        )}
                      </div>
                    )}
                    <div className="bookFormGroup">
                      <label>Department Name*</label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={mainAuthor.departmentName}
                        onChange={(e) => handleMainAuthorChange('departmentName', e.target.value)}
                        onBlur={(e) => handleFieldBlur('mainAuthor.departmentName', e.target.value)}
                        className={errors['mainAuthor.departmentName'] ? 'input-error' : ''}
                      />
                      {errors['mainAuthor.departmentName'] && (
                        <span className="error-messages">{errors['mainAuthor.departmentName']}</span>
                      )}
                    </div>
                  </div>

                  <div className="bookFormGroup full">
                    <label>Institute / University Name*</label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford University"
                      value={mainAuthor.instituteName}
                      onChange={(e) => handleMainAuthorChange('instituteName', e.target.value)}
                      onBlur={(e) => handleFieldBlur('mainAuthor.instituteName', e.target.value)}
                      className={errors['mainAuthor.instituteName'] ? 'input-error' : ''}
                    />
                    {errors['mainAuthor.instituteName'] && (
                      <span className="error-messages">{errors['mainAuthor.instituteName']}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="bookFormGroup">
                      <label>City*</label>
                      <input
                        type="text"
                        placeholder="e.g. Palo Alto"
                        value={mainAuthor.city}
                        onChange={(e) => handleMainAuthorChange('city', e.target.value)}
                        onBlur={(e) => handleFieldBlur('mainAuthor.city', e.target.value)}
                        className={errors['mainAuthor.city'] ? 'input-error' : ''}
                      />
                      {errors['mainAuthor.city'] && (
                        <span className="error-messages">{errors['mainAuthor.city']}</span>
                      )}
                    </div>
                    <div className="bookFormGroup">
                      <label>State*</label>
                      <input
                        type="text"
                        placeholder="e.g. California"
                        value={mainAuthor.state}
                        onChange={(e) => handleMainAuthorChange('state', e.target.value)}
                        onBlur={(e) => handleFieldBlur('mainAuthor.state', e.target.value)}
                        className={errors['mainAuthor.state'] ? 'input-error' : ''}
                      />
                      {errors['mainAuthor.state'] && (
                        <span className="error-messages">{errors['mainAuthor.state']}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="bookFormGroup">
                      <label>Country*</label>
                      <input
                        type="text"
                        placeholder="e.g. USA"
                        value={mainAuthor.country}
                        onChange={(e) => handleMainAuthorChange('country', e.target.value)}
                        onBlur={(e) => handleFieldBlur('mainAuthor.country', e.target.value)}
                        className={errors['mainAuthor.country'] ? 'input-error' : ''}
                      />
                      {errors['mainAuthor.country'] && (
                        <span className="error-messages">{errors['mainAuthor.country']}</span>
                      )}
                    </div>

                    <div className="bookFormGroup">
                      <label>Email Address*</label>
                      <input
                        type="email"
                        placeholder="e.g. john.doe@example.com"
                        value={mainAuthor.email}
                        readOnly
                        disabled
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#666' }}
                        title="Email is automatically filled from your account"
                        className={errors['mainAuthor.email'] ? 'input-error' : ''}
                      />
                      {errors['mainAuthor.email'] && (
                        <span className="error-messages">{errors['mainAuthor.email']}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="bookFormGroup">
                      <label>Phone Number (Optional)</label>
                      <div className={`phone-input-wrapper ${errors['mainAuthor.phoneNumber'] ? 'input-error' : ''}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        position: 'relative'
                      }}>
                        {/* Country Code Dropdown */}
                        <div className="country-select-container" style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={(e) => toggleDropdown('main', e)}
                            className="country-select-button"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0 12px',
                              height: '42px',
                              border: 'none',
                              borderRight: '1px solid #ddd',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '8px 0 0 8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              minWidth: '90px',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>
                              {PHONE_COUNTRIES.find(c => c.code === mainCountryCode)?.iso || 'IN'} ({mainCountryCode})
                            </span>
                            <span style={{ fontSize: '10px', opacity: 0.5 }}>{activeDropdown === 'main' ? '▲' : '▼'}</span>
                          </button>

                          {activeDropdown === 'main' && (
                            <div
                              className="country-dropdown-list"
                              ref={dropdownRef}
                              style={{
                                position: 'absolute',
                                [dropdownDirection === 'up' ? 'bottom' : 'top']: '100%',
                                left: 0,
                                width: '280px',
                                maxHeight: '250px',
                                overflowY: 'auto',
                                backgroundColor: '#fff',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                zIndex: 1000,
                                margin: '4px 0'
                              }}
                            >
                              {PHONE_COUNTRIES.map(c => (
                                <div
                                  key={c.iso}
                                  onClick={() => handleCountryCodeChange('main', c.code)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f0f0f0',
                                    fontSize: '13px',
                                    backgroundColor: mainCountryCode === c.code ? '#f0f7ff' : '#fff'
                                  }}
                                  className="dropdown-item"
                                >
                                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                                  <span style={{ color: '#666' }}>{c.code}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Phone Digits Input */}
                        <input
                          type="tel"
                          placeholder="e.g. 1234567890"
                          value={mainPhoneDigits}
                          onChange={(e) => handlePhoneDigitsChange('main', e.target.value)}
                          onBlur={(e) => handleFieldBlur('mainAuthor.phoneNumber', e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0 12px',
                            height: '42px',
                            border: 'none',
                            outline: 'none',
                            fontSize: '14px',
                            borderRadius: '0 8px 8px 0'
                          }}
                        />
                      </div>
                      {errors['mainAuthor.phoneNumber'] && (
                        <span className="error-messages">{errors['mainAuthor.phoneNumber']}</span>
                      )}
                    </div>
                    <div className="bookFormGroup">
                      <label className="correspondingCheckbox-label" style={{ marginTop: '30px' }}>
                        <input
                          type="checkbox"
                          checked={mainAuthor.isCorrespondingAuthor}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleMainAuthorChange('isCorrespondingAuthor', true);
                            }
                          }}
                        />
                        <span>Corresponding Author</span>
                      </label>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 2: CO-AUTHORS */}
              {activeTab === 'coauthors' && (
                <section className="submit-section tab-content" id="co-authors-section">
                  <div className="section-header">
                    <button
                      type="button"
                      className="add-coauthor-btn"
                      onClick={addCoAuthor}
                      disabled={coAuthors.length >= 6}
                    >
                      <Add /> Add Co-Author
                    </button>
                  </div>

                  {coAuthors.map((coAuthor, index) => (
                    <div key={coAuthor.tempId} className="coauthor-container">
                      <div className="coauthor-header">
                        <h3>Co-Author {index + 1}</h3>
                        <button
                          type="button"
                          className="delete-coauthor-btn"
                          onClick={() => removeCoAuthor(coAuthor.tempId)}
                          title="Remove Co-Author"
                        >
                          <Delete />
                        </button>
                      </div>

                      <div className="form-row">
                        <div className="bookFormGroup">
                          <label>First Name*</label>
                          <input
                            type="text"
                            placeholder="e.g. Jane"
                            value={coAuthor.firstName}
                            onChange={(e) => handleCoAuthorChange(coAuthor.tempId, 'firstName', e.target.value)}
                            onBlur={(e) => handleFieldBlur(`coAuthor.${coAuthor.tempId}.firstName`, e.target.value)}
                            className={errors[`coAuthor.${coAuthor.tempId}.firstName`] ? 'input-error' : ''}
                          />
                          {errors[`coAuthor.${coAuthor.tempId}.firstName`] && (
                            <span className="error-messages">{errors[`coAuthor.${coAuthor.tempId}.firstName`]}</span>
                          )}
                        </div>
                        <div className="bookFormGroup">
                          <label>Last Name*</label>
                          <input
                            type="text"
                            placeholder="e.g. Smith"
                            value={coAuthor.lastName}
                            onChange={(e) => handleCoAuthorChange(coAuthor.tempId, 'lastName', e.target.value)}
                            onBlur={(e) => handleFieldBlur(`coAuthor.${coAuthor.tempId}.lastName`, e.target.value)}
                            className={errors[`coAuthor.${coAuthor.tempId}.lastName`] ? 'input-error' : ''}
                          />
                          {errors[`coAuthor.${coAuthor.tempId}.lastName`] && (
                            <span className="error-messages">{errors[`coAuthor.${coAuthor.tempId}.lastName`]}</span>
                          )}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="bookFormGroup">
                          <label>Designation*</label>
                          <select
                            value={coAuthor.designation}
                            onChange={(e) => handleCoAuthorChange(coAuthor.tempId, 'designation', e.target.value)}
                            onBlur={(e) => handleFieldBlur(`coAuthor.${coAuthor.tempId}.designation`, e.target.value)}
                            className={errors[`coAuthor.${coAuthor.tempId}.designation`] ? 'input-error' : ''}
                          >
                            <option value="">Select Designation</option>
                            {DESIGNATIONS.map(des => (
                              <option key={des.value} value={des.value}>{des.label}</option>
                            ))}
                          </select>
                          {errors[`coAuthor.${coAuthor.tempId}.designation`] && (
                            <span className="error-messages">{errors[`coAuthor.${coAuthor.tempId}.designation`]}</span>
                          )}
                        </div>
                        {coAuthor.designation === 'other' && (
                          <div className="bookFormGroup">
                            <label>Specify Designation*</label>
                            <input
                              type="text"
                              placeholder="e.g. Researcher"
                              value={coAuthor.otherDesignation}
                              onChange={(e) => handleCoAuthorChange(coAuthor.tempId, 'otherDesignation', e.target.value)}
                              onBlur={(e) => handleFieldBlur(`coAuthor.${coAuthor.tempId}.otherDesignation`, e.target.value)}
                              className={errors[`coAuthor.${coAuthor.tempId}.otherDesignation`] ? 'input-error' : ''}
                            />
                            {errors[`coAuthor.${coAuthor.tempId}.otherDesignation`] && (
                              <span className="error-messages">{errors[`coAuthor.${coAuthor.tempId}.otherDesignation`]}</span>
                            )}
                          </div>
                        )}
                        <div className="bookFormGroup">
                          <label>Department Name*</label>
                          <input
                            type="text"
                            placeholder="e.g. Physics"
                            value={coAuthor.departmentName}
                            onChange={(e) => handleCoAuthorChange(coAuthor.tempId, 'departmentName', e.target.value)}
                            onBlur={(e) => handleFieldBlur(`coAuthor.${coAuthor.tempId}.departmentName`, e.target.value)}
                            className={errors[`coAuthor.${coAuthor.tempId}.departmentName`] ? 'input-error' : ''}
                          />
                          {errors[`coAuthor.${coAuthor.tempId}.departmentName`] && (
                            <span className="error-messages">{errors[`coAuthor.${coAuthor.tempId}.departmentName`]}</span>
                          )}
                        </div>
                      </div>

                      <div className="bookFormGroup full">
                        <label>Institute / University Name*</label>
                        <input
                          type="text"
                          placeholder="e.g. MIT"
                          value={coAuthor.instituteName}
                          onChange={(e) => handleCoAuthorChange(coAuthor.tempId, 'instituteName', e.target.value)}
                          onBlur={(e) => handleFieldBlur(`coAuthor.${coAuthor.tempId}.instituteName`, e.target.value)}
                          className={errors[`coAuthor.${coAuthor.tempId}.instituteName`] ? 'input-error' : ''}
                        />
                        {errors[`coAuthor.${coAuthor.tempId}.instituteName`] && (
                          <span className="error-messages">{errors[`coAuthor.${coAuthor.tempId}.instituteName`]}</span>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="bookFormGroup">
                          <label>City*</label>
                          <input
                            type="text"
                            placeholder="e.g. Cambridge"
                            value={coAuthor.city}
                            onChange={(e) => handleCoAuthorChange(coAuthor.tempId, 'city', e.target.value)}
                            onBlur={(e) => handleFieldBlur(`coAuthor.${coAuthor.tempId}.city`, e.target.value)}
                            className={errors[`coAuthor.${coAuthor.tempId}.city`] ? 'input-error' : ''}
                          />
                          {errors[`coAuthor.${coAuthor.tempId}.city`] && (
                            <span className="error-messages">{errors[`coAuthor.${coAuthor.tempId}.city`]}</span>
                          )}
                        </div>
                        <div className="bookFormGroup">
                          <label>State*</label>
                          <input
                            type="text"
                            placeholder="e.g. Massachusetts"
                            value={coAuthor.state}
                            onChange={(e) => handleCoAuthorChange(coAuthor.tempId, 'state', e.target.value)}
                            onBlur={(e) => handleFieldBlur(`coAuthor.${coAuthor.tempId}.state`, e.target.value)}
                            className={errors[`coAuthor.${coAuthor.tempId}.state`] ? 'input-error' : ''}
                          />
                          {errors[`coAuthor.${coAuthor.tempId}.state`] && (
                            <span className="error-messages">{errors[`coAuthor.${coAuthor.tempId}.state`]}</span>
                          )}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="bookFormGroup">
                          <label>Country*</label>
                          <input
                            type="text"
                            placeholder="e.g. USA"
                            value={coAuthor.country}
                            onChange={(e) => handleCoAuthorChange(coAuthor.tempId, 'country', e.target.value)}
                            onBlur={(e) => handleFieldBlur(`coAuthor.${coAuthor.tempId}.country`, e.target.value)}
                            className={errors[`coAuthor.${coAuthor.tempId}.country`] ? 'input-error' : ''}
                          />
                          {errors[`coAuthor.${coAuthor.tempId}.country`] && (
                            <span className="error-messages">{errors[`coAuthor.${coAuthor.tempId}.country`]}</span>
                          )}
                        </div>

                        <div className="bookFormGroup">
                          <label>Email Address*</label>
                          <input
                            type="email"
                            placeholder="e.g. jane.doe@example.com"
                            value={coAuthor.email}
                            onChange={(e) => handleCoAuthorChange(coAuthor.tempId, 'email', e.target.value)}
                            onBlur={(e) => handleFieldBlur(`coAuthor.${coAuthor.tempId}.email`, e.target.value)}
                            className={errors[`coAuthor.${coAuthor.tempId}.email`] ? 'input-error' : ''}
                          />
                          {errors[`coAuthor.${coAuthor.tempId}.email`] && (
                            <span className="error-messages">{errors[`coAuthor.${coAuthor.tempId}.email`]}</span>
                          )}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="bookFormGroup">
                          <label>Phone Number (Optional)</label>
                          <div className={`phone-input-wrapper ${errors[`coAuthor.${coAuthor.tempId}.phoneNumber`] ? 'input-error' : ''}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            backgroundColor: '#fff',
                            position: 'relative'
                          }}>
                            {/* Country Code Dropdown */}
                            <div className="country-select-container" style={{ position: 'relative' }}>
                              <button
                                type="button"
                                onClick={(e) => toggleDropdown(coAuthor.tempId, e)}
                                className="country-select-button"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0 12px',
                                  height: '42px',
                                  border: 'none',
                                  borderRight: '1px solid #ddd',
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '8px 0 0 8px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  minWidth: '90px',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <span style={{ fontWeight: 500 }}>
                                  {PHONE_COUNTRIES.find(c => c.code === (coAuthorCountryCodes[coAuthor.tempId] || '+91'))?.iso || 'IN'} ({coAuthorCountryCodes[coAuthor.tempId] || '+91'})
                                </span>
                                <span style={{ fontSize: '10px', opacity: 0.5 }}>{activeDropdown === coAuthor.tempId ? '▲' : '▼'}</span>
                              </button>

                              {activeDropdown === coAuthor.tempId && (
                                <div
                                  className="country-dropdown-list"
                                  ref={dropdownRef}
                                  style={{
                                    position: 'absolute',
                                    [dropdownDirection === 'up' ? 'bottom' : 'top']: '100%',
                                    left: 0,
                                    width: '280px',
                                    maxHeight: '330px',
                                    overflowY: 'auto',
                                    backgroundColor: '#fff',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                    zIndex: 1000,
                                    margin: '4px 0'
                                  }}
                                >
                                  {PHONE_COUNTRIES.map(c => (
                                    <div
                                      key={c.iso}
                                      onClick={() => handleCountryCodeChange(coAuthor.tempId, c.code)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f0f0f0',
                                        fontSize: '13px',
                                        backgroundColor: (coAuthorCountryCodes[coAuthor.tempId] || '+91') === c.code ? '#f0f7ff' : '#fff'
                                      }}
                                      className="dropdown-item"
                                    >
                                      <span style={{ fontWeight: 500 }}>{c.name}</span>
                                      <span style={{ color: '#666' }}>{c.code}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Phone Digits Input */}
                            <input
                              type="tel"
                              placeholder="e.g. 9876543210"
                              value={coAuthorPhoneDigits[coAuthor.tempId] || ''}
                              onChange={(e) => handlePhoneDigitsChange(coAuthor.tempId, e.target.value)}
                              onBlur={(e) => handleFieldBlur(`coAuthor.${coAuthor.tempId}.phoneNumber`, e.target.value)}
                              style={{
                                flex: 1,
                                padding: '0 12px',
                                height: '42px',
                                border: 'none',
                                outline: 'none',
                                fontSize: '14px',
                                borderRadius: '0 8px 8px 0'
                              }}
                            />
                          </div>
                          {errors[`coAuthor.${coAuthor.tempId}.phoneNumber`] && (
                            <span className="error-messages">{errors[`coAuthor.${coAuthor.tempId}.phoneNumber`]}</span>
                          )}
                        </div>
                        <div className="bookFormGroup">
                          <label className="correspondingCheckbox-label">
                            <input
                              type="checkbox"
                              checked={coAuthor.isCorrespondingAuthor}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleCorrespondingAuthorChange(coAuthor.tempId);
                                }
                              }}
                            />
                            <span>Corresponding Author</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}

                  {coAuthors.length === 0 && (
                    <div className="no-coauthors-message">
                      <p>No co-authors added yet. Click "Add Co-Author" to add co-authors to your manuscript.</p>
                      <p className="info-text">Note: You can skip this step if there are no co-authors.</p>
                    </div>
                  )}
                </section>
              )}

              {/* TAB 3: BOOK CHAPTER DETAILS */}
              {activeTab === 'details' && (
                <section className="submit-section tab-content" id="chapter-details-section">

                  <div className="form-row">
                    <div className="bookFormGroup">
                      <label>Book Title*</label>
                      <select
                        value={bookTitle}
                        onChange={(e) => {
                          setBookTitle(e.target.value);
                          if (touchedFields['bookTitle']) {
                            const error = validateField('bookTitle', e.target.value);
                            if (error) {
                              setErrors(prev => ({ ...prev, bookTitle: error }));
                            } else {
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors['bookTitle'];
                                return newErrors;
                              });
                            }
                          }
                        }}
                        onBlur={(e) => handleFieldBlur('bookTitle', e.target.value)}
                        className={errors['bookTitle'] ? 'input-error' : ''}
                        disabled={isLoadingBooks}
                      >
                        <option value="">{isLoadingBooks ? 'Loading book titles...' : 'Select a book title'}</option>
                        {bookTitles.map(book => (
                          <option key={book.id} value={book.id.toString()}>{book.title}</option>
                        ))}
                      </select>
                      {errors['bookTitle'] && (
                        <span className="error-messages">{errors['bookTitle']}</span>
                      )}
                    </div>
                    <div className="bookFormGroup">
                      <label>Book Chapter Title* (Select One or More)</label>
                      <div
                        className={`chapter-multiselect ${!bookTitle ? 'disabled' : ''} ${errors['bookChapterTitle'] ? 'input-error' : ''}`}
                        tabIndex={0}
                        onBlur={() => handleFieldBlur('bookChapterTitle', selectedChapters)}
                      >
                        {!bookTitle ? (
                          <div className="multiselect-placeholder">Please select a book title first</div>
                        ) : availableChapters.length === 0 ? (
                          <div className="multiselect-placeholder">No chapters available</div>
                        ) : (
                          <div className="chapter-checkbox-list">
                            {availableChapters.map(chapter => (
                              <label key={chapter.id} className="chapter-checkbox-item">
                                <input
                                  type="checkbox"
                                  value={chapter.id}
                                  checked={selectedChapters.includes(chapter.id)}
                                  onChange={(e) => {
                                    let newChapters;
                                    if (e.target.checked) {
                                      newChapters = [...selectedChapters, chapter.id];
                                    } else {
                                      newChapters = selectedChapters.filter(id => id !== chapter.id);
                                    }
                                    setSelectedChapters(newChapters);

                                    // Validate if touched
                                    if (touchedFields['bookChapterTitle']) {
                                      const error = validateField('bookChapterTitle', newChapters);
                                      if (error) {
                                        setErrors(prev => ({ ...prev, bookChapterTitle: error }));
                                      } else {
                                        setErrors(prev => {
                                          const newErrors = { ...prev };
                                          delete newErrors['bookChapterTitle'];
                                          return newErrors;
                                        });
                                      }
                                    }
                                  }}
                                  onBlur={() => handleFieldBlur('bookChapterTitle', selectedChapters)}
                                  disabled={!bookTitle}
                                />
                                <span>{chapter.chapterTitle}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors['bookChapterTitle'] && (
                        <span className="error-messages">{errors['bookChapterTitle']}</span>
                      )}
                      {selectedChapters.length > 0 && (
                        <div className="selected-chapters-summary">
                          Selected: {selectedChapters.length} chapter{selectedChapters.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editor Selection - Only show if book title is selected */}
                  {bookTitle && (
                    <div className="bookFormGroup" style={{ marginBottom: '20px', display: 'none' }}>
                      <div className="bookFormGroup_1" style={{ display: 'none' }}>
                        <label>
                          Select Editor *
                        </label>
                        {isLoadingEditors ? (
                          <div className="multiselect-placeholder">Loading available editors...</div>
                        ) : availableEditors.length === 0 ? (
                          <div className="info-message" style={{
                            padding: '12px',
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            color: '#1e40af',
                            fontSize: '14px'
                          }}>
                            ℹ️ No editors are currently assigned to this book title. An admin will assign an editor after submission.
                          </div>
                        ) : (
                          <>
                            <select
                              value={selectedEditor}
                              onChange={(e) => {
                                setSelectedEditor(e.target.value);
                                // Validate if touched
                                if (touchedFields['selectedEditor']) {
                                  const error = validateField('selectedEditor', e.target.value);
                                  if (error) {
                                    setErrors(prev => ({ ...prev, selectedEditor: error }));
                                  } else {
                                    setErrors(prev => {
                                      const newErrors = { ...prev };
                                      delete newErrors['selectedEditor'];
                                      return newErrors;
                                    });
                                  }
                                }
                              }}
                              onBlur={(e) => handleFieldBlur('selectedEditor', e.target.value)}
                              className={`select-input ${errors['selectedEditor'] ? 'input-error' : ''}`}
                              disabled={isPrimaryEditorForced}
                            >
                              <option value="">-- Select an Editor --</option>
                              {availableEditors.map((editor) => (
                                <option key={editor.id} value={editor.id.toString()}>
                                  {editor.fullName} ({editor.email})
                                </option>
                              ))}
                            </select>
                            {errors['selectedEditor'] && (
                              <span className="error-messages">{errors['selectedEditor']}</span>
                            )}
                            {isPrimaryEditorForced && (
                              <div className="info-message" style={{
                                marginTop: '8px',
                                padding: '6px 10px',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '4px',
                                color: '#15803d',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                              </div>
                            )}

                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* <div className="bookFormGroup full">
                    <label>Upload Manuscript (Optional - PDF/Word Format, Max 10MB)</label>
                    <div className="file-input-container">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.doc,.docx"
                        className="file-input-hidden"
                        id="manuscript-file"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="manuscript-file" className="file-input-button">
                        <Upload style={{ marginRight: '8px' }} />
                        Choose File
                      </label>
                      <span className="file-name-display" id="file-name-display">No file chosen</span>
                      <button
                        type="button"
                        className="file-delete-btn"
                        id="file-delete-btn"
                        onClick={handleDeleteFile}
                        title="Remove file"
                        style={{ display: 'none' }}
                      >
                        <Close />
                      </button>
                    </div>
                    <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                      Accepted formats: PDF, DOC, DOCX (Max size: 10MB)
                    </small>
                  </div> */}

                  <div className="bookFormGroup full">
                    <label>
                      Abstract* (Max 300 words)
                      <span className="word-count">
                        {abstract.trim().split(/\s+/).filter(w => w).length} / 300 words
                      </span>
                    </label>
                    <textarea
                      placeholder="e.g. This chapter explores the applications of machine learning in modern healthcare systems..."
                      value={abstract}
                      onChange={(e) => {
                        setAbstract(e.target.value);
                        if (touchedFields['abstract']) {
                          const error = validateField('abstract', e.target.value);
                          if (error) {
                            setErrors(prev => ({ ...prev, abstract: error }));
                          } else {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors['abstract'];
                              return newErrors;
                            });
                          }
                        }
                      }}
                      onBlur={(e) => handleFieldBlur('abstract', e.target.value)}
                      rows={8}
                      className={errors['abstract'] ? 'input-error' : ''}
                    />
                    {errors['abstract'] && (
                      <span className="error-messages">{errors['abstract']}</span>
                    )}
                  </div>

                  <div className="bookFormGroup full">
                    <label>Keywords* (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Machine Learning, AI, Healthcare, Neural Networks"
                      value={keywords}
                      onChange={(e) => {
                        setKeywords(e.target.value);
                        if (touchedFields['keywords']) {
                          const error = validateField('keywords', e.target.value);
                          if (error) {
                            setErrors(prev => ({ ...prev, keywords: error }));
                          } else {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors['keywords'];
                              return newErrors;
                            });
                          }
                        }
                      }}
                      onBlur={(e) => handleFieldBlur('keywords', e.target.value)}
                      className={errors['keywords'] ? 'input-error' : ''}
                    />
                    {errors['keywords'] && (
                      <span className="error-messages">{errors['keywords']}</span>
                    )}
                  </div>
                </section>
              )}

              {/* TAB 4: REVIEW & SUBMIT */}
              {activeTab === 'review' && (
                <section className="submit-section tab-content" id="review-section">

                  {/* Submitted By Info */}
                  <div className="review-section">
                    <h3 className="review-section-title">Submitted By</h3>
                    <div className="review-grid">
                      <div className="review-item">
                        <span className="review-label">Username:</span>
                        <span className="review-value">{currentUser?.username}</span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Email:</span>
                        <span className="review-value">{currentUser?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Author Review */}
                  <div className="review-section">
                    <h3 className="review-section-title">Main Author</h3>
                    <div className="review-grid">
                      <div className="review-item">
                        <span className="review-label">Name:</span>
                        <span className="review-value">{mainAuthor.firstName} {mainAuthor.lastName}</span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Designation:</span>
                        <span className="review-value">
                          {DESIGNATIONS.find(d => d.value === mainAuthor.designation)?.label || '-'}
                        </span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Department:</span>
                        <span className="review-value">{mainAuthor.departmentName}</span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Institute:</span>
                        <span className="review-value">{mainAuthor.instituteName}</span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Location:</span>
                        <span className="review-value">
                          {mainAuthor.city}, {mainAuthor.state}, {mainAuthor.country}
                        </span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Email:</span>
                        <span className="review-value">{mainAuthor.email}</span>
                      </div>
                      {mainAuthor.phoneNumber && (
                        <div className="review-item">
                          <span className="review-label">Phone:</span>
                          <span className="review-value">{mainAuthor.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Co-Authors Review */}
                  {coAuthors.length > 0 && (
                    <div className="review-section">
                      <h3 className="review-section-title">Co-Authors ({coAuthors.length})</h3>
                      {coAuthors.map((coAuthor, index) => (
                        <div key={coAuthor.tempId} className="review-coauthor">
                          <h4 className="review-coauthor-title">
                            Co-Author {index + 1}
                            {coAuthor.isCorrespondingAuthor && (
                              <span className="corresponding-badge">Corresponding</span>
                            )}
                          </h4>
                          <div className="review-grid">
                            <div className="review-item">
                              <span className="review-label">Name:</span>
                              <span className="review-value">{coAuthor.firstName} {coAuthor.lastName}</span>
                            </div>
                            <div className="review-item">
                              <span className="review-label">Designation:</span>
                              <span className="review-value">
                                {DESIGNATIONS.find(d => d.value === coAuthor.designation)?.label || '-'}
                              </span>
                            </div>
                            <div className="review-item">
                              <span className="review-label">Department:</span>
                              <span className="review-value">{coAuthor.departmentName}</span>
                            </div>
                            <div className="review-item">
                              <span className="review-label">Institute:</span>
                              <span className="review-value">{coAuthor.instituteName}</span>
                            </div>
                            <div className="review-item">
                              <span className="review-label">Location:</span>
                              <span className="review-value">
                                {coAuthor.city}, {coAuthor.state}, {coAuthor.country}
                              </span>
                            </div>
                            <div className="review-item">
                              <span className="review-label">Email:</span>
                              <span className="review-value">{coAuthor.email}</span>
                            </div>
                            {coAuthor.phoneNumber && (
                              <div className="review-item">
                                <span className="review-label">Phone:</span>
                                <span className="review-value">{coAuthor.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Book Chapter Details Review */}
                  <div className="review-section">
                    <h3 className="review-section-title">Book Chapter Details</h3>
                    <div className="review-grid">
                      <div className="review-item">
                        <span className="review-label">Book Title:</span>
                        <span className="review-value">{getBookTitleName(bookTitle)}</span>
                      </div>
                      {/* <div className="review-item">
                        <span className="review-label">Selected Editor:</span>
                        <span className="review-value">
                          {selectedEditor
                            ? availableEditors.find(e => e.id.toString() === selectedEditor)?.fullName || 'Unknown Editor'
                            : 'No editor selected (will be assigned)'}
                        </span>
                      </div> */}
                      <div className="review-item full-width">
                        <span className="review-label">Chapter Titles:</span>
                        <span className="review-value">
                          {selectedChapters.map(chapterId =>
                            availableChapters.find(c => c.id === chapterId)?.chapterTitle
                          ).filter(Boolean).join(', ')}
                        </span>
                      </div>
                      <div className="review-item full-width">
                        <span className="review-label">Abstract:</span>
                        <span className="review-value abstract-text">{abstract}</span>
                      </div>
                      <div className="review-item full-width">
                        <span className="review-label">Keywords:</span>
                        <span className="review-value">
                          {keywords.split(',').map(k => k.trim()).filter(k => k).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Declaration */}
                  <div className="declaration-section">
                    <h3 className="review-section-title">Declaration</h3>
                    <div className="declaration-box">
                      <p className="declaration-text">
                        I/We declare that the submitted manuscript is original work and has not been previously published
                        nor is it before another journal for consideration. I/We agree to comply with the journal's policies
                        and guidelines. All authors have approved the manuscript and agree with its submission.
                      </p>
                      <label className="declaration-checkbox">
                        <input
                          type="checkbox"
                          checked={declarationAccepted}
                          onChange={(e) => setDeclarationAccepted(e.target.checked)}
                        />
                        <span className="declaration-label">
                          I accept the declaration and confirm that all information provided is accurate and complete.
                        </span>
                      </label>
                    </div>
                  </div>
                </section>
              )}

              {/* Navigation Buttons */}
              <div className="form-navigation">
                {activeTab !== 'author' && (
                  <button
                    type="button"
                    className="nav-button prev-button"
                    onClick={handlePrevTab}
                    disabled={isSubmitting}
                  >
                    <NavigateBefore /> Previous
                  </button>
                )}

                {activeTab !== 'review' ? (
                  <button
                    type="button"
                    className="nav-button next-button"
                    onClick={handleNextTab}
                  >
                    Next <NavigateNext />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="nav-button submit-button"
                    disabled={!declarationAccepted || isSubmitting || !isAuthorized}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Manuscript'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section >

      {/* Alert Popup */}
      < AlertPopup
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />
    </main >
  );
};

export default BookChapterManuscript;