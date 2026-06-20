import { Suspense } from 'react';
import ReviewerDashboard from '@/pages-content/bookChapterSubmission/reviewer/reviewerDashboard';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <ReviewerDashboard />
    </Suspense>
  );
}
