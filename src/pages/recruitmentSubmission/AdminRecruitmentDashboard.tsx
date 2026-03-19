import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    AssignmentInd,
    Email,
    Visibility,
    FilterList
} from '@mui/icons-material';
import { recruitmentService } from '../../services/recruitment.service';
import { API_BASE_URL } from '../../services/api.config';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import './recruitmentDashboard.css';

const AdminRecruitmentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('new');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
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
        if (alertConfig.isOpen) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [alertConfig.isOpen]);

    useEffect(() => {
        fetchApplications();
    }, [roleFilter]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            // Fetch ALL applications for the current role filter (if any), 
            // so we can calculate counts for all tabs client-side.
            const data = await recruitmentService.getAllApplications(undefined, roleFilter);
            setApplications(data);
        } catch (err: any) {
            console.error('Failed to load applications', err);
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Data Load Error',
                message: err.message || 'Failed to fetch applications. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate counts
    const counts = {
        new: applications.filter(app => app.status === 'PENDING').length,
        accepted: applications.filter(app => app.status === 'ACCEPTED').length,
        rejected: applications.filter(app => app.status === 'REJECTED').length,
        all: applications.length
    };

    // Filter applications based on active tab AND search term
    const getTabFilteredApps = () => {
        let apps = applications;

        // If searching, skip current activeTab status filter to show results across categories
        if (searchTerm.trim() !== '') {
            if (statusFilter) {
                apps = apps.filter(app => app.status === statusFilter);
            }
            return apps;
        }

        // Tab filtering (only if NOT searching)
        if (statusFilter) {
            apps = apps.filter(app => app.status === statusFilter);
        } else if (activeTab === 'new') {
            apps = apps.filter(app => app.status === 'PENDING');
        } else if (activeTab === 'accepted') {
            apps = apps.filter(app => app.status === 'ACCEPTED');
        } else if (activeTab === 'rejected') {
            apps = apps.filter(app => app.status === 'REJECTED');
        }
        // 'all' tab doesn't filter by status

        return apps;
    };

    const filteredApps = getTabFilteredApps().filter(app => {
        const fullSearch = searchTerm.toLowerCase();
        const appId = app.applicationId ? app.applicationId.toLowerCase() : `rec-${app.id}`;

        return (
            app.firstName.toLowerCase().includes(fullSearch) ||
            app.lastName.toLowerCase().includes(fullSearch) ||
            app.email.toLowerCase().includes(fullSearch) ||
            app.instituteName.toLowerCase().includes(fullSearch) ||
            appId.includes(fullSearch)
        );
    });

    const tabs = [
        { id: 'new', label: 'New', count: counts.new },
        { id: 'accepted', label: 'Accepted', count: counts.accepted },
        { id: 'rejected', label: 'Rejected', count: counts.rejected },
        { id: 'all', label: 'All', count: counts.all }
    ];

    return (
        <div className="recruitment_dashWrapper">
            <div className="recruitment_dashHeader">
                <h1>Review Recruitment Applications</h1>
                <p>Manage and process new applicants for Editor and Reviewer roles</p>
            </div>

            {/* Tabs Section */}
            <div className="recruitment_tabsContainer" style={{
                display: 'flex',
                gap: '16px',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '16px',
                paddingBottom: '0px'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                            padding: '8px 4px',
                            cursor: 'pointer',
                            color: activeTab === tab.id ? '#2563eb' : '#64748b',
                            fontWeight: activeTab === tab.id ? 600 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                        <span style={{
                            background: activeTab === tab.id ? '#dbeafe' : '#f1f5f9',
                            color: activeTab === tab.id ? '#2563eb' : '#64748b',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 600
                        }}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            <div className="recruitment_adminFilters">
                <div className="recruitment_searchGroup">
                    <Search className="recruitment_searchIcon" />
                    <input
                        type="text"
                        className="recruitment_searchInput"
                        placeholder="Search by Applicant, ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="recruitment_filterGroup">
                    <FilterList className="recruitment_filterIcon" />
                    <select
                        className="recruitment_filterSelect"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="editor">Editor</option>
                        <option value="reviewer">Reviewer</option>
                    </select>
                </div>

                <div className="recruitment_filterGroup">
                    <FilterList className="recruitment_filterIcon" />
                    <select
                        className="recruitment_filterSelect"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="recruitment_loadingContainer">
                    <div className="recruitment_spinner"></div>
                    <p>Fetching applications...</p>
                </div>
            ) : filteredApps.length === 0 ? (
                <div className="recruitment_noApps">
                    <div className="recruitment_errorIcon">🔍</div>
                    <h2>No Matching Applications</h2>
                    <p>We couldn't find any applications matching your current filters.</p>
                </div>
            ) : (
                <div className="recruitment_cardContainer">
                    {filteredApps.map(app => (
                        <div key={app.id} className="recruitment_appCard">
                            <div className="recruitment_cardHeader">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {app.personalImage ? (
                                        <img
                                            src={app.personalImage.startsWith('http') || app.personalImage.startsWith('data:') ? app.personalImage : `${API_BASE_URL}${app.personalImage.startsWith('/') ? '' : '/'}${app.personalImage}`}
                                            alt={app.firstName}
                                            style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                                        />
                                    ) : (
                                        <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b', fontSize: '12px' }}>
                                            {app.firstName[0]}{app.lastName[0]}
                                        </div>
                                    )}
                                    <span className="recruitment_cardRole">{app.appliedRole}</span>
                                </div>
                                <span className={`recruitment_statusBadge ${app.status.toLowerCase()}`}>
                                    {app.status}
                                </span>
                            </div>

                            <div className="recruitment_cardBody">
                                <div style={{ marginBottom: '10px' }}>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e293b' }}>
                                        {app.firstName} {app.lastName}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '12px' }}>
                                        <Email style={{ fontSize: '14px' }} /> {app.email}
                                    </div>
                                </div>

                                <div className="recruitment_infoRow">
                                    <span className="recruitment_infoLabel">Institute:</span>
                                    <span className="recruitment_infoValue" style={{ maxWidth: '200px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {app.instituteName}
                                    </span>
                                </div>
                                <div className="recruitment_infoRow">
                                    <span className="recruitment_infoLabel">Submitted:</span>
                                    <span className="recruitment_infoValue">
                                        {new Date(app.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="recruitment_infoRow">
                                    <span className="recruitment_infoLabel">Current User Role:</span>
                                    <span className="recruitment_infoValue" style={{ textTransform: 'capitalize' }}>
                                        {app.applicant?.role || 'user'}
                                    </span>
                                </div>
                                <div className="recruitment_infoRow">
                                    <span className="recruitment_infoLabel">Application ID:</span>
                                    <span className="recruitment_infoValue">{app.applicationId || `REC-${app.id}`}</span>
                                </div>
                            </div>

                            <button
                                className="recruitment_viewDetailsBtn"
                                onClick={() => navigate(`/recruitment/id/${app.id}`)}
                            >
                                {app.status === 'PENDING' ? (
                                    <>
                                        <AssignmentInd style={{ fontSize: '16px' }} /> Review & Decide
                                    </>
                                ) : (
                                    <>
                                        <Visibility style={{ fontSize: '16px' }} /> View Details
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
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

export default AdminRecruitmentDashboard;
