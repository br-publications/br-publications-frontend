'use client';
import { useEffect, useCallback, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '../../components/layout/header';
import Navbar from '../../components/layout/navbar';
import Footer from '../../components/layout/footer';
import { authService } from '../../services';
import { getAuthToken, getStoredUser, setStoredUser, removeAuthToken } from '../../services/api.config';

const EMPTY_USER = { isLoggedIn: false, userName: '', email: '', role: 'user', profilePicture: '' };

// Module-level cache — useSyncExternalStore compares via Object.is(),
// so we must return the same reference when data hasn't changed to avoid infinite loops
let _cachedJson = '';
let _cachedUser = EMPTY_USER;

function readUserFromStorage() {
    const token = getAuthToken();
    const userData = getStoredUser();

    const next = token && userData
        ? {
            isLoggedIn: true,
            userName: userData.username || userData.fullName || '',
            email: userData.email || '',
            role: userData.role || 'user',
            profilePicture: userData.profilePicture || ''
        }
        : EMPTY_USER;

    // Only allocate a new object when something actually changed
    const nextJson = JSON.stringify(next);
    if (nextJson !== _cachedJson) {
        _cachedJson = nextJson;
        _cachedUser = next;
    }
    return _cachedUser;
}

/** Subscribe to any external auth change events */
function subscribe(callback: () => void) {
    window.addEventListener('auth-changed', callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener('auth-changed', callback);
        window.removeEventListener('storage', callback);
    };
}

export default function PublicLayoutClient({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    /**
     * useSyncExternalStore is the React 18 idiomatic way to read external stores (localStorage/sessionStorage)
     * - getServerSnapshot: returns EMPTY_USER during SSR and hydration → matches server HTML → no hydration mismatch
     * - getSnapshot: returns actual user from storage on the client, after hydration
     * - subscribe: re-reads store whenever auth-changed or storage events fire
     * No useState, no useEffect setState, no hydration issues.
     */
    const user = useSyncExternalStore(
        subscribe,
        readUserFromStorage,  // client snapshot (after hydration)
        () => EMPTY_USER      // server snapshot (SSR + hydration phase) — must match server HTML
    );

    const handleLogout = useCallback(async (explicit = false) => {
        console.log('PublicLayoutClient: handleLogout triggered, explicit=', explicit);
        try {
            await authService.logout();
        } catch (e) {
            console.error('PublicLayoutClient: authService.logout failed', e);
        } finally {
            console.log('PublicLayoutClient: removing auth token and redirecting');
            removeAuthToken();
            // Dispatching auth-changed causes useSyncExternalStore to re-read storage → re-render
            window.dispatchEvent(new Event('auth-changed'));
            if (explicit || pathname?.startsWith('/dashboard')) {
                router.push('/');
            }
        }
    }, [pathname, router]);

    // Background API refresh — updates storage then fires event; no direct setState in effect body
    useEffect(() => {
        const token = getAuthToken();
        if (!token) return;

        authService.getCurrentUser()
            .then(response => {
                if (response.success && response.data) {
                    setStoredUser(response.data);
                    // Trigger useSyncExternalStore to re-read the updated storage
                    window.dispatchEvent(new Event('auth-changed'));
                }
            })
            .catch((error: any) => {
                const msg = error?.message?.toLowerCase() || '';
                if (
                    msg.includes('user not found') ||
                    msg.includes('token has expired') ||
                    msg.includes('invalid token') ||
                    msg.includes('authentication required')
                ) {
                    handleLogout();
                }
            });
    }, [handleLogout]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header
                isLoggedIn={user.isLoggedIn}
                userName={user.userName}
                userEmail={user.email}
                userRole={user.role}
                userProfilePicture={user.profilePicture}
                onLogout={handleLogout}
            />
            <div className="sticky top-0 z-[1000]">
                <Navbar />
            </div>
            <main className="flex-grow w-full max-w-[240mm] mx-auto bg-white shadow-xl my-8 p-[10px] min-h-auto">
                {children}
            </main>
            <Footer />
        </div>
    );
}
