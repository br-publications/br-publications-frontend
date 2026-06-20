import { Suspense } from 'react';
import ReviewerManagement from '@/pages-content/dashboard/editor/ReviewerManagement';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <ReviewerManagement />
    </Suspense>
  );
}
