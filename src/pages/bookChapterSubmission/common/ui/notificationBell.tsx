import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, AlertCircle, MessageSquare, Clock } from 'lucide-react';
import styles from './notificationBell.module.css';
import notificationService from '../../../../services/notification.service'; // Import service
import type { Notification } from '../../../../types/notificationTypes'; // Import shared type

interface NotificationBellProps {
  notifications?: Notification[];
  onNotificationRead?: (id: number) => void;
  onNotificationAction?: (notification: Notification) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'SUCCESS':
      return <CheckCircle className={styles.iconSuccess} size={14} />;
    case 'ERROR':
      return <AlertCircle className={styles.iconError} size={14} />;
    case 'WARNING':
      return <AlertCircle className={styles.iconWarning} size={14} />;
    case 'INFO':
    default:
      return <MessageSquare className={styles.iconInfo} size={14} />;
  }
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

const EMPTY_NOTIFICATIONS: Notification[] = [];

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications: initialNotifications = EMPTY_NOTIFICATIONS,
  onNotificationRead,
  onNotificationAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications if not provided via props
  useEffect(() => {
    if (initialNotifications === EMPTY_NOTIFICATIONS) {
      fetchNotifications();
    } else {
      setNotifications(initialNotifications);
    }
  }, [initialNotifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getUserNotifications(1, 10);
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      // Mark as read locally
      setNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, isRead: true } : n
      ));

      // Call API
      try {
        await notificationService.markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }

      if (onNotificationRead) {
        onNotificationRead(notification.id);
      }
    }

    if (onNotificationAction) {
      onNotificationAction(notification);
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Header */}
          <div className={styles.header}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>{unreadCount}</span>
            )}
          </div>

          {/* Content */}
          <div className={styles.content}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={24} />
                <p>No notifications yet</p>
                <span>You're all caught up!</span>
              </div>
            ) : (
              <div className={styles.notificationsList}>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleNotificationClick(notification);
                      }
                    }}
                  >
                    <div className={styles.iconWrapper}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className={styles.content}>
                      <div className={styles.title}>{notification.title}</div>
                      <div className={styles.message}>{notification.message}</div>
                      <div className={styles.time}>
                        <Clock size={12} />
                        {formatTime(notification.createdAt)}
                      </div>
                    </div>

                    {!notification.isRead && (
                      <div className={styles.unreadDot} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className={styles.footer}>
              <button
                className={styles.footerButton}
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
              <button
                className={`${styles.footerButton} ${styles.danger}`}
                onClick={handleClearAll}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;