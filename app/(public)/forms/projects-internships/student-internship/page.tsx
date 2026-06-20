import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/forms/projectsInternships/StudentInternshipForm';

export const metadata: Metadata = {
    title: 'Student Internship Form',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
