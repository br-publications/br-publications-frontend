import { Suspense } from 'react';
import AdminProjectDashboard from '@/pages-content/projectsInternshipSubmission/AdminProjectDashboard';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <AdminProjectDashboard />
    </Suspense>
  );
}
