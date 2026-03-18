import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import statsService, { type StatsOverview, type MonthlyReportData, type ExtendedStatsData, type EngagementStatsData } from '../../../services/stats.service';
import './statsDashboard.css';

// ─── Status colour palette ────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
    SUBMITTED: '#3b82f6',
    UNDER_REVIEW: '#f59e0b',
    EDITORIAL_REVIEW: '#8b5cf6',
    APPROVED: '#10b981',
    ISBN_APPLIED: '#0891b2',
    PUBLICATION_IN_PROGRESS: '#f97316',
    PUBLISHED: '#059669',
    REJECTED: '#ef4444',
    WITHDRAWN: '#6b7280',
    PENDING: '#f59e0b',
    ACKNOWLEDGED: '#10b981',
    ACCEPTED: '#10b981',
    DECLINED: '#ef4444',
    COMPLETED: '#059669',
    WEB: '#3b82f6',
    MOBILE: '#8b5cf6',
    INTERNSHIP: '#f59e0b',
    CHAPTER: '#2563eb',
    TEXTBOOK: '#059669',
    editor: '#2563eb',
    reviewer: '#8b5cf6',
};

const getColor = (key: string, idx: number) =>
    STATUS_COLORS[key] ?? ['#2563eb', '#059669', '#f59e0b', '#8b5cf6', '#f97316', '#ec4899'][idx % 6];

// ─── Helpers ──────────────────────────────────────────────
const toBarData = (obj: Record<string, number>) =>
    Object.entries(obj)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }));

const StatusBadge: React.FC<{ status: string; count: number }> = ({ status, count }) => {
    const color = STATUS_COLORS[status] ?? '#6b7280';
    return (
        <span className="stats-status-badge" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
            <span className="stats-status-dot" style={{ background: color }} />
            <span style={{ color }}>{status}</span>
            <strong style={{ color, marginLeft: 3 }}>{count}</strong>
        </span>
    );
};

const BreakdownTable: React.FC<{ data: Record<string, number> }> = ({ data }) => {
    const entries = Object.entries(data).filter(([, v]) => v > 0);
    if (!entries.length) return <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>No data this period</p>;
    return (
        <table className="stats-breakdown-table">
            <tbody>
                {entries.map(([k, v]) => (
                    <tr key={k}>
                        <td><StatusBadge status={k} count={v} /></td>
                        <td className="stats-breakdown-count">{v}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#111827' }}>{label}</p>
            {payload.map((p: any) => (
                <p key={p.dataKey} style={{ margin: '2px 0 0', color: p.fill }}>
                    {p.dataKey}: <strong>{p.value}</strong>
                </p>
            ))}
        </div>
    );
};

// ─── Current month helper ─────────────────────────────────
const currentMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const last6Months = () => {
    const result = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
        result.push({ key, label });
    }
    return result;
};

// ═════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════
const AdminStatsDashboard: React.FC = () => {
    const [overview, setOverview] = useState<StatsOverview | null>(null);
    const [report, setReport] = useState<MonthlyReportData | null>(null);
    const [extended, setExtended] = useState<ExtendedStatsData | null>(null);
    const [engagement, setEngagement] = useState<EngagementStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
    const [alert, setAlert] = useState<{ isOpen: boolean; type: AlertType; title: string; message: string }>({
        isOpen: false, type: 'info', title: '', message: '',
    });

    const months = last6Months();

    const showAlert = (type: AlertType, title: string, message: string) =>
        setAlert({ isOpen: true, type, title, message });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [ov, rp, ext, eng] = await Promise.all([
                statsService.getOverview(),
                statsService.getMonthlyReport(selectedMonth),
                statsService.getExtendedStats(),
                statsService.getEngagementStats()
            ]);
            setOverview(ov);
            setReport(rp);
            setExtended(ext);
            setEngagement(eng);
        } catch (e: any) {
            showAlert('error', 'Error', e.message || 'Failed to load stats');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => { load(); }, [load]);

    const handleSendEmail = async () => {
        setSending(true);
        try {
            await statsService.sendEmailReportNow();
            showAlert('success', 'Success', 'Monthly report email sent to all admins!');
        } catch (e: any) {
            showAlert('error', 'Error', e.message || 'Failed to send email report');
        } finally {
            setSending(false);
        }
    };

    // ── KPI config ────────────────────────────────────────
    const kpiCards = overview ? [
        { label: 'Book Chapter Submissions', value: overview.bookChapterSubmissions, icon: '📘', color: '#2563eb' },
        { label: 'Textbook Submissions', value: overview.textBookSubmissions, icon: '📗', color: '#059669' },
        { label: 'Published Books', value: overview.publishedBooks, icon: '📚', color: '#f59e0b' },
        { label: 'Published Chapters', value: overview.publishedBookChapters, icon: '📖', color: '#f97316' },
        { label: 'Recruitment Apps', value: overview.recruitmentApplications, icon: '👥', color: '#8b5cf6' },
        { label: 'Projects / Internships', value: overview.projectsInternships, icon: '💼', color: '#0891b2' },
        { label: 'Pending Inquiries', value: overview.pendingContactInquiries, icon: '📩', color: '#ec4899' },
        { label: 'Pending Reviews', value: overview.pendingReviews, icon: '🔍', color: '#ca8a04' },
        { label: 'Total Users', value: overview.totalUsers, icon: '👤', color: '#4b5563' },
    ] : [];

    // ── Chart data ────────────────────────────────────────
    const bcsChartData = report ? toBarData(report.data.bookChapterSubmissions.byStatus) : [];
    const tbChartData = report ? toBarData(report.data.textBookSubmissions.byStatus) : [];
    const pubPieData = report ? [
        { name: 'Books', value: report.data.publications.newBooks },
        { name: 'Chapters', value: report.data.publications.newChapters },
    ].filter(d => d.value > 0) : [];

    // Phase 2 Chart Data
    const rolePieData = extended ? toBarData(extended.userRoles).map(d => ({ ...d, name: d.name === 'developer' ? 'Default User' : d.name })) : [];
    const revActivityBarData = extended ? toBarData(extended.reviewerActivity) : [];
    const userGrowthData = extended ? extended.userGrowth.map(m => {
        const d = new Date(m.month);
        return { name: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), Users: m.count };
    }) : [];

    // Phase 3 Chart Data
    const geoData = engagement?.geographicDistribution.map(g => ({ name: g.country, Users: g.count })) || [];
    const trendsData = engagement?.publishingTrends.map(t => {
        const d = new Date(t.month);
        return {
            name: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
            Books: t.books,
            Chapters: t.chapters
        };
    }) || [];

    const formatTimeAgo = (ts: string) => {
        const diff = Math.floor((new Date().getTime() - new Date(ts).getTime()) / 60000);
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return `${Math.floor(diff / 1440)}d ago`;
    };

    return (
        <div className="stats-dashboard">
            <AlertPopup {...alert} onClose={() => setAlert(a => ({ ...a, isOpen: false }))} />

            {/* ─── Header ─── */}
            <div className="stats-header">
                <div className="stats-header-left">
                    <h1>📊 Analytics & Reports</h1>
                    <p>{report?.period.label ?? 'Loading...'} · All platform activity</p>
                </div>
                <div className="stats-header-actions">
                    <select
                        className="stats-period-select"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                    >
                        {months.map(m => (
                            <option key={m.key} value={m.key}>{m.label}</option>
                        ))}
                    </select>
                    <button className="stats-btn stats-btn-outline" onClick={load} disabled={loading}>
                        {loading ? '⟳' : '↺'} Refresh
                    </button>
                    <button className="stats-btn stats-btn-success" onClick={handleSendEmail} disabled={sending}>
                        {sending ? 'Sending...' : '✉ Send Email Report'}
                    </button>
                </div>
            </div>

            {/* ─── Loading ─── */}
            {loading && (
                <div className="stats-loading">
                    <div className="stats-spinner" />
                    Loading analytics data…
                </div>
            )}

            {!loading && overview && report && (
                <>
                    {/* ─── NEW USERS BANNER ─── */}
                    <div style={{
                        background: 'linear-gradient(135deg,#0f172a,#1e3a6e)',
                        borderRadius: 8, padding: '8px 14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 8,
                    }}>
                        <span style={{ fontSize: 12, color: '#bfdbfe', fontWeight: 600 }}>
                            👤 New Users Registered this period
                        </span>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                            {report.data.newUsers}
                        </span>
                    </div>

                    {/* ─── KPI CARDS ─── */}
                    <div className="stats-kpi-grid">
                        {kpiCards.map(card => (
                            <div key={card.label} className="stats-kpi-card" style={{ '--kpi-color': card.color } as any}>
                                <span className="stats-kpi-icon">{card.icon}</span>
                                <span className="stats-kpi-value">{card.value.toLocaleString()}</span>
                                <span className="stats-kpi-label">{card.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* ─── PIPELINE CHARTS ─── */}
                    <div className="stats-charts-grid">

                        {/* Book Chapter Submission Pipeline */}
                        <div className="stats-chart-card">
                            <div className="stats-chart-header">
                                <span className="stats-chart-title">📘 Book Chapter Pipeline</span>
                                <span className="stats-chart-subtitle">Total: {report.data.bookChapterSubmissions.total}</span>
                            </div>
                            <div className="stats-chart-body">
                                {bcsChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={160}>
                                        <BarChart data={bcsChartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} tickLine={false} axisLine={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                {bcsChartData.map((entry, idx) => (
                                                    <Cell key={entry.name} fill={getColor(entry.name, idx)} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>No submissions this period</p>}
                            </div>
                        </div>

                        {/* Textbook Submission Pipeline */}
                        <div className="stats-chart-card">
                            <div className="stats-chart-header">
                                <span className="stats-chart-title">📗 Textbook Pipeline</span>
                                <span className="stats-chart-subtitle">Total: {report.data.textBookSubmissions.total}</span>
                            </div>
                            <div className="stats-chart-body">
                                {tbChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={160}>
                                        <BarChart data={tbChartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} tickLine={false} axisLine={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                {tbChartData.map((entry, idx) => (
                                                    <Cell key={entry.name} fill={getColor(entry.name, idx)} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>No submissions this period</p>}
                            </div>
                        </div>

                        {/* Publications Pie */}
                        <div className="stats-chart-card">
                            <div className="stats-chart-header">
                                <span className="stats-chart-title">📚 Publications</span>
                                <span className="stats-chart-subtitle">
                                    {report.data.publications.newBooks + report.data.publications.newChapters} new this period
                                </span>
                            </div>
                            <div className="stats-chart-body" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {pubPieData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="60%" height={140}>
                                            <PieChart>
                                                <Pie data={pubPieData} cx="50%" cy="50%" outerRadius={56} innerRadius={32} dataKey="value" paddingAngle={3}>
                                                    {pubPieData.map((entry, idx) => (
                                                        <Cell key={entry.name} fill={getColor(entry.name.toUpperCase(), idx)} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v) => [v, '']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ flex: 1 }}>
                                            {pubPieData.map((entry, idx) => (
                                                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: getColor(entry.name.toUpperCase(), idx), flexShrink: 0 }} />
                                                    <span style={{ fontSize: 10, color: '#374151' }}>{entry.name}</span>
                                                    <strong style={{ marginLeft: 'auto', fontSize: 12 }}>{entry.value}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>No new publications this period</p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* ─── SUMMARY CARDS ─── */}
                    <div className="stats-summary-grid">

                        {/* Recruitment */}
                        <div className="stats-summary-card">
                            <div className="stats-summary-header" style={{ background: 'linear-gradient(135deg,#6d28d9,#8b5cf6)' }}>
                                <span className="stats-summary-title">👥 Recruitment</span>
                                <span className="stats-summary-total">{report.data.recruitment.total}</span>
                            </div>
                            <div className="stats-summary-body">
                                <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>By Status</p>
                                <BreakdownTable data={report.data.recruitment.byStatus} />
                                <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '8px 0 4px' }}>By Role</p>
                                <BreakdownTable data={report.data.recruitment.byRole} />
                            </div>
                        </div>

                        {/* Projects */}
                        <div className="stats-summary-card">
                            <div className="stats-summary-header" style={{ background: 'linear-gradient(135deg,#c2410c,#f97316)' }}>
                                <span className="stats-summary-title">💼 Projects & Internships</span>
                                <span className="stats-summary-total">{report.data.projects.total}</span>
                            </div>
                            <div className="stats-summary-body">
                                <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>By Type</p>
                                <BreakdownTable data={report.data.projects.byType} />
                                <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '8px 0 4px' }}>By Status</p>
                                <BreakdownTable data={report.data.projects.byStatus} />
                            </div>
                        </div>

                        {/* Contact Inquiries */}
                        <div className="stats-summary-card">
                            <div className="stats-summary-header" style={{ background: 'linear-gradient(135deg,#9d174d,#ec4899)' }}>
                                <span className="stats-summary-title">📩 Contact Inquiries</span>
                                <span className="stats-summary-total">{report.data.contactInquiries.total}</span>
                            </div>
                            <div className="stats-summary-body">
                                <BreakdownTable data={report.data.contactInquiries.byStatus} />
                                {report.data.contactInquiries.total > 0 && (
                                    <div className="stats-mini-stat-row" style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #f1f5f9', borderBottom: 'none' }}>
                                        <span className="stats-mini-stat-key">Response rate</span>
                                        <span className="stats-mini-stat-val" style={{ color: '#059669' }}>
                                            {Math.round(((report.data.contactInquiries.byStatus['ACKNOWLEDGED'] ?? 0) / report.data.contactInquiries.total) * 100)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* ─── PHASE 2: EXTENDED STATS (USER GROWTH & DEMOGRAPHICS) ─── */}
                    {extended && (
                        <>
                            <h2 style={{ fontSize: 16, margin: '24px 0 12px', color: '#111827', fontWeight: 700 }}>
                                User Demographics & Growth
                            </h2>
                            <div className="stats-charts-grid">

                                {/* User Growth Line Chart 
                                <div className="stats-chart-card">
                                    <div className="stats-chart-header">
                                        <span className="stats-chart-title">📈 New User Registration (6 Months)</span>
                                    </div>
                                    <div className="stats-chart-body">
                                        {userGrowthData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={160}>
                                                <LineChart data={userGrowthData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 10 }} width={30} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Line type="monotone" dataKey="Users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>No growth data available</p>}
                                    </div>
                                </div> */}

                                {/* User Roles Pie Chart */}
                                <div className="stats-chart-card">
                                    <div className="stats-chart-header">
                                        <span className="stats-chart-title">🎭 User Roles Distribution</span>
                                    </div>
                                    <div className="stats-chart-body" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {rolePieData.length > 0 ? (
                                            <>
                                                <ResponsiveContainer width="60%" height={140}>
                                                    <PieChart>
                                                        <Pie data={rolePieData} cx="50%" cy="50%" outerRadius={56} innerRadius={32} dataKey="value" paddingAngle={2}>
                                                            {rolePieData.map((entry, idx) => (
                                                                <Cell key={entry.name} fill={getColor(entry.name.toUpperCase(), idx)} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip formatter={(v) => [v, '']} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div style={{ flex: 1 }}>
                                                    {rolePieData.map((entry, idx) => (
                                                        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                                            <span style={{ width: 8, height: 8, borderRadius: 2, background: getColor(entry.name.toUpperCase(), idx), flexShrink: 0 }} />
                                                            <span style={{ fontSize: 10, color: '#374151' }}>{entry.name}</span>
                                                            <strong style={{ marginLeft: 'auto', fontSize: 12 }}>{entry.value}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>No role data available</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <h2 style={{ fontSize: 16, margin: '24px 0 12px', color: '#111827', fontWeight: 700 }}>
                                Editor & Reviewer Workload
                            </h2>
                            <div className="stats-charts-grid">

                                {/* Reviewer Activity Bar Chart */}
                                <div className="stats-chart-card">
                                    <div className="stats-chart-header">
                                        <span className="stats-chart-title">🔍 Reviewer Assignment Statuses</span>
                                    </div>
                                    <div className="stats-chart-body">
                                        {revActivityBarData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={160}>
                                                <BarChart data={revActivityBarData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={0} />
                                                    <YAxis tick={{ fontSize: 10 }} width={30} tickLine={false} axisLine={false} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                        {revActivityBarData.map((entry, idx) => (
                                                            <Cell key={entry.name} fill={getColor(entry.name, idx)} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>No reviewer activity</p>}
                                    </div>
                                </div>

                                {/* Top Editors Table */}
                                <div className="stats-chart-card" style={{ gridColumn: 'span 2' }}>
                                    <div style={{ display: 'flex', gap: 20 }}>
                                        <div style={{ flex: 1 }}>
                                            <div className="stats-chart-header">
                                                <span className="stats-chart-title">🏆 Top 5 Editors (Active Submissions)</span>
                                            </div>
                                            <div className="stats-chart-body" style={{ padding: '0 0 12px' }}>
                                                {extended.editorWorkload.length > 0 ? (
                                                    <table className="stats-breakdown-table" style={{ width: '100%' }}>
                                                        <tbody>
                                                            {extended.editorWorkload.map((editor, idx) => (
                                                                <tr key={editor.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                    <td style={{ padding: '4px 0', fontSize: 12 }}>{idx + 1}. <strong style={{ color: '#111827' }}>{editor.name}</strong></td>
                                                                    <td style={{ padding: '4px 0', fontSize: 10, color: '#6b7280' }}>{editor.email}</td>
                                                                    <td className="stats-breakdown-count" style={{ padding: '4px 0', fontSize: 14, fontWeight: 700, color: '#2563eb' }}>{editor.count}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : <p style={{ fontSize: 10, color: '#9ca3af', margin: '12px 0 0' }}>No active editors.</p>}
                                            </div>
                                        </div>

                                        <div style={{ width: '1px', background: '#f1f5f9' }} />

                                        <div style={{ flex: 1 }}>
                                            <div className="stats-chart-header">
                                                <span className="stats-chart-title">⭐ Top 5 Reviewers (Completed Assignments)</span>
                                            </div>
                                            <div className="stats-chart-body" style={{ padding: '0 0 12px' }}>
                                                {extended.topReviewers.length > 0 ? (
                                                    <table className="stats-breakdown-table" style={{ width: '100%' }}>
                                                        <tbody>
                                                            {extended.topReviewers.map((rev, idx) => (
                                                                <tr key={rev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                    <td style={{ padding: '4px 0', fontSize: 12 }}>{idx + 1}. <strong style={{ color: '#111827' }}>{rev.name}</strong></td>
                                                                    <td style={{ padding: '4px 0', fontSize: 10, color: '#6b7280' }}>{rev.email}</td>
                                                                    <td className="stats-breakdown-count" style={{ padding: '4px 0', fontSize: 14, fontWeight: 700, color: '#059669' }}>{rev.count}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : <p style={{ fontSize: 10, color: '#9ca3af', margin: '12px 0 0' }}>No completed reviews yet.</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ─── PHASE 3: ENGAGEMENT & GEOGRAPHY ─── */}
                    {engagement && (
                        <>
                            <h2 style={{ fontSize: 16, margin: '24px 0 12px', color: '#111827', fontWeight: 700 }}>
                                App Engagement & Origins
                            </h2>
                            <div className="stats-charts-grid">

                                {/* Geographic Distribution Bar Chart 
                                <div className="stats-chart-card">
                                    <div className="stats-chart-header">
                                        <span className="stats-chart-title">🌍 Demographics by Country</span>
                                    </div>
                                    <div className="stats-chart-body">
                                        {geoData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={160}>
                                                <BarChart data={geoData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={40} />
                                                    <YAxis tick={{ fontSize: 10 }} width={30} tickLine={false} axisLine={false} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Bar dataKey="Users" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>No geographic data</p>}
                                    </div>
                                </div> */}

                                {/* Publishing Trends Stacked Area Chart 
                                <div className="stats-chart-card">
                                    <div className="stats-chart-header">
                                        <span className="stats-chart-title">🗓️ 12-Month Publishing Trends</span>
                                        <span className="stats-chart-subtitle">Books vs Chapters</span>
                                    </div>
                                    <div className="stats-chart-body">
                                        {trendsData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={160}>
                                                <AreaChart data={trendsData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorBooks" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorChapters" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                                    <YAxis tick={{ fontSize: 10 }} width={30} tickLine={false} axisLine={false} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Area type="monotone" dataKey="Books" stackId="1" stroke="#f59e0b" fill="url(#colorBooks)" />
                                                    <Area type="monotone" dataKey="Chapters" stackId="1" stroke="#8b5cf6" fill="url(#colorChapters)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>No publishing trends available</p>}
                                    </div>
                                </div> */}

                                {/* Recent Activity Feed */}
                                <div className="stats-chart-card" style={{ gridColumn: '1 / -1' }}>
                                    <div className="stats-chart-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 8 }}>
                                        <span className="stats-chart-title" style={{ color: '#111827' }}>⚡ Live Recent Activity</span>
                                    </div>
                                    <div className="stats-chart-body">
                                        {engagement.recentActivity.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {engagement.recentActivity.map((act) => {
                                                    const isUser = act.type === 'USER_SIGNUP';
                                                    const icon = isUser ? '👤' : '📝';
                                                    const color = isUser ? '#10b981' : '#3b82f6';
                                                    return (
                                                        <div key={`${act.type}-${act.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                                                                {icon}
                                                            </div>
                                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                                <p style={{ margin: 0, fontSize: 12, color: '#1e293b', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                                    {isUser ? `New user registration: ${act.title}` : `New submission: ${act.title}`}
                                                                </p>
                                                            </div>
                                                            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>
                                                                {formatTimeAgo(act.timestamp)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>No recent activity</p>}
                                    </div>
                                </div>

                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminStatsDashboard;
