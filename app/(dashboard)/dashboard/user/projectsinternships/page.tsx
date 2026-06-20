import { Suspense } from 'react';
import UserProjectDashboard from '@/pages-content/projectsInternshipSubmission/UserProjectDashboard';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <UserProjectDashboard />
    </Suspense>
  );
}
