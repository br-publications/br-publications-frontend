import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Assignment,
    CalendarToday,
    CheckCircle,
    Error as ErrorIcon,
    HourglassEmpty,
    Visibility,
    FilterList,
    Search,
    Refresh
} from '@mui/icons-material';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';

import { projectInternshipService, type ProjectInternshipResponse } from '../../services/projectInternship.service';
import './projectDashboard.css';

const AdminProjectDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<ProjectInternshipResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
    }>({ isOpen: false, type: 'info', title: '', message: '' });

    useEffect(() => {
        if (alertConfig.isOpen) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [alertConfig.isOpen]);

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
            const data = await projectInternshipService.getAllSubmissions();
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

    const filteredApplications = applications.filter(app => {
        const matchesSearch =
            (app.applicationId?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            (app.applicant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            (app.applicant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

        const matchesStatus = filterStatus === 'ALL' || app.status === filterStatus;
        const matchesType = filterType === 'ALL' || app.submissionType === filterType;

        return matchesSearch && matchesStatus && matchesType;
    });

    return (
        <div className="admin_rd_wrapper">
            <div className="admin_rd_container">
                {/* Header */}
                <div className="admin_rd_header">
                    <div>
                        <h1>Project & Internship Requests</h1>
                        <p>Manage and review incoming project and internship applications</p>
                    </div>
                    <button
                        className="admin_rd_refreshBtn"
                        onClick={() => fetchApplications()}
                        title="Refresh Data"
                        disabled={loading}
                    >
                        <Refresh className={loading ? 'spin-animation' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Controls */}
                <div className="admin_rd_controls">
                    <div className="admin_rd_searchBox">
                        <Search className="admin_rd_searchIcon" />
                        <input
                            type="text"
                            placeholder="Search by Applicant, ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="admin_rd_filters">
                        <div className="admin_rd_filterGroup">
                            <FilterList fontSize="small" />
                            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="ALL">All Types</option>
                                <option value="WEB">Web Development</option>
                                <option value="MOBILE">Mobile App</option>
                                <option value="INTERNSHIP">Internship</option>
                            </select>
                        </div>
                        <div className="admin_rd_filterGroup">
                            <FilterList fontSize="small" />
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="ALL">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="ACCEPTED">Accepted</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats cards could go here */}

                {/* Applications List */}
                <div className="admin_rd_listContainer">
                    {loading ? (
                        <div className="admin_rd_loading">
                            <div className="admin_rd_spinner"></div>
                            <p>Loading applications...</p>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="admin_rd_emptyState">
                            <Assignment style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: 8 }} />
                            <h3>No Applications Found</h3>
                            <p>Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        <div className="admin_rd_grid">
                            {filteredApplications.map((app) => (
                                <div key={app.id} className="admin_rd_card">
                                    <div className="admin_rd_cardHeader">
                                        <div className="admin_rd_roleTag">
                                            {getTypeLabel(app.submissionType)}
                                        </div>
                                        <div
                                            className="admin_rd_statusBadge"
                                            style={{
                                                backgroundColor: `${getStatusColor(app.status)}15`,
                                                color: getStatusColor(app.status)
                                            }}
                                        >
                                            {getStatusIcon(app.status)}
                                            <span>{app.status}</span>
                                        </div>
                                    </div>

                                    <div className="admin_rd_cardBody">
                                        <div className="admin_rd_applicantInfo">
                                            <div className="admin_rd_avatarPlaceholder">
                                                {app.applicant?.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4>{app.applicant?.fullName}</h4>
                                                <span>{app.applicant?.email}</span>
                                            </div>
                                        </div>

                                        <div className="admin_rd_divider"></div>

                                        <div className="admin_rd_infoRow">
                                            <span className="admin_rd_label">Application ID</span>
                                            <span className="admin_rd_value" style={{ fontFamily: 'monospace' }}>
                                                {app.applicationId || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="admin_rd_infoRow">
                                            <span className="admin_rd_label">Submitted On</span>
                                            <span className="admin_rd_value">
                                                <CalendarToday style={{ fontSize: '12px', marginRight: 4 }} />
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="admin_rd_cardFooter">
                                        <button
                                            className="admin_rd_viewBtn"
                                            onClick={() => navigate(`/dashboard/admin/projects-internships/view/${app.id}`)}
                                        >
                                            <Visibility style={{ fontSize: '16px' }} />
                                            Review Application
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

export default AdminProjectDashboard;
