import { Suspense } from 'react';
import Component from '../../../components/common/forgotPassword';
export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
