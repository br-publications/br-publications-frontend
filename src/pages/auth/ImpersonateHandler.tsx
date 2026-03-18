import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ImpersonateHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const processImpersonation = () => {
            try {
                const token = searchParams.get('token');
                const userDataStr = searchParams.get('user');

                if (!token || !userDataStr) {
                    throw new Error('Missing impersonation credentials');
                }

                // Decode user data
                const user = JSON.parse(decodeURIComponent(userDataStr));

                // Clear any existing local storage AUTH (safety measure for this tab)
                // actually we DON'T want to clear localStorage because we might want to revert?
                // But the requirement is "Login as specified user".
                // The plan is: this tab uses sessionStorage.

                // Store in SESSION STORAGE (Isolated from main admin tab)
                sessionStorage.setItem('authToken', token);
                sessionStorage.setItem('user', JSON.stringify(user));
                sessionStorage.setItem('isImpersonating', 'true');

                // Dispatch auth change event
                window.dispatchEvent(new Event('auth-changed'));

                toast.success(`Impersonating ${user.fullName || user.username}`);

                // Redirect based on role
                let redirectPath = '/dashboard';
                switch (user.role) {
                    case 'reviewer':
                        redirectPath = '/dashboard/reviewer/submissions';
                        break;
                    case 'editor':
                        redirectPath = '/dashboard/editor/submissions';
                        break;
                    case 'author':
                        redirectPath = '/dashboard/author/submissions';
                        break;
                    case 'admin':
                    case 'developer':
                        redirectPath = '/dashboard/admin/submissions';
                        break;
                    default:
                        redirectPath = '/dashboard';
                }

                navigate(redirectPath, { replace: true });

            } catch (error) {
                console.error('Impersonation failed:', error);
                toast.error('Failed to start impersonation session');
                navigate('/login', { replace: true });
            }
        };

        processImpersonation();
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white rounded-lg shadow-md text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-800">Switching User Session...</h2>
                <p className="text-gray-500 mt-2">Please wait while we log you in securely.</p>
            </div>
        </div>
    );
}
