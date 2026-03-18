import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Visibility,
    AccessTime,
    CheckCircleOutline,
    HighlightOff,
    AddCircleOutline
} from '@mui/icons-material';
import { recruitmentService } from '../../services/recruitment.service';
import authService from '../../services/auth.service';
import { API_BASE_URL } from '../../services/api.config';
import type { RecruitmentSubmissionResponse } from '../../services/recruitment.service';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import './recruitmentDashboard.css';

const UserRecruitmentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<RecruitmentSubmissionResponse[]>([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        fetchApplications();
    }, []);

    useEffect(() => {
        if (applications.length > 0) {
            const acceptedOrRejectedApp = applications.find(app => app.status === 'ACCEPTED' || app.status === 'REJECTED');
            if (acceptedOrRejectedApp) {
                setAlertConfig({
                    isOpen: true,
                    type: 'info',
                    title: 'Application Status Updated',
                    message: `Your application for ${acceptedOrRejectedApp.appliedRole} has been ${acceptedOrRejectedApp.status.toLowerCase()}. Logging you out to update your permissions...`
                });

                // Auto logout after 2 seconds to allow user to read the message
                const timer = setTimeout(async () => {
                    try {
                        await authService.logout();
                        navigate('/login');
                    } catch (error) {
                        console.error('Logout failed', error);
                        // Fallback navigation even if logout API fails
                        navigate('/login');
                    }
                }, 2000);

                return () => clearTimeout(timer);
            }
        }
    }, [applications, navigate]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const data = await recruitmentService.getMyApplications();
            setApplications(data);
        } catch (err: any) {
            console.error('Failed to load applications', err);
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Data Load Error',
                message: err.message || 'Failed to fetch your applications.'
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <AccessTime fontSize="small" />;
            case 'ACCEPTED': return <CheckCircleOutline fontSize="small" />;
            case 'REJECTED': return <HighlightOff fontSize="small" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="recruitment_loadingContainer">
                <div className="recruitment_spinner"></div>
                <p>Loading your applications...</p>
            </div>
        );
    }

    return (
        <div className="recruitment_dashWrapper">
            <div className="recruitment_dashHeader">
                <h1>Recruitment Dashboard</h1>
                <p>Track the status of your applications to join our team</p>
            </div>

            {applications.length === 0 ? (
                <div className="recruitment_noApps">
                    <div className="recruitment_errorIcon">📄</div>
                    <h2>No Applications Found</h2>
                    <p>You haven't submitted any recruitment applications yet.</p>
                    <button
                        className="recruitment_applyNowBtn"
                        onClick={() => navigate('/recruitment')}
                    >
                        Apply Now
                    </button>
                </div>
            ) : (
                <div className="recruitment_cardContainer">
                    {applications.map(app => (
                        <div key={app.id} className="recruitment_appCard">
                            <div className="recruitment_cardHeader">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {app.personalImage ? (
                                        <img
                                            src={app.personalImage.startsWith('http') ? app.personalImage : `${API_BASE_URL}${app.personalImage.startsWith('/') ? '' : '/'}${app.personalImage}`}
                                            alt={app.appliedRole}
                                            style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                                        />
                                    ) : (
                                        <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b', fontSize: '12px' }}>
                                            {app.appliedRole[0].toUpperCase()}
                                        </div>
                                    )}
                                    <span className="recruitment_cardRole">{app.appliedRole}</span>
                                </div>
                                <span className={`recruitment_statusBadge ${app.status.toLowerCase()}`}>
                                    {getStatusIcon(app.status)} {app.status}
                                </span>
                            </div>

                            <div className="recruitment_cardBody">
                                <div className="recruitment_infoRow">
                                    <span className="recruitment_infoLabel">Date Submitted:</span>
                                    <span className="recruitment_infoValue">
                                        {new Date(app.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="recruitment_infoRow">
                                    <span className="recruitment_infoLabel">Application ID:</span>
                                    <span className="recruitment_infoValue">{app.applicationId || `REC-${app.id}`}</span>
                                </div>

                                {/* Show admin notes only if rejected or if there are notes */}
                                {(app as any).adminNotes && (
                                    <div className="recruitment_adminNotes">
                                        <strong>Message from Reviewer:</strong>
                                        {(app as any).adminNotes}
                                    </div>
                                )}
                            </div>

                            <button
                                className="recruitment_viewDetailsBtn"
                                onClick={() => navigate(`/recruitment/id/${app.id}`)}
                            >
                                <Visibility style={{ fontSize: '16px' }} /> View Full Application
                            </button>
                        </div>
                    ))}

                    {/* Allow new application if all existing are REJECTED */}
                    {applications.every(app => app.status === 'REJECTED') && (
                        <div
                            className="recruitment_appCard"
                            style={{ borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            onClick={() => navigate('/recruitment')}
                        >
                            <div style={{ textAlign: 'center', color: '#64748b' }}>
                                <AddCircleOutline style={{ fontSize: '24px', marginBottom: '8px' }} />
                                <p style={{ fontWeight: 600, fontSize: '14px' }}>Apply for Another Role</p>
                            </div>
                        </div>
                    )}
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

export default UserRecruitmentDashboard;
