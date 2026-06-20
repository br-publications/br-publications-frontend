import { Suspense } from 'react';
import RecruitmentDetailView from '@/pages-content/recruitmentSubmission/RecruitmentDetailView';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <RecruitmentDetailView />
    </Suspense>
  );
}
