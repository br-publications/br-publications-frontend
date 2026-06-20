import { Suspense } from 'react';
import AdminRecruitmentDashboard from '@/pages-content/recruitmentSubmission/AdminRecruitmentDashboard';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <AdminRecruitmentDashboard />
    </Suspense>
  );
}
