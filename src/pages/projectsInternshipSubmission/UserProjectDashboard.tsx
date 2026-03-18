import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Assignment,
    CalendarToday,
    CheckCircle,
    Error as ErrorIcon,
    HourglassEmpty,
    Visibility,
    Search,
    Refresh
} from '@mui/icons-material';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import { projectInternshipService, type ProjectInternshipResponse } from '../../services/projectInternship.service';
import "./projectDashboard.css"; // Reusing the same CSS for consistency

const UserProjectDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<ProjectInternshipResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
    }>({ isOpen: false, type: 'info', title: '', message: '' });

    useEffect(() => {
        fetchApplications();

        const interval = setInterval(() => {
            fetchApplications(true);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchApplications = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const data = await projectInternshipService.getMySubmissions();
            setApplications(data);
        } catch (error: any) {
            console.error('Error fetching applications:', error);
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to load applications'
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return '#10b981';
            case 'REJECTED': return '#ef4444';
            default: return '#f59e0b';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return <CheckCircle style={{ fontSize: '14px' }} />;
            case 'REJECTED': return <ErrorIcon style={{ fontSize: '14px' }} />;
            default: return <HourglassEmpty style={{ fontSize: '14px' }} />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'WEB': return 'Web Development';
            case 'MOBILE': return 'Mobile App';
            case 'INTERNSHIP': return 'Internship';
            default: return type;
        }
    };

    const filteredApplications = applications.filter(app =>
        app.applicationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.submissionType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDashboardTitle = () => {
        if (applications.length === 0) return 'My Project & Internship Applications';

        const hasProjects = applications.some(app => app.submissionType === 'WEB' || app.submissionType === 'MOBILE');
        const hasInternships = applications.some(app => app.submissionType === 'INTERNSHIP');

        if (hasProjects && hasInternships) return 'My Project & Internship Applications';
        if (hasProjects) return 'My Project Applications';
        if (hasInternships) return 'My Internship Applications';

        return 'My Project & Internship Applications';
    };

    return (
        <div className="user_rd_wrapper">
            <div className="user_rd_container">
                {/* Header */}
                <div className="user_rd_header">
                    <div>
                        <h1>{getDashboardTitle()}</h1>
                        <p>Track the status of your submitted requests</p>
                    </div>
                    <button
                        className="user_rd_refreshBtn"
                        onClick={() => fetchApplications()}
                        title="Refresh Data"
                        disabled={loading}
                    >
                        <Refresh className={loading ? 'spin-animation' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Controls */}
                <div className="user_rd_controls">
                    <div className="user_rd_searchBox">
                        <Search className="user_rd_searchIcon" />
                        <input
                            type="text"
                            placeholder="Search by ID or Type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Could add a button to apply for new project here if needed */}
                </div>

                {/* Applications List */}
                <div className="user_rd_listContainer">
                    {loading ? (
                        <div className="user_rd_loading">
                            <div className="user_rd_spinner"></div>
                            <p>Loading your applications...</p>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="user_rd_emptyState">
                            <Assignment style={{ fontSize: '32px', color: '#cbd5e1', margin: '0 0 8px 0' }} />
                            <h3>No Applications Found</h3>
                            <p>You haven't submitted any project or internship requests yet.</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <button className="user_rd_applyBtn" onClick={() => navigate('/forms/projects-internships/web-development')}>Start Web Project</button>
                                <button className="user_rd_applyBtn" onClick={() => navigate('/forms/projects-internships/mobile-development')}>Start Mobile App</button>
                                <button className="user_rd_applyBtn" onClick={() => navigate('/forms/projects-internships/student-internship')}>Apply for Internship</button>
                            </div>
                        </div>
                    ) : (
                        <div className="user_rd_grid">
                            {filteredApplications.map((app) => (
                                <div key={app.id} className="user_rd_card">
                                    <div className="user_rd_cardHeader">
                                        <div className="user_rd_roleTag">
                                            {getTypeLabel(app.submissionType)}
                                        </div>
                                        <div
                                            className="user_rd_statusBadge"
                                            style={{
                                                backgroundColor: `${getStatusColor(app.status)}15`,
                                                color: getStatusColor(app.status)
                                            }}
                                        >
                                            {getStatusIcon(app.status)}
                                            <span>{app.status}</span>
                                        </div>
                                    </div>

                                    <div className="user_rd_cardBody">
                                        <div className="user_rd_infoRow">
                                            <span className="user_rd_label">Application ID</span>
                                            <span className="user_rd_value" style={{ fontFamily: 'monospace' }}>
                                                {app.applicationId || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="user_rd_infoRow">
                                            <span className="user_rd_label">Submitted On</span>
                                            <span className="user_rd_value">
                                                <CalendarToday style={{ fontSize: '12px', marginRight: 4 }} />
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="user_rd_cardFooter">
                                        <button
                                            className="user_rd_viewBtn"
                                            onClick={() => navigate(`/dashboard/user/projects-internships/view/${app.id}`)}
                                        >
                                            <Visibility style={{ fontSize: '16px' }} />
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
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

export default UserProjectDashboard;
