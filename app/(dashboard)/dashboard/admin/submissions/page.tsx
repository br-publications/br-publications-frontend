import { Suspense } from 'react';
import AdminDashboard from '@/pages-content/bookChapterSubmission/admin/adminDashboard';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}
