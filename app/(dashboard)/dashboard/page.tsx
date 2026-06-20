import { Suspense } from 'react';
import Component from '@/pages-content/bookChapterSubmission/admin/adminDashboard';
export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
