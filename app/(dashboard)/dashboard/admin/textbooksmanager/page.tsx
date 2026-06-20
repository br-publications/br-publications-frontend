import { Suspense } from 'react';
import PublishedBookManager from '@/pages-content/textBookSubmission/adminDashboard/PublishedBookManager';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <PublishedBookManager />
    </Suspense>
  );
}
