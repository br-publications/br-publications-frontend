import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowBack,
    Check,
    Close,
    School,
    Work,
    Person,
    Info,
    CalendarToday
} from '@mui/icons-material';
import { recruitmentService } from '../../services/recruitment.service';
import { API_BASE_URL } from '../../services/api.config';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import './recruitmentDashboard.css';
import '../projectsInternshipSubmission/projectDashboard.css';

const RecruitmentDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [application, setApplication] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [assignedRole, setAssignedRole] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [userRole, setUserRole] = useState<string>('');

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
        showCancel?: boolean;
        confirmText?: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { getStoredUser } = await import('../../services/api.config');
            const user = getStoredUser();
            setUserRole(user?.role || '');

            const data = await recruitmentService.getApplicationById(id!);
            setApplication(data);
            setAdminNotes(data.adminNotes || '');
            setAssignedRole(data.appliedRole || '');
        } catch (err: any) {
            console.error('Failed to load application', err);
            setError(err.message || 'Failed to load application details');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const executeUpdateStatus = async (status: 'ACCEPTED' | 'REJECTED') => {
        // Close the confirmation dialog first
        setAlertConfig(prev => ({ ...prev, isOpen: false }));

        setIsProcessing(true);
        try {
            await recruitmentService.updateStatus(application.id, status, adminNotes, assignedRole);
            setAlertConfig({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: `Application has been ${status.toLowerCase()} successfully.`
            });
            // Update local state
            setApplication({ ...application, status, appliedRole: status === 'ACCEPTED' ? assignedRole : application.appliedRole });
        } catch (err: any) {
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to update application'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateStatus = (status: 'ACCEPTED' | 'REJECTED') => {
        if (!application) return;

        // Mandate notes for rejection
        if (status === 'REJECTED' && !adminNotes.trim()) {
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Decision Notes Required',
                message: 'Please provide a reason or decision message in the "Internal Notes" section before rejecting this application.'
            });
            return;
        }

        const isRoleChanged = assignedRole !== application.appliedRole;
        let confirmMsg = status === 'ACCEPTED' ?
            `Are you sure you want to accept this candidate as ${assignedRole.toUpperCase()}?` :
            'Are you sure you want to reject this application?';

        let confirmTitle = status === 'ACCEPTED' ? 'Confirm Acceptance' : 'Confirm Rejection';

        if (status === 'ACCEPTED' && isRoleChanged) {
            confirmMsg = `⚠️ WARNING: You are changing the assigned role from ${application.appliedRole.toUpperCase()} to ${assignedRole.toUpperCase()}. \n\nAre you sure you want to proceed with this assignment?`;
            confirmTitle = 'Role Change Warning';
        }

        setAlertConfig({
            isOpen: true,
            type: status === 'ACCEPTED' ? (isRoleChanged ? 'warning' : 'info') : 'warning',
            title: confirmTitle,
            message: confirmMsg,
            showCancel: true,
            confirmText: 'Yes, Proceed',
            onConfirm: () => executeUpdateStatus(status)
        });
    };

    if (loading) return <div className="recruitment_loadingContainer"><div className="recruitment_spinner"></div></div>;
    if (error) return <div className="recruitment_errorView"><h2>Error</h2><p>{error}</p><button onClick={handleBack}>Go Back</button></div>;
    if (!application) return <div className="recruitment_errorView"><h2>Not Found</h2><p>Application not found.</p><button onClick={handleBack}>Go Back</button></div>;

    const isAdmin = ['admin', 'editor', 'developer'].includes(userRole.toLowerCase());
    const isPending = application.status === 'PENDING';

    return (
        <div className="rd_wrapper">
            <div className="rd_container">
                <button className="rd_backLink" onClick={handleBack}>
                    <ArrowBack style={{ fontSize: '14px' }} /> Back to Dashboard
                </button>

                <div className="rd_header">
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'center', flex: 1 }}>
                        {application.personalImage ? (
                            <img
                                src={application.personalImage.startsWith('http') ? application.personalImage : `${API_BASE_URL}${application.personalImage.startsWith('/') ? '' : '/'}${application.personalImage}`}
                                alt={`${application.firstName} ${application.lastName}`}
                                className="recruitment_detailAvatar"
                                style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                            />
                        ) : (
                            <div className="recruitment_detailAvatarPlaceholder" style={{ width: '60px', height: '60px', borderRadius: '8px', fontSize: '18px', flexShrink: 0 }}>
                                {application.firstName[0]}{application.lastName[0]}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="rd_roleTag">{application.appliedRole.toUpperCase()}</div>
                            <h1 className="rd_title" style={{ margin: 0 }}>{application.firstName} {application.lastName}</h1>
                            <div className="rd_meta">
                                <span><Info style={{ fontSize: '14px' }} /> Application ID: {application.applicationId || `REC-${application.id}`}</span>
                                <span><CalendarToday style={{ fontSize: '14px', marginRight: '4px' }} /> Submitted: {new Date(application.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`rd_statusBadge ${application.status.toLowerCase()}`}>
                        {application.status}
                    </div>
                </div>

                <div className="rd_content" style={{ marginBottom: '16px' }}>
                    {/* Personal Information */}
                    <section className="rd_section">
                        <h3 className="rd_sectionTitle"><Person style={{ marginRight: 6, fontSize: '16px' }} /> Personal Information</h3>
                        <div className="rd_grid">
                            <div className="rd_item"><label>Email</label><span>{application.email}</span></div>
                            <div className="rd_item"><label>Phone</label><span>{application.phoneNumber}</span></div>
                            <div className="rd_item"><label>Designation</label><span>{application.designation}</span></div>
                            <div className="rd_item"><label>Department</label><span>{application.department}</span></div>
                            <div className="rd_item"><label>Institute</label><span>{application.instituteName}</span></div>
                            <div className="rd_item"><label>City</label><span>{application.city}</span></div>
                            <div className="rd_item"><label>State</label><span>{application.state}</span></div>
                            <div className="rd_item"><label>Country</label><span>{application.country}</span></div>
                        </div>
                    </section>

                    {/* Academic Profile */}
                    <section className="rd_section">
                        <h3 className="rd_sectionTitle"><School style={{ marginRight: 6, fontSize: '16px' }} /> Academic Profile</h3>
                        <div className="rd_grid">
                            <div className="rd_item"><label>Highest Qualification</label><span>{application.highestQualification}</span></div>
                            <div className="rd_item">
                                <label>Scopus ID / Profile Link</label>
                                <span><a href={application.scopusId} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{application.scopusId}</a></span>
                            </div>
                            <div className="rd_item">
                                <label>Biography</label>
                                <p className="rd_textBlock" style={{ padding: 0, background: 'none', border: 'none' }}>{application.biography}</p>
                            </div>
                        </div>
                    </section>

                    {/* Application Metadata */}
                    <section className="rd_section">
                        <h3 className="rd_sectionTitle"><Info style={{ marginRight: 6, fontSize: '16px' }} /> Application Metadata</h3>
                        <div className="rd_grid">
                            <div className="rd_item"><label>Applied On</label><span>{new Date(application.createdAt).toLocaleDateString()}</span></div>
                            <div className="rd_item"><label>Last Updated</label><span>{new Date(application.updatedAt).toLocaleDateString()}</span></div>
                            <div className="rd_item"><label>Application ID</label><span>{application.applicationId || `REC-${application.id}`}</span></div>
                        </div>
                    </section>

                    {/* Admin Decisions / Reviewer Feedback */}
                    {isAdmin && (
                        <div className="rd_adminSection" style={{ marginTop: '0', marginBottom: '16px' }}>
                            <h3 className="rd_sectionTitle"><Work style={{ marginRight: 6, fontSize: '16px' }} /> Admin Decision</h3>
                            <div className="rd_notesGroup">
                                <label>
                                    Internal Notes / Decision Message
                                    {isPending && <span style={{ color: '#6b7280', fontSize: '11px', fontWeight: 'normal', marginLeft: '6px' }}>(Required for rejection)</span>}
                                </label>
                                <textarea
                                    placeholder="Add notes for candidate or internal records..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    disabled={!isPending && !isAdmin}
                                    rows={6}
                                />
                                {!isPending && (
                                    <p className="rd_decisionInfo" style={{ marginTop: 10 }}>
                                        Decision made on <strong>{new Date(application.updatedAt).toLocaleDateString()}</strong>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {!isAdmin && application.adminNotes && (
                        <div className="rd_section rd_feedbackSection">
                            <h3 className="rd_sectionTitle"><Info style={{ marginRight: 6, fontSize: '16px' }} /> Message from Reviewer</h3>
                            <div className="rd_feedbackContent">
                                {application.adminNotes}
                            </div>
                        </div>
                    )}
                </div>

                {isAdmin && isPending && (
                    <div className="recruitment_roleAssignmentCard" style={{ padding: '16px', marginBottom: '16px' }}>
                        <div className="recruitment_roleAssignmentHeader" style={{ marginBottom: '12px', paddingBottom: '8px' }}>
                            <Work style={{ fontSize: '16px' }} />
                            <h3 style={{ fontSize: '13px' }}>Assign Role & Finalize</h3>
                        </div>
                        <div className="recruitment_roleSelector">
                            <label style={{ flexShrink: 0 }}>Select Role to Assign:</label>
                            <select
                                value={assignedRole}
                                onChange={(e) => setAssignedRole(e.target.value)}
                                className="recruitment_roleSelectInput"
                            >
                                <option value="editor">EDITOR</option>
                                <option value="reviewer">REVIEWER</option>
                            </select>
                            {assignedRole !== application.appliedRole && (
                                <p className="recruitment_roleWarning">
                                    ⚠️ Note: Candidate applied for <strong>{application.appliedRole.toUpperCase()}</strong>.
                                    You are about to override this with <strong>{assignedRole.toUpperCase()}</strong>.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {isAdmin && isPending && (
                    <div className="rd_adminSection" style={{ marginBottom: '10px', padding: '16px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="recruitment_adminActions" style={{ margin: 0 }}>
                                <button
                                    className="recruitment_rejectBtn"
                                    disabled={isProcessing}
                                    onClick={() => handleUpdateStatus('REJECTED')}
                                >
                                    <Close fontSize="small" /> Reject
                                </button>
                                <button
                                    className="recruitment_acceptBtn"
                                    disabled={isProcessing}
                                    onClick={() => handleUpdateStatus('ACCEPTED')}
                                >
                                    <Check fontSize="small" /> Accept as {assignedRole.toUpperCase()}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                showCancel={alertConfig.showCancel}
                confirmText={alertConfig.confirmText}
                onConfirm={alertConfig.onConfirm}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default RecruitmentDetailView;
