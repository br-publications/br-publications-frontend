import React, { useState, useRef, useEffect } from 'react';
import { COUNTRIES, type Country } from '../../../utils/countries';
import { API_BASE_URL, getAuthHeaders } from '../../../services/api.config';
import './deliveryAddressForm.css';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DeliveryAddress {
    // Recipient
    fullName: string;
    companyName: string;
    contactPersonName: string;
    countryCode: string;
    mobileNumber: string;
    altCountryCode: string;
    altMobileNumber: string;
    email: string;
    // Address
    addressLine1: string;
    addressLine2: string;
    buildingName: string;
    streetName: string;
    area: string;
    landmark: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    // International
    // International/Preferences
    isResidential: string;
    // Preferences
    deliveryInstructions: string;
}

type TabType = 'recipient' | 'address' | 'international' | 'preferences' | 'review';


// ─── Sub-Components ──────────────────────────────────────────────────────

interface PhoneFieldProps {
    fieldId: string;
    codeField: 'countryCode' | 'altCountryCode';
    numField: keyof DeliveryAddress;
    label: string;
    required?: boolean;
    form: DeliveryAddress;
    errors: Record<string, string>;
    dropdownId: string | null;
    dropdownDirection: 'up' | 'down';
    onToggleDropdown: (e: React.MouseEvent, id: string) => void;
    onSelectCountry: (field: 'countryCode' | 'altCountryCode', country: Country) => void;
    onNumberChange: (field: keyof DeliveryAddress, value: string) => void;
    onValidate: (field: keyof DeliveryAddress, value: string) => void;
}

const PhoneField: React.FC<PhoneFieldProps> = ({
    fieldId,
    codeField,
    numField,
    label,
    form,
    errors,
    dropdownId,
    dropdownDirection,
    onToggleDropdown,
    onSelectCountry,
    onNumberChange,
    onValidate,
}) => (
    <div className="dlv_formGroup">
        <label>{label}</label>
        <div className="dlv_phoneInputGroup">
            <div className="dlv_countryDropdown">
                <div
                    className="dlv_countrySelect"
                    onClick={(e) => onToggleDropdown(e, fieldId)}
                >
                    <span>{form[codeField]}</span>
                    <span className="dlv_dropdownArrow">▼</span>
                </div>
                {dropdownId === fieldId && (
                    <div className={`dlv_countryOptions ${dropdownDirection}`}>
                        {COUNTRIES.map((c) => (
                            <div
                                key={c.iso}
                                className="dlv_countryOption"
                                onClick={() => onSelectCountry(codeField, c)}
                            >
                                <span className="dlv_iso">{c.iso}</span>
                                <span className="dlv_code">{c.code}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <input
                type="tel"
                placeholder="Enter Phone Number"
                value={form[numField] as string}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 15) {
                        onNumberChange(numField, val);
                    }
                }}
                onBlur={() => onValidate(numField, form[numField] as string)}
            />
        </div>
        {errors[numField as string] && <span className="dlv_errorMessage">{errors[numField as string]}</span>}
        <span className="dlv_fieldHint">Example: {form[codeField]} XXXXX XXXXX</span>
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

interface OptionalDeliveryAddressFormProps {
    submissionId: number;
    type: 'textbook' | 'chapter';
    onSuccess: (savedAddress: any) => void;
    onCancel?: () => void;
}

const OptionalDeliveryAddressForm: React.FC<OptionalDeliveryAddressFormProps> = ({
    submissionId = 0,
    type = 'textbook',
    onSuccess = (savedAddress: any) => console.log('Optional Form submission successful!', savedAddress),
    onCancel
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('recipient');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [declarationAccepted, setDeclarationAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Country code dropdown
    const [dropdownId, setDropdownId] = useState<string | null>(null);
    const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState<DeliveryAddress>({
        fullName: '',
        companyName: '',
        contactPersonName: '',
        countryCode: '+91',
        mobileNumber: '',
        altCountryCode: '+91',
        altMobileNumber: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        buildingName: '',
        streetName: '',
        area: '',
        landmark: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isResidential: '',
        deliveryInstructions: '',
    });

    // Close dropdown on outside click or scroll
    useEffect(() => {
        const handleClose = (event: MouseEvent | Event) => {
            if (dropdownId) {
                if (event.type === 'scroll') {
                    const target = event.target as Node;
                    if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                        setDropdownId(null);
                    }
                } else {
                    const mouseEvent = event as MouseEvent;
                    if (dropdownRef.current && !dropdownRef.current.contains(mouseEvent.target as Node)) {
                        setDropdownId(null);
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
    }, [dropdownId]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    // ─── Validation ───────────────────────────────────────────────────────────

    const validatePhone = (digits: string): string => {
        const cleaned = digits.replace(/\D/g, '');
        if (cleaned && cleaned.length < 10) return 'Phone number must be at least 10 digits';
        return '';
    };

    const validateTab = (tab: TabType): boolean => {
        const newErrors: Record<string, string> = {};

        if (tab === 'recipient') {
            if (form.mobileNumber.trim()) {
                const err = validatePhone(form.mobileNumber);
                if (err) newErrors['mobileNumber'] = err;
            }
            if (form.altMobileNumber.trim()) {
                const err = validatePhone(form.altMobileNumber);
                if (err) newErrors['altMobileNumber'] = err;
            }
            if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                newErrors['email'] = 'Invalid email format';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrors }));
            return false;
        }
        return true;
    };

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleChange = (field: keyof DeliveryAddress, value: string | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
        }
    };

    const toggleDropdown = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        if (dropdownId === id) { setDropdownId(null); return; }
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setDropdownDirection(spaceBelow < 280 ? 'up' : 'down');
        setDropdownId(id);
    };

    const selectCountry = (field: 'countryCode' | 'altCountryCode', country: Country) => {
        handleChange(field, country.code);
        setDropdownId(null);
    };

    const TABS: { key: TabType; label: string; num: number }[] = [
        { key: 'recipient', label: 'Recipient', num: 1 },
        { key: 'address', label: 'Address', num: 2 },
        { key: 'preferences', label: 'Preferences', num: 3 },
        { key: 'review', label: 'Review', num: 4 },
    ];

    const tabIndex = TABS.findIndex(t => t.key === activeTab);

    const goNext = () => {
        if (!validateTab(activeTab)) return;
        if (tabIndex < TABS.length - 1) setActiveTab(TABS[tabIndex + 1].key);
    };

    const goPrev = () => {
        if (tabIndex > 0) setActiveTab(TABS[tabIndex - 1].key);
    };

    const handleTabClick = (tab: TabType) => {
        if (!validateTab(activeTab)) return;
        setActiveTab(tab);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!declarationAccepted) {
            window.dispatchEvent(new CustomEvent('app-alert', {
                detail: {
                    type: 'warning',
                    title: 'Declaration Required',
                    message: 'Please accept the final declaration before submitting.'
                }
            }));
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/optional-delivery-address`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...form,
                    submissionId,
                    submissionType: type
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit optional delivery address');
            }

            window.dispatchEvent(new CustomEvent('app-alert', {
                detail: {
                    type: 'success',
                    title: 'Success',
                    message: 'Optional delivery address submitted successfully!'
                }
            }));
            onSuccess(data.data || data); // Pass the saved address data
        } catch (error: any) {
            console.error('Error submitting optional delivery address:', error);
            window.dispatchEvent(new CustomEvent('app-alert', {
                detail: {
                    type: 'error',
                    title: 'Submission Failed',
                    message: error.message || 'An error occurred while submitting the form.'
                }
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleValidate = (field: keyof DeliveryAddress, value: string) => {
        if (value.trim()) {
            const err = validatePhone(value);
            if (err) setErrors(prev => ({ ...prev, [field]: err }));
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <main>
            {/* Header */}
            <div className="dlv_hero">
                <h1>📦 Optional Delivery Address</h1>
                <p>Provide an alternate shipping address if different from the primary one</p>
            </div>

            <div className="dlv_wrapper">
                <div className="dlv_container">
                    {/* Tab Navigation */}
                    <div className="dlv_tabNavigation">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`dlv_tabButton ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => handleTabClick(tab.key)}
                            >
                                <span className="dlv_tabNumber">{tab.num}</span>
                                <span className="dlv_tabLabel">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="dlv_submitSection">

                            {/* ── Tab 1: Recipient ── */}
                            {activeTab === 'recipient' && (
                                <div className="dlv_tabContent">
                                    <h3 className="dlv_sectionTitle">👤 Recipient Information</h3>

                                    <div className="dlv_formGroup full">
                                        <label>Full Name (as per Government ID)</label>
                                        <input
                                            type="text"
                                            placeholder="Enter full legal name"
                                            value={form.fullName}
                                            onChange={(e) => handleChange('fullName', e.target.value)}
                                        />
                                        {errors.fullName && <span className="dlv_errorMessage">{errors.fullName}</span>}
                                    </div>

                                    <div className="dlv_formRow">
                                        <div className="dlv_formGroup">
                                            <label>Company Name <span className="dlv_optional">(Optional)</span></label>
                                            <input
                                                type="text"
                                                placeholder="Office / Institution name"
                                                value={form.companyName}
                                                onChange={(e) => handleChange('companyName', e.target.value)}
                                            />
                                        </div>
                                        <div className="dlv_formGroup">
                                            <label>Contact Person Name <span className="dlv_optional">(If different from recipient)</span></label>
                                            <input
                                                type="text"
                                                placeholder="Alternate contact person"
                                                value={form.contactPersonName}
                                                onChange={(e) => handleChange('contactPersonName', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="dlv_formRow" ref={dropdownRef}>
                                        <PhoneField
                                            fieldId="optional-mobile"
                                            codeField="countryCode"
                                            numField="mobileNumber"
                                            label="Mobile Number"
                                            required={false}
                                            form={form}
                                            errors={errors}
                                            dropdownId={dropdownId}
                                            dropdownDirection={dropdownDirection}
                                            onToggleDropdown={toggleDropdown}
                                            onSelectCountry={selectCountry}
                                            onNumberChange={handleChange}
                                            onValidate={handleValidate}
                                        />
                                        <PhoneField
                                            fieldId="optional-altmobile"
                                            codeField="altCountryCode"
                                            numField="altMobileNumber"
                                            label={`Alternate Contact Number`}
                                            required={false}
                                            form={form}
                                            errors={errors}
                                            dropdownId={dropdownId}
                                            dropdownDirection={dropdownDirection}
                                            onToggleDropdown={toggleDropdown}
                                            onSelectCountry={selectCountry}
                                            onNumberChange={handleChange}
                                            onValidate={handleValidate}
                                        />
                                    </div>

                                    <div className="dlv_formGroup full">
                                        <label>Email Address <span className="dlv_optional">(For tracking updates)</span></label>
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            value={form.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            onBlur={() => {
                                                if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                                    setErrors(p => ({ ...p, email: 'Invalid email format' }));
                                            }}
                                        />
                                        {errors.email && <span className="dlv_errorMessage">{errors.email}</span>}
                                    </div>
                                </div>
                            )}

                            {/* ── Tab 2: Address ── */}
                            {activeTab === 'address' && (
                                <div className="dlv_tabContent">
                                    <h3 className="dlv_sectionTitle">🏠 Complete Delivery Address</h3>

                                    <div className="dlv_formGroup full">
                                        <label>🏠 Address Line 1</label>
                                        <input
                                            type="text"
                                            placeholder="House / Flat / Apartment Number"
                                            value={form.addressLine1}
                                            onChange={(e) => handleChange('addressLine1', e.target.value)}
                                        />
                                        {errors.addressLine1 && <span className="dlv_errorMessage">{errors.addressLine1}</span>}
                                    </div>

                                    <div className="dlv_formRow">
                                        <div className="dlv_formGroup">
                                            <label>Building Name <span className="dlv_optional">(Optional)</span></label>
                                            <input
                                                type="text"
                                                placeholder="Building / Complex name"
                                                value={form.buildingName}
                                                onChange={(e) => handleChange('buildingName', e.target.value)}
                                            />
                                        </div>
                                        <div className="dlv_formGroup">
                                            <label>Street Name <span className="dlv_optional">(Optional)</span></label>
                                            <input
                                                type="text"
                                                placeholder="Street / Road name"
                                                value={form.streetName}
                                                onChange={(e) => handleChange('streetName', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="dlv_formRow">
                                        <div className="dlv_formGroup">
                                            <label>Area / Locality <span className="dlv_optional">(Optional)</span></label>
                                            <input
                                                type="text"
                                                placeholder="Neighbourhood / Area"
                                                value={form.area}
                                                onChange={(e) => handleChange('area', e.target.value)}
                                            />
                                        </div>
                                        <div className="dlv_formGroup">
                                            <label>Landmark <span className="dlv_optional">(Optional)</span></label>
                                            <input
                                                type="text"
                                                placeholder="Near ___ (e.g. Near City Mall)"
                                                value={form.landmark}
                                                onChange={(e) => handleChange('landmark', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="dlv_formRow">
                                        <div className="dlv_formGroup">
                                            <label>🌍 City / Town</label>
                                            <input
                                                type="text"
                                                placeholder="City name"
                                                value={form.city}
                                                onChange={(e) => handleChange('city', e.target.value)}
                                            />
                                            {errors.city && <span className="dlv_errorMessage">{errors.city}</span>}
                                        </div>
                                        <div className="dlv_formGroup">
                                            <label>🗺 State / Province / Region</label>
                                            <input
                                                type="text"
                                                placeholder="State or Province"
                                                value={form.state}
                                                onChange={(e) => handleChange('state', e.target.value)}
                                            />
                                            {errors.state && <span className="dlv_errorMessage">{errors.state}</span>}
                                        </div>
                                    </div>

                                    <div className="dlv_formRow">
                                        <div className="dlv_formGroup">
                                            <label>📮 Postal Code / ZIP Code</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 600001"
                                                value={form.postalCode}
                                                onChange={(e) => handleChange('postalCode', e.target.value)}
                                            />
                                            {errors.postalCode && <span className="dlv_errorMessage">{errors.postalCode}</span>}
                                        </div>
                                        <div className="dlv_formGroup">
                                            <label>🌎 Country</label>
                                            <select
                                                value={form.country}
                                                onChange={(e) => handleChange('country', e.target.value)}
                                            >
                                                <option value="">Select Country</option>
                                                {COUNTRIES.map((c) => (
                                                    <option key={c.iso} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                            {errors.country && <span className="dlv_errorMessage">{errors.country}</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Tab 3: Preferences ── */}
                            {activeTab === 'preferences' && (
                                <div className="dlv_tabContent">
                                    <h3 className="dlv_sectionTitle">🚚 Delivery Preferences</h3>

                                    <div className="dlv_infoBox">
                                        <p>Please provide additional details for shipping and custom clearance.</p>
                                    </div>

                                    <div className="dlv_formRow">
                                        <div className="dlv_formGroup">
                                            <label>Destination Country Code</label>
                                            <input
                                                type="text"
                                                value={form.country ? (COUNTRIES.find(c => c.name === form.country)?.iso || '—') : '—'}
                                                readOnly
                                                className="dlv_readOnly"
                                            />
                                            <span className="dlv_fieldHint">Auto-filled from your country selection</span>
                                        </div>
                                        <div className="dlv_formGroup">
                                            <label>Address Type</label>
                                            <select
                                                value={form.isResidential}
                                                onChange={(e) => handleChange('isResidential', e.target.value)}
                                            >
                                                <option value="">Select type</option>
                                                <option value="residential">🏠 Residential Address</option>
                                                <option value="commercial">🏢 Commercial / Office Address</option>
                                            </select>
                                            {errors.isResidential && <span className="dlv_errorMessage">{errors.isResidential}</span>}
                                        </div>
                                    </div>

                                    <div className="dlv_formGroup full">
                                        <label>Delivery Instructions <span className="dlv_optional">(Optional)</span></label>
                                        <textarea
                                            placeholder="e.g. Leave at the door, ring bell twice, call before delivery..."
                                            value={form.deliveryInstructions}
                                            onChange={(e) => handleChange('deliveryInstructions', e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── Tab 4: Review ── */}
                            {activeTab === 'review' && (
                                <div className="dlv_tabContent">
                                    <h3 className="dlv_sectionTitle">✅ Review & Confirm</h3>

                                    <div className="dlv_reviewSection">
                                        <h4>Recipient Information</h4>
                                        <div className="dlv_reviewGrid">
                                            <div className="dlv_reviewItem"><label>Full Name</label><p>{form.fullName || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Company</label><p>{form.companyName || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Contact Person</label><p>{form.contactPersonName || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Mobile</label><p>{form.countryCode} {form.mobileNumber || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Alternate Mobile</label><p>{form.altMobileNumber ? `${form.altCountryCode} ${form.altMobileNumber}` : '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Email</label><p>{form.email || '—'}</p></div>
                                        </div>
                                    </div>

                                    <div className="dlv_reviewSection">
                                        <h4>Delivery Address</h4>
                                        <div className="dlv_reviewGrid">
                                            <div className="dlv_reviewItem full"><label>Address Line 1</label><p>{form.addressLine1 || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Building</label><p>{form.buildingName || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Street</label><p>{form.streetName || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Area / Locality</label><p>{form.area || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Landmark</label><p>{form.landmark || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>City</label><p>{form.city || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>State / Province</label><p>{form.state || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Postal Code</label><p>{form.postalCode || '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Country</label><p>{form.country || '—'}</p></div>
                                        </div>
                                    </div>

                                    <div className="dlv_reviewSection">
                                        <h4>International & Delivery</h4>
                                        <div className="dlv_reviewGrid">
                                            <div className="dlv_reviewItem"><label>Country ISO Code</label><p>{form.country ? (COUNTRIES.find(c => c.name === form.country)?.iso || '—') : '—'}</p></div>
                                            <div className="dlv_reviewItem"><label>Address Type</label><p>{form.isResidential === 'residential' ? '🏠 Residential' : form.isResidential === 'commercial' ? '🏢 Commercial' : '—'}</p></div>
                                            {form.deliveryInstructions && (
                                                <div className="dlv_reviewItem full"><label>Delivery Instructions</label><p>{form.deliveryInstructions}</p></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Declaration */}
                                    <div className="dlv_declarationSection">
                                        <h4 className="dlv_declarationHeading">📋 Final Declaration</h4>
                                        <p className="dlv_declarationText">
                                            I/We hereby confirm that all the optional delivery address details provided above are accurate and complete.
                                            I understand that incorrect information may lead to delivery failure, additional charges, or delays.
                                            I authorize the publisher to share these details with courier and customs authorities for the purpose of book delivery.
                                        </p>
                                        <label className="dlv_declarationCheckbox">
                                            <input
                                                type="checkbox"
                                                checked={declarationAccepted}
                                                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                                            />
                                            <span className="dlv_declarationLabel">
                                                I accept the above declaration and confirm that all information provided is accurate and complete.
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="dlv_formNavigation">
                            {activeTab !== 'recipient' ? (
                                <button type="button" className="dlv_navButton dlv_prevButton" onClick={goPrev}>
                                    ← Previous
                                </button>
                            ) : onCancel ? (
                                <button type="button" className="dlv_navButton dlv_prevButton" onClick={onCancel} style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>
                                    Cancel
                                </button>
                            ) : <div />}

                            {activeTab !== 'review' ? (
                                <button type="button" className="dlv_navButton dlv_nextButton" onClick={goNext}>
                                    Next →
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="dlv_navButton dlv_nextButton"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting…' : '✅ Submit Optional Address'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default OptionalDeliveryAddressForm;
