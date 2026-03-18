import React, { useState, useEffect } from 'react';
import {
    Search,
    FilterList,
    Mail,
    Phone,
    CheckCircle,
    HourglassEmpty,
    Visibility,
    SendRounded,
    Close,
    InboxRounded
} from '@mui/icons-material';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import { contactInquiryService, type ContactInquiryResponse } from '../../services/contactInquiry.service';
import './contactDashboard.css';

const AdminContactDashboard: React.FC = () => {
    const [inquiries, setInquiries] = useState<ContactInquiryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiryResponse | null>(null);
    const [ackMessage, setAckMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
    }>({ isOpen: false, type: 'info', title: '', message: '' });

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            const data = await contactInquiryService.getAllInquiries();
            setInquiries(data);
        } catch (error: any) {
            showAlert('error', 'Error', error.message || 'Failed to load inquiries');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type: AlertType, title: string, message: string) => {
        setAlertConfig({ isOpen: true, type, title, message });
    };

    const handleOpenInquiry = (inquiry: ContactInquiryResponse) => {
        setSelectedInquiry(inquiry);
        setAckMessage('');
    };

    const handleCloseModal = () => {
        setSelectedInquiry(null);
        setAckMessage('');
    };

    const handleSendAcknowledgment = async () => {
        if (!selectedInquiry || !ackMessage.trim()) return;
        setSending(true);
        try {
            const updated = await contactInquiryService.acknowledgeInquiry(selectedInquiry.id, ackMessage.trim());
            setInquiries(prev => prev.map(q => q.id === updated.id ? updated : q));
            showAlert('success', 'Acknowledged', `Your response has been sent to ${selectedInquiry.email}.`);
            handleCloseModal();
        } catch (error: any) {
            showAlert('error', 'Error', error.message || 'Failed to send acknowledgment.');
        } finally {
            setSending(false);
        }
    };

    // Client-side filtering
    const filteredInquiries = inquiries.filter(q => {
        const matchesSearch =
            q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (q.phone || '').includes(searchTerm);
        const matchesStatus = filterStatus === 'ALL' || q.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalCount = inquiries.length;
    const pendingCount = inquiries.filter(q => q.status === 'PENDING').length;
    const acknowledgedCount = inquiries.filter(q => q.status === 'ACKNOWLEDGED').length;

    const getStatusColor = (status: string) =>
        status === 'ACKNOWLEDGED' ? '#10b981' : '#f59e0b';

    const getStatusIcon = (status: string) =>
        status === 'ACKNOWLEDGED'
            ? <CheckCircle style={{ fontSize: '13px' }} />
            : <HourglassEmpty style={{ fontSize: '13px' }} />;

    return (
        <div className="acid_wrapper">
            <div className="acid_container">

                {/* Header */}
                <div className="acid_header">
                    <div>
                        <h1>Contact Inquiries</h1>
                        <p>Review and respond to messages submitted via the Contact Us form</p>
                    </div>
                    <Mail style={{ fontSize: '40px', opacity: 0.4 }} />
                </div>

                {/* Stats */}
                <div className="acid_stats">
                    <div className="acid_stat_card">
                        <h3>{totalCount}</h3>
                        <p>Total Inquiries</p>
                    </div>
                    <div className="acid_stat_card pending">
                        <h3>{pendingCount}</h3>
                        <p>Pending</p>
                    </div>
                    <div className="acid_stat_card acknowledged">
                        <h3>{acknowledgedCount}</h3>
                        <p>Acknowledged</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="acid_controls">
                    <div className="acid_searchBox">
                        <Search />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="acid_filterGroup">
                        <FilterList />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="ACKNOWLEDGED">Acknowledged</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="acid_listContainer">
                    {loading ? (
                        <div className="acid_loading">
                            <div className="acid_spinner" />
                            <p>Loading inquiries...</p>
                        </div>
                    ) : filteredInquiries.length === 0 ? (
                        <div className="acid_emptyState">
                            <InboxRounded style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: 8 }} />
                            <h3>No Inquiries Found</h3>
                            <p>Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        <div className="acid_grid">
                            {filteredInquiries.map((inquiry) => (
                                <div key={inquiry.id} className="acid_card">
                                    <div className="acid_cardHeader">
                                        <span className="acid_dateLabel">
                                            {new Date(inquiry.createdAt).toLocaleDateString('en-IN', {
                                                year: 'numeric', month: 'short', day: 'numeric'
                                            })}
                                        </span>
                                        <div
                                            className="acid_statusBadge"
                                            style={{
                                                backgroundColor: `${getStatusColor(inquiry.status)}18`,
                                                color: getStatusColor(inquiry.status),
                                            }}
                                        >
                                            {getStatusIcon(inquiry.status)}
                                            <span>{inquiry.status}</span>
                                        </div>
                                    </div>

                                    <div className="acid_cardBody">
                                        <div className="acid_personInfo">
                                            <div className="acid_avatar">
                                                {inquiry.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4>{inquiry.name}</h4>
                                                <span><Mail style={{ fontSize: '11px', marginRight: 3 }} />{inquiry.email}</span>
                                            </div>
                                        </div>
                                        {inquiry.phone && (
                                            <span className="acid_phone">
                                                <Phone style={{ fontSize: '11px', marginRight: 3 }} />{inquiry.phone}
                                            </span>
                                        )}
                                        <div className="acid_messagePreview">
                                            {inquiry.message}
                                        </div>
                                    </div>

                                    <div className="acid_cardFooter">
                                        <button
                                            className={`acid_reviewBtn${inquiry.status === 'ACKNOWLEDGED' ? ' acknowledged' : ''}`}
                                            onClick={() => handleOpenInquiry(inquiry)}
                                        >
                                            <Visibility style={{ fontSize: '15px' }} />
                                            {inquiry.status === 'ACKNOWLEDGED' ? 'View Response' : 'Review & Respond'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedInquiry && (
                <div className="acid_modalOverlay" onClick={handleCloseModal}>
                    <div className="acid_modal" onClick={(e) => e.stopPropagation()}>
                        <div className="acid_modalHeader">
                            <h2>Contact Inquiry Details</h2>
                            <button className="acid_closeBtn" onClick={handleCloseModal}>
                                <Close fontSize="small" />
                            </button>
                        </div>

                        <div className="acid_modalBody">
                            {/* Details */}
                            <div className="acid_detailRow">
                                <div className="acid_detailField">
                                    <label>Full Name : </label>
                                    <span>{selectedInquiry.name}</span>
                                </div>
                                <div className="acid_detailField">
                                    <label>Email ID : </label>
                                    <a href={`mailto:${selectedInquiry.email}`}>{selectedInquiry.email}</a>
                                </div>
                                <div className="acid_detailField">
                                    <label>Phone Number : </label>
                                    <span>{selectedInquiry.phone || '—'}</span>
                                </div>
                                <div className="acid_detailField">
                                    <label>Received On : </label>
                                    <span>{new Date(selectedInquiry.createdAt).toLocaleString('en-IN', {
                                        dateStyle: 'long', timeStyle: 'short'
                                    })}</span>
                                </div>
                            </div>

                            {/* Message */}
                            <div className="acid_fullMessage">
                                <p>{selectedInquiry.message}</p>
                            </div>

                            {/* Acknowledgment area */}
                            <div className="acid_ackSection">
                                {selectedInquiry.status === 'ACKNOWLEDGED' ? (
                                    <div className="acid_alreadyAcked">
                                        <p>✅ Response Already Sent</p>
                                        <blockquote>{selectedInquiry.adminNotes}</blockquote>
                                    </div>
                                ) : (
                                    <>
                                        <h3>Send Acknowledgment</h3>
                                        <p className="acid_hint">
                                            Write a response below. It will be emailed to <strong>{selectedInquiry.email}</strong>.
                                        </p>
                                        <textarea
                                            className="acid_ackTextarea"
                                            rows={5}
                                            placeholder="Type your response here..."
                                            value={ackMessage}
                                            onChange={(e) => setAckMessage(e.target.value)}
                                        />
                                        <div className="acid_ackActions">
                                            <button
                                                className="acid_sendBtn"
                                                onClick={handleSendAcknowledgment}
                                                disabled={sending || !ackMessage.trim()}
                                            >
                                                <SendRounded style={{ fontSize: '16px' }} />
                                                {sending ? 'Sending...' : 'Send Acknowledgment & Email'}
                                            </button>
                                            <button className="acid_cancelBtn" onClick={handleCloseModal}>
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
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
        </div>
    );
};

export default AdminContactDashboard;
