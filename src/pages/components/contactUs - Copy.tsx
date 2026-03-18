import { useState, useEffect, useRef } from 'react';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import { contactService, type ContactDetails } from '../../services/contactService';
import { contactInquiryService } from '../../services/contactInquiry.service';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import { COUNTRIES, type Country } from '../../utils/countries';
import './contactUs.css';

interface UserData {
  role: string;
}

export default function ContactUs() {
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');

  // Form fields
  const [formData, setFormData] = useState({ fullName: '', email: '', countryCode: '+91', phone: '', message: '' });
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateField = (id: string, value: string) => {
    let error = '';
    switch (id) {
      case 'fullName':
        if (!value.trim()) error = 'Full name is required';
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        const digits = value.replace(/\D/g, '');
        if (!digits) {
          error = 'Phone number is required';
        } else if (digits.length < 10) {
          error = 'Phone number must be at least 10 digits';
        }
        break;
      case 'message':
        if (!value.trim()) error = 'Message is required';
        break;
    }
    setErrors(prev => ({ ...prev, [id]: error }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (touched[id]) {
      validateField(id, value);
    }
  };

  const handleBlur = (id: string) => {
    setTouched(prev => ({ ...prev, [id]: true }));
    validateField(id, formData[id as keyof typeof formData]);
  };

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

  const handleCountrySelect = (code: string) => {
    setFormData(prev => ({ ...prev, countryCode: code }));
    setIsDropdownOpen(false);
  };

  // Click outside or scroll to close
  useEffect(() => {
    const handleClose = (event: MouseEvent | Event) => {
      if (isDropdownOpen) {
        // For scroll events, only close if the scroll happened outside our dropdown
        if (event.type === 'scroll') {
          const target = event.target as Node;
          if (dropdownRef.current && !dropdownRef.current.contains(target)) {
            setIsDropdownOpen(false);
          }
        } else {
          // For clicks, check if it's outside
          const mouseEvent = event as MouseEvent;
          if (dropdownRef.current && !dropdownRef.current.contains(mouseEvent.target as Node)) {
            setIsDropdownOpen(false);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleClose, true); // Use capture to ensure we catch all scroll events
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [isDropdownOpen]);

  // Alert State
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

  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Edit Form State
  const [editFormData, setEditFormData] = useState<ContactDetails>({
    phoneNumbers: [],
    email: '',
    officeAddress: '',
    timings: '',
    whatsapp: '',
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: ''
  });

  useEffect(() => {
    fetchContactDetails();
    checkAdminRole();
  }, []);

  const fetchContactDetails = async () => {
    try {
      setLoading(true);
      const response = await contactService.getContactDetails();
      if (response.success) {
        setContactDetails(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch contact details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminRole = () => {
    const userDataStr = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (userDataStr) {
      try {
        const user: UserData = JSON.parse(userDataStr);
        if (user.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  };

  const handleEditClick = () => {
    if (contactDetails) {
      setEditFormData({ ...contactDetails });
    }
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...(editFormData.phoneNumbers || [])];
    newPhones[index] = value;
    setEditFormData(prev => ({ ...prev, phoneNumbers: newPhones }));
  };

  const addPhoneNumber = () => {
    if ((editFormData.phoneNumbers || []).length < 4) {
      setEditFormData(prev => ({ ...prev, phoneNumbers: [...(prev.phoneNumbers || []), ''] }));
    }
  };

  const removePhoneNumber = (index: number) => {
    const newPhones = (editFormData.phoneNumbers || []).filter((_, i) => i !== index);
    setEditFormData(prev => ({ ...prev, phoneNumbers: newPhones }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty phone numbers
      const validPhones = (editFormData.phoneNumbers || []).filter(p => p.trim() !== '');

      await contactService.updateContactDetails({
        ...editFormData,
        phoneNumbers: validPhones
      });

      await fetchContactDetails();
      setIsEditModalOpen(false);
      showAlert('success', 'Success', 'Contact details updated successfully!');
    } catch (error) {
      console.error('Failed to update contact details:', error);
      showAlert('error', 'Error', 'Failed to update contact details. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all as touched and validate
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    const newErrors: { [key: string]: string } = {};
    Object.keys(formData).forEach(key => {
      const id = key;
      const value = formData[key as keyof typeof formData];
      let error = '';
      if (id === 'fullName' && !value.trim()) error = 'Full name is required';
      if (id === 'email') {
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email';
      }
      if (id === 'phone') {
        const digits = value.replace(/\D/g, '');
        if (!digits) error = 'Phone number is required';
        else if (digits.length < 10) error = 'Min 10 digits required';
      }
      if (id === 'message' && !value.trim()) error = 'Message is required';
      if (error) newErrors[id] = error;
    });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showAlert('error', 'Validation Error', 'Please fix the errors in the form before submitting.');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    try {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      await contactInquiryService.submitInquiry({
        name: formData.fullName,
        email: formData.email,
        phone: `${formData.countryCode}${phoneDigits}`,
        message: formData.message,
      });
      setFormData({ fullName: '', email: '', countryCode: '+91', phone: '', message: '' });
      setTouched({});
      setErrors({});
      showAlert('success', 'Message Sent!', 'Thank you for reaching out. We will get back to you shortly.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      showAlert('error', 'Submission Failed', error.message || 'Sorry, your message could not be sent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="contact_container"><p>Loading contact details...</p></div>;
  }

  return (
    <div className="contact_container">

      {/* Hero Section */}
      <header className="contact_hero">
        <div style={{ position: 'relative', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h1 className="contact_hero_title">Contact Us</h1>
          <p className="contact_hero_subtitle">Questions? Comments? We are here to help.</p>
          {isAdmin && (
            <button
              onClick={handleEditClick}
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#ffffff',
                color: '#333',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            >
              <EditIcon fontSize="small" /> Edit Details
            </button>
          )}
        </div>
      </header>

      <main className="contact_main">

        <div className="contact_grid">

          {/* Form Section */}
          <section>
            <h2 className="contact_section_title">Send a Message</h2>
            <form onSubmit={handleSubmit}>
              <div className="contact_form_group">
                <label htmlFor="fullName" className="contact_label">Full Name *</label>
                <input type="text" id="fullName" placeholder="Enter Full Name"
                  className={`contact_input ${touched.fullName && errors.fullName ? 'error' : ''}`} required
                  value={formData.fullName}
                  onChange={handleFormChange}
                  onBlur={() => handleBlur('fullName')}
                />
                {touched.fullName && errors.fullName && <span className="contact_error_text">{errors.fullName}</span>}
              </div>

              <div className="contact_form_group">
                <label htmlFor="email" className="contact_label">Email Address *</label>
                <input type="email" id="email" placeholder="Enter Email Address"
                  className={`contact_input ${touched.email && errors.email ? 'error' : ''}`} required
                  value={formData.email}
                  onChange={handleFormChange}
                  onBlur={() => handleBlur('email')}
                />
                {touched.email && errors.email && <span className="contact_error_text">{errors.email}</span>}
              </div>

              <div className="contact_form_group">
                <label htmlFor="phone" className="contact_label">Phone Number *</label>
                <div className={`contact_phone_input_group ${touched.phone && errors.phone ? 'error' : ''}`}>
                  <div
                    ref={dropdownRef}
                    className="contact_custom_dropdown_container"
                    style={{ position: 'relative', width: '130px', flexShrink: 0 }}
                  >
                    <div
                      className="contact_country_select"
                      onClick={toggleDropdown}
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRight: '1px solid #ddd',
                        padding: '10px'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {COUNTRIES.find((c: Country) => c.code === formData.countryCode)?.iso} ({formData.countryCode})
                      </span>
                      <span style={{ fontSize: '10px', marginLeft: '5px' }}>▼</span>
                    </div>

                    {isDropdownOpen && (
                      <div
                        className="contact_country_options"
                        style={{
                          position: 'absolute',
                          zIndex: 100,
                          left: 0,
                          width: '110px', // Slimmer as names are removed
                          backgroundColor: 'white',
                          border: '1px solid #1e5292',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                          maxHeight: '280px', // Roughly 8 items
                          overflowY: 'auto',
                          ...(dropdownDirection === 'up' ? { bottom: '100%' } : { top: '100%' })
                        }}
                      >
                        {COUNTRIES.map((c: Country) => (
                          <div
                            key={`${c.iso}-${c.code}`}
                            className="contact_country_option"
                            onClick={() => handleCountrySelect(c.code)}
                          >
                            <span style={{ fontWeight: 'bold', width: '35px', display: 'inline-block' }}>{c.iso}</span>
                            <span style={{ color: '#666', flex: 1, textAlign: 'right' }}>{c.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    placeholder="Enter Phone Number"
                    className="contact_input contact_phone_field"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 15) {
                        setFormData(prev => ({ ...prev, phone: val }));
                        if (touched.phone) {
                          validateField('phone', val);
                        }
                      }
                    }}
                    onBlur={() => handleBlur('phone')}
                  />
                </div>
                {touched.phone && errors.phone && <span className="contact_error_text">{errors.phone}</span>}
              </div>

              <div className="contact_form_group">
                <label htmlFor="message" className="contact_label">Your Message *</label>
                <textarea id="message"
                  className={`contact_textarea ${touched.message && errors.message ? 'error' : ''}`}
                  placeholder="Enter Your Message" required
                  value={formData.message}
                  onChange={handleFormChange}
                  onBlur={() => handleBlur('message')}
                ></textarea>
                {touched.message && errors.message && <span className="contact_error_text">{errors.message}</span>}
              </div>

              <button type="submit" className="contact_submit_btn" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </section>

          {/* Info Sidebar */}
          <aside className="contact_sidebar">

            {/* Phone Block */}
            <div className="contact_info_block">
              <div className="contact_icon_wrapper">
                <PhoneIcon style={{ fontSize: '14px' }} />
              </div>
              <div className="contact_info_content">
                <h3 className="contact_info_title">Phone</h3>
                <p className="contact_info_text">{contactDetails?.timings || 'Mon – Sat, 9:30 AM – 5:30 PM'}</p>
                {contactDetails?.phoneNumbers && contactDetails.phoneNumbers.length > 0 ? (
                  contactDetails.phoneNumbers.map((phone, index) => (
                    <a key={index} href={`tel:${phone}`} className="contact_info_link" style={{ display: 'block' }}>{phone}</a>
                  ))
                ) : (
                  <p className="contact_info_text">No phone numbers available</p>
                )}
              </div>
            </div>

            {/* Email Block */}
            <div className="contact_info_block">
              <div className="contact_icon_wrapper">
                <EmailIcon style={{ fontSize: '14px' }} />
              </div>
              <div className="contact_info_content">
                <h3 className="contact_info_title">Email</h3>
                <a href={`mailto:${contactDetails?.email}`} className="contact_info_link">{contactDetails?.email || 'N/A'}</a>
              </div>
            </div>

            {/* Office Block */}
            <div className="contact_info_block">
              <div className="contact_icon_wrapper">
                <LocationOnIcon style={{ fontSize: '14px' }} />
              </div>
              <div className="contact_info_content">
                <h3 className="contact_info_title">Office</h3>
                <p className="contact_info_text" style={{ whiteSpace: 'pre-line' }}>
                  {contactDetails?.officeAddress || 'N/A'}
                </p>
              </div>
            </div>

            {/* Social Media Block */}
            {(contactDetails?.whatsapp || contactDetails?.facebook || contactDetails?.twitter || contactDetails?.linkedin || contactDetails?.instagram) && (
              <div className="contact_info_block" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <div className="contact_info_content" style={{ width: '100%' }}>
                  <h3 className="contact_info_title" style={{ marginBottom: '15px' }}>Connect With Us</h3>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {contactDetails.whatsapp && (
                      <a href={`https://wa.me/${contactDetails.whatsapp}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" style={{ color: '#25D366' }}>
                        <WhatsAppIcon />
                      </a>
                    )}
                    {contactDetails.facebook && (
                      <a href={contactDetails.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" style={{ color: '#1877F2' }}>
                        <FacebookIcon />
                      </a>
                    )}
                    {contactDetails.twitter && (
                      <a href={contactDetails.twitter} target="_blank" rel="noopener noreferrer" title="Twitter" style={{ color: '#1DA1F2' }}>
                        <TwitterIcon />
                      </a>
                    )}
                    {contactDetails.linkedin && (
                      <a href={contactDetails.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" style={{ color: '#0A66C2' }}>
                        <LinkedInIcon />
                      </a>
                    )}
                    {contactDetails.instagram && (
                      <a href={contactDetails.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" style={{ color: '#E4405F' }}>
                        <InstagramIcon />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

          </aside>
        </div>
      </main>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal_overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal_content" style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '8px',
            width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Edit Contact Details</h2>
            <form onSubmit={handleEditSubmit}>

              <div className="contact_form_group">
                <label className="contact_label">Timings</label>
                <input
                  type="text"
                  name="timings"
                  value={editFormData.timings}
                  onChange={handleEditChange}
                  className="contact_input"
                  placeholder="e.g. Mon – Sat, 9:30 AM – 5:30 PM"
                />
              </div>

              <div className="contact_form_group">
                <label className="contact_label">Phone Numbers (Max 4)</label>
                {(editFormData.phoneNumbers || []).map((phone, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                      className="contact_input"
                      placeholder="Enter phone number"
                    />
                    <button type="button" onClick={() => removePhoneNumber(index)} style={{ color: 'red', border: '1px solid red', padding: '5px 10px', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>Remove</button>
                  </div>
                ))}
                {(editFormData.phoneNumbers || []).length < 4 && (
                  <button type="button" onClick={addPhoneNumber} style={{ color: 'green', border: '1px solid green', padding: '5px 10px', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>+ Add Phone Number</button>
                )}
              </div>

              <div className="contact_form_group">
                <label className="contact_label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  className="contact_input"
                />
              </div>

              <div className="contact_form_group">
                <label className="contact_label">Office Address</label>
                <textarea
                  name="officeAddress"
                  value={editFormData.officeAddress}
                  onChange={handleEditChange}
                  className="contact_textarea"
                  rows={3}
                />
              </div>

              <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Social Media Links</h3>
              <div className="contact_form_group">
                <label className="contact_label">WhatsApp Number (e.g. 919876543210)</label>
                <input type="text" name="whatsapp" value={editFormData.whatsapp} onChange={handleEditChange} className="contact_input" />
              </div>
              <div className="contact_form_group">
                <label className="contact_label">Facebook URL</label>
                <input type="text" name="facebook" value={editFormData.facebook} onChange={handleEditChange} className="contact_input" />
              </div>
              <div className="contact_form_group">
                <label className="contact_label">Twitter URL</label>
                <input type="text" name="twitter" value={editFormData.twitter} onChange={handleEditChange} className="contact_input" />
              </div>
              <div className="contact_form_group">
                <label className="contact_label">LinkedIn URL</label>
                <input type="text" name="linkedin" value={editFormData.linkedin} onChange={handleEditChange} className="contact_input" />
              </div>
              <div className="contact_form_group">
                <label className="contact_label">Instagram URL</label>
                <input type="text" name="instagram" value={editFormData.instagram} onChange={handleEditChange} className="contact_input" />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button type="submit" className="contact_submit_btn">Save Changes</button>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '12px 24px', border: '1px solid #ddd', background: '#f5f5f5', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Popup */}
      <AlertPopup
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />

    </div>
  );
}