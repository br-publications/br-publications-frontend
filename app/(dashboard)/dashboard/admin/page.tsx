import { Suspense } from 'react';
import AdminStatsDashboard from '@/pages-content/dashboard/admin/AdminStatsDashboard';
export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><AdminStatsDashboard /></Suspense>; }
