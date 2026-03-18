import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowBack,
    Assignment,
    CalendarToday,
    Person,
    Description,
    Business,
    School
} from '@mui/icons-material';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import authService from '../../services/auth.service';
import { projectInternshipService, type ProjectInternshipResponse } from '../../services/projectInternship.service';
import './projectDashboard.css';

const ProjectDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState<ProjectInternshipResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Action state
    const [adminNotes, setAdminNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
    }>({ isOpen: false, type: 'info', title: '', message: '' });

    useEffect(() => {
        const user = authService.getUser();
        if (user) {
            setIsAdmin(['admin', 'developer', 'editor'].includes(user.role));
        }

        if (id) {
            fetchSubmission(id);
        }
    }, [id]);

    const fetchSubmission = async (submissionId: string) => {
        try {
            setLoading(true);
            const data = await projectInternshipService.getSubmissionById(submissionId);
            setSubmission(data);
            if (data.adminNotes) setAdminNotes(data.adminNotes);
        } catch (error: any) {
            console.error('Error fetching submission:', error);
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to load submission details'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status: 'ACCEPTED' | 'REJECTED') => {
        if (!submission) return;

        // Validation: Admin notes / feedback is mandatory
        if (!adminNotes || adminNotes.trim() === '') {
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Validation Error',
                message: 'Please provide reviewer notes / feedback before submitting your decision.'
            });
            return;
        }

        try {
            setActionLoading(true);
            await projectInternshipService.updateStatus(submission.id, status, adminNotes);

            setAlertConfig({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: `Application ${status.toLowerCase()} successfully.`
            });

            // Refresh data and reload page for admin after a short delay to let them see the success message
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error: any) {
            console.error('Update status error:', error);
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Action Failed',
                message: error.message || 'Failed to update application status'
            });
            setActionLoading(false);
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'WEB': return 'Web Development Project';
            case 'MOBILE': return 'Mobile App Project';
            case 'INTERNSHIP': return 'Student Internship';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="rd_loadingContainer">
                <div className="rd_spinner"></div>
                <p>Loading submission details...</p>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="rd_errorContainer">
                <div className="rd_errorIcon">⚠️</div>
                <h2>Submission Not Found</h2>
                <button className="rd_backBtn" onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    // Render logic based on submission type
    const renderWebMobileDetails = () => (
        <>
            <div className="rd_section">
                <h3 className="rd_sectionTitle"><Business style={{ marginRight: 6, fontSize: '18px' }} /> Project Details</h3>
                <div className="rd_grid">
                    <div className="rd_item">
                        <label>Company Name</label>
                        <span>{submission.data.company}</span>
                    </div>
                    <div className="rd_item">
                        <label>Project Type / Platform</label>
                        <span style={{ textTransform: 'capitalize' }}>
                            {submission.data.projectType?.replace(/_/g, ' ') || submission.data.platform}
                        </span>
                    </div>
                    <div className="rd_item">
                        <label>Budget Range</label>
                        <span>{submission.data.budget}</span>
                    </div>
                    <div className="rd_item">
                        <label>Timeline</label>
                        <span>{submission.data.timeline}</span>
                    </div>
                </div>
            </div>
            <div className="rd_section">
                <h3 className="rd_sectionTitle"><Description style={{ marginRight: 6, fontSize: '18px' }} /> Description</h3>
                <p className="rd_textBlock">{submission.data.description}</p>
            </div>
        </>
    );

    const renderInternshipDetails = () => (
        <>
            <div className="rd_section">
                <h3 className="rd_sectionTitle"><School style={{ marginRight: 6, fontSize: '18px' }} /> Academic Info</h3>
                <div className="rd_grid">
                    <div className="rd_item">
                        <label>College/University</label>
                        <span>{submission.data.college}</span>
                    </div>
                    <div className="rd_item">
                        <label>Course</label>
                        <span>{submission.data.course}</span>
                    </div>
                    <div className="rd_item">
                        <label>Current Year</label>
                        <span>{submission.data.year}</span>
                    </div>
                    <div className="rd_item">
                        <label>Preferred Domain</label>
                        <span>{submission.data.domain}</span>
                    </div>
                </div>
            </div>
            <div className="rd_section">
                <h3 className="rd_sectionTitle"><Description style={{ marginRight: 6, fontSize: '18px' }} /> Motivation</h3>
                <p className="rd_textBlock">{submission.data.message}</p>
            </div>
        </>
    );

    return (
        <div className="rd_wrapper">
            <div className="rd_container">
                <button className="rd_backLink" onClick={() => navigate(-1)}>
                    <ArrowBack style={{ fontSize: '16px' }} /> Back to Dashboard
                </button>

                <div className="rd_header">
                    <div>
                        <div className="rd_roleTag">{getTypeLabel(submission.submissionType)}</div>
                        <h1 className="rd_title">
                            {submission.submissionType === 'INTERNSHIP'
                                ? `Internship Application: ${submission.data.name}`
                                : `Project Request: ${submission.data.name}`}
                        </h1>
                        <div className="rd_meta">
                            <span><CalendarToday style={{ fontSize: '14px' }} /> Submitted: {new Date(submission.createdAt).toLocaleDateString()}</span>
                            <span><Assignment style={{ fontSize: '14px' }} /> ID: {submission.applicationId}</span>
                        </div>
                    </div>
                    <div className={`rd_statusBadge ${submission.status.toLowerCase()}`}>
                        {submission.status}
                    </div>
                </div>

                <div className="rd_content">
                    {/* Common Contact Info */}
                    <div className="rd_section">
                        <h3 className="rd_sectionTitle"><Person style={{ marginRight: 6, fontSize: '18px' }} /> Contact Information</h3>
                        <div className="rd_grid">
                            <div className="rd_item">
                                <label>Full Name</label>
                                <span>{submission.data.name}</span>
                            </div>
                            <div className="rd_item">
                                <label>Email</label>
                                <span>{submission.data.email}</span>
                            </div>
                            <div className="rd_item">
                                <label>Phone</label>
                                <span>{submission.data.phone}</span>
                            </div>
                            {/* If authenticated user info is available */}
                            {submission.applicant && (
                                <div className="rd_item">
                                    <label>Registered User</label>
                                    <span>{submission.applicant.fullName} ({submission.applicant.email})</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Specific Details */}
                    {submission.submissionType === 'INTERNSHIP' ? renderInternshipDetails() : renderWebMobileDetails()}

                    {/* Decision Feedback - Visible to everyone if decided and feedback exists */}
                    {!isAdmin && submission.status !== 'PENDING' && submission.adminNotes && submission.adminNotes.length > 0 && (
                        <div className="rd_section rd_feedbackSection">
                            <h3 className="rd_sectionTitle"><Assignment style={{ marginRight: 6, fontSize: '18px' }} /> Reviewer Feedback</h3>
                            <div className="rd_feedbackContent">
                                {submission.adminNotes}
                            </div>
                        </div>
                    )}

                    {/* Admin Actions Section */}
                    {isAdmin && (
                        <div className="rd_adminSection">
                            <h3 className="rd_sectionTitle">Admin Decision</h3>
                            <div className="rd_notesGroup">
                                <label>Reviewer Notes / Feedback</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add notes explaining your decision..."
                                    disabled={submission.status !== 'PENDING' || actionLoading}
                                />
                            </div>

                            {submission.status === 'PENDING' ? (
                                <div className="rd_actionButtons">
                                    <button
                                        className="rd_btn rd_btnReject"
                                        onClick={() => handleStatusUpdate('REJECTED')}
                                        disabled={actionLoading}
                                    >
                                        Reject Application
                                    </button>
                                    <button
                                        className="rd_btn rd_btnAccept"
                                        onClick={() => handleStatusUpdate('ACCEPTED')}
                                        disabled={actionLoading}
                                    >
                                        Accept Application
                                    </button>
                                </div>
                            ) : (
                                <div className="rd_decisionInfo">
                                    <p>This application was <strong>{submission.status}</strong>.</p>
                                    {/* Could add 'Updated By' info if available in response */}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

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

export default ProjectDetailView;
