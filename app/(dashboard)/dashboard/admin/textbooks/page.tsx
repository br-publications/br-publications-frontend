import { Suspense } from 'react';
import AdminTextBookDashboard from '@/pages-content/textBookSubmission/adminDashboard/AdminTextBookDashboard';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <AdminTextBookDashboard />
    </Suspense>
  );
}
