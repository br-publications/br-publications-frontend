'use client';
import UserDashboard from '../../components/layout/userPages/userDashboard';
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <UserDashboard>{children}</UserDashboard>;
}
