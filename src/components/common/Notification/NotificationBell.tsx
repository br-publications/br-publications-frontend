import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { isToday, isYesterday } from 'date-fns';
import notificationService from '../../../services/notification.service';
import { type Notification } from '../../../types/notificationTypes';
import NotificationItem from './NotificationItem';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Get user role from localStorage
    const getUserRole = (): string => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return user.role?.toLowerCase() || ''; // 'admin', 'editor', 'author', 'reviewer'
            }
        } catch (e) {
            console.error('Error parsing user role', e);
        }
        return '';
    };

    // Load initial notifications
    const fetchNotifications = async (isRefresh = false) => {
        try {
            if (!isRefresh && loading) return;
            setLoading(true);

            const pageToLoad = isRefresh ? 1 : page;
            const response = await notificationService.getUserNotifications(pageToLoad, 10);

            if (response && response.success && response.data) {
                const { notifications: newNotifications, unreadCount: count, totalPages } = response.data;

                if (isRefresh) {
                    setNotifications(newNotifications);
                } else {
                    // Filter duplicates just in case
                    setNotifications(prev => {
                        const existingIds = new Set(prev.map(n => n.id));
                        const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
                        return [...prev, ...uniqueNew];
                    });
                }

                // Only set unread count if dropdown is closed to prevent badge reappearing while open
                if (!isOpen) {
                    setUnreadCount(count);
                }

                setHasMore(pageToLoad < totalPages);
                // Only increment page if not refreshing, or if refreshing and we have more
                if (!isRefresh) {
                    setPage(prev => prev + 1);
                } else if (pageToLoad < totalPages) {
                    setPage(2);
                }
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load and polling
    useEffect(() => {
        fetchNotifications(true);

        // Poll every 30 seconds
        const interval = setInterval(() => {

            fetchNotifications(true);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = async () => {
        const newState = !isOpen;
        setIsOpen(newState);

        if (newState) {
            // Opening: Clear unread count and mark all as read
            setUnreadCount(0);
            try {
                await notificationService.markAllAsRead();
                // Update local state to read
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch (error) {
                console.error('Error marking all as read:', error);
            }
        }
    };

    const handleMarkAsRead = async (id: number) => {
        // Optimistically update UI
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        // Only decrement if it was unread
        const wasUnread = notifications.find(n => n.id === id && !n.isRead);
        if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
            try {
                await notificationService.markAsRead(id);
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }
    };

    const handleMarkAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try {
            await notificationService.markAllAsRead();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Navigate to related entity
    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }
        setIsOpen(false);

        // Determine route based on user role and entity type
        const role = getUserRole();
        const { relatedEntityId, relatedEntityType } = notification;

        if (!role || !relatedEntityId) return;

        if (relatedEntityType === 'BookChapterSubmission' || notification.category === 'SUBMISSION' || notification.category === 'REVIEW') {
            // Route logic based on role
            switch (role) {
                case 'admin':
                    navigate(`/admin/submissions/${relatedEntityId}`);
                    break;
                case 'editor':
                    navigate(`/editor/submissions/${relatedEntityId}`);
                    break;
                case 'author':
                    // Map notification titles/types to specific tabs
                    if (notification.title === 'Abstract Accepted' || notification.title === 'Abstract Rejected') {
                        navigate(`/author/submissions/${relatedEntityId}?tab=upload`);
                    } else if (notification.title === 'Revision Requested') {
                        navigate(`/author/submissions/${relatedEntityId}?tab=workflow`); // Or wherever revision upload is
                    } else if (notification.title === 'Book Chapter Published!') {
                        navigate(`/author/submissions/${relatedEntityId}?tab=overview`);
                    } else {
                        navigate(`/author/submissions/${relatedEntityId}`);
                    }
                    break;
                case 'reviewer':
                    navigate(`/reviewer/assignments/${relatedEntityId}`); // Check if this is the correct route
                    break;
                default:
                    console.warn('Unknown role for navigation:', role);
            }
        } else if (
            relatedEntityType === 'TextBookSubmission' ||
            notification.category === 'TEXTBOOK_SUBMISSION' ||
            notification.category === 'TEXTBOOK_REVISION' ||
            notification.category === 'TEXTBOOK_DECISION' ||
            notification.category === 'TEXTBOOK_PUBLISHING'
        ) {
            switch (role) {
                case 'admin':
                    navigate(`/dashboard/admin/textbooks?submissionId=${relatedEntityId}`);
                    break;
                case 'author':
                    navigate(`/dashboard/author/textbooks?submissionId=${relatedEntityId}`);
                    break;
                default:
                    // Fallback if role doesn't match specific paths
                    navigate(`/dashboard/author/textbooks?submissionId=${relatedEntityId}`);
            }
        } else if (notification.category === 'DISCUSSION') {
            switch (role) {
                case 'admin':
                    navigate(`/admin/submissions/${relatedEntityId}?tab=discussions`);
                    break;
                case 'editor':
                    navigate(`/editor/submissions/${relatedEntityId}`);
                    break;
                case 'author':
                    navigate(`/author/submissions/${relatedEntityId}`);
                    break;
                case 'reviewer':
                    navigate(`/reviewer/assignments/${relatedEntityId}`);
                    break;
            }
        }
    };

    // Group notifications logic
    const groupedNotifications = {
        today: notifications.filter(n => isToday(new Date(n.createdAt))),
        yesterday: notifications.filter(n => isYesterday(new Date(n.createdAt))),
        earlier: notifications.filter(n => !isToday(new Date(n.createdAt)) && !isYesterday(new Date(n.createdAt)))
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors group"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-[#2c3e50]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden z-[1000] border border-gray-100 ring-1 ring-black ring-opacity-5">
                    {/* Header */}
                    {/* <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); fetchNotifications(true); }}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                title="Refresh"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                            >
                                <Check size={14} /> Mark all read
                            </button>
                        </div>
                    </div> */}

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto overscroll-contain">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center text-gray-500 flex flex-col items-center">
                                <div className="bg-gray-100 p-3 rounded-full mb-3">
                                    <Bell size={24} className="text-gray-400" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">No notifications yet</p>
                                <p className="text-xs text-gray-500 mt-1">We'll notify you when something arrives</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {groupedNotifications.today.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 backdrop-blur-sm">
                                            Today
                                        </div>
                                        {groupedNotifications.today.map(notification => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onRead={() => handleNotificationClick(notification)}
                                            />
                                        ))}
                                    </>
                                )}

                                {groupedNotifications.yesterday.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 backdrop-blur-sm">
                                            Yesterday
                                        </div>
                                        {groupedNotifications.yesterday.map(notification => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onRead={() => handleNotificationClick(notification)}
                                            />
                                        ))}
                                    </>
                                )}

                                {groupedNotifications.earlier.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 backdrop-blur-sm">
                                            Earlier
                                        </div>
                                        {groupedNotifications.earlier.map(notification => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onRead={() => handleNotificationClick(notification)}
                                            />
                                        ))}
                                    </>
                                )}

                                {/* Load More */}
                                {hasMore && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); fetchNotifications(); }}
                                        className="w-full py-3 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors text-center border-t border-gray-100"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                                            </span>
                                        ) : 'Load older notifications'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
