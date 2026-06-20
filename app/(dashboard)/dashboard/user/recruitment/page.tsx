import { Suspense } from 'react';
import UserRecruitmentDashboard from '@/pages-content/recruitmentSubmission/UserRecruitmentDashboard';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <UserRecruitmentDashboard />
    </Suspense>
  );
}
