import { Suspense } from 'react';
import AdminDirectPublishingPage from '@/pages-content/textBookSubmission/adminDashboard/AdminDirectPublishingPage';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <AdminDirectPublishingPage />
    </Suspense>
  );
}
