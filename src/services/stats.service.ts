import { API_BASE_URL, getAuthHeaders } from './api.config';

export interface StatsOverview {
    bookChapterSubmissions: number;
    textBookSubmissions: number;
    publishedBooks: number;
    publishedBookChapters: number;
    recruitmentApplications: number;
    projectsInternships: number;
    pendingContactInquiries: number;
    pendingReviews: number;
    totalUsers: number;
}

export interface MonthlyReportData {
    period: { label: string; start: string; end: string };
    data: {
        bookChapterSubmissions: { total: number; byStatus: Record<string, number> };
        textBookSubmissions: { total: number; byStatus: Record<string, number> };
        publications: { newBooks: number; newChapters: number; totalByType: Record<string, number> };
        recruitment: { total: number; byStatus: Record<string, number>; byRole: Record<string, number> };
        projects: { total: number; byType: Record<string, number>; byStatus: Record<string, number> };
        contactInquiries: { total: number; byStatus: Record<string, number> };
        newUsers: number;
    };
}

export interface ExtendedStatsData {
    userGrowth: { month: string; count: number }[];
    userRoles: Record<string, number>;
    reviewerActivity: Record<string, number>;
    topReviewers: { id: number; name: string; email: string; count: number }[];
    editorWorkload: { id: number; name: string; email: string; count: number }[];
}

export interface EngagementStatsData {
    geographicDistribution: { country: string; count: number }[];
    publishingTrends: { month: string; books: number; chapters: number }[];
    recentActivity: { type: string; id: number; title: string; timestamp: string }[];
}

const statsService = {
    getOverview: async (): Promise<StatsOverview> => {
        const res = await fetch(`${API_BASE_URL}/api/stats/overview`, {
            headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch stats overview');
        const json = await res.json();
        return json.data;
    },

    getMonthlyReport: async (month?: string): Promise<MonthlyReportData> => {
        const url = month
            ? `${API_BASE_URL}/api/stats/monthly-report?month=${month}`
            : `${API_BASE_URL}/api/stats/monthly-report`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch monthly report');
        const json = await res.json();
        return { period: json.period, data: json.data };
    },

    sendEmailReportNow: async (): Promise<void> => {
        const res = await fetch(`${API_BASE_URL}/api/stats/send-email-report`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to send report email');
    },

    getExtendedStats: async (): Promise<ExtendedStatsData> => {
        const res = await fetch(`${API_BASE_URL}/api/stats/extended`, {
            headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch extended stats');
        const json = await res.json();
        return json.data;
    },

    getEngagementStats: async (): Promise<EngagementStatsData> => {
        const res = await fetch(`${API_BASE_URL}/api/stats/engagement`, {
            headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch engagement stats');
        const json = await res.json();
        return json.data;
    },
};

export default statsService;
