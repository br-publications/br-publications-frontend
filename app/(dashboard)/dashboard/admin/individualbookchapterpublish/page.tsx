import { Suspense } from 'react';
import ManualPublishingAdminPage from '@/pages-content/bookChapterSubmission/admin/ManualPublishingAdminPage';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <ManualPublishingAdminPage />
    </Suspense>
  );
}
