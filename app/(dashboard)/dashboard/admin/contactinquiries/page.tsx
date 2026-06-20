import { Suspense } from 'react';
import AdminContactDashboard from '@/pages-content/contactInquiries/AdminContactDashboard';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <AdminContactDashboard />
    </Suspense>
  );
}
