import { format } from 'date-fns';
import { type Notification, NotificationType, NotificationCategory } from '../../../types/notificationTypes';
import { Info, CheckCircle, AlertTriangle, AlertCircle, MessageSquare, FileText } from 'lucide-react';

interface NotificationItemProps {
    notification: Notification;
    onRead: (id: number) => void;
}

const getIcon = (type: NotificationType, category: NotificationCategory) => {
    // Category-based icons
    switch (category) {
        case NotificationCategory.SUBMISSION:
            return <FileText size={18} className="text-blue-500" />;
        case NotificationCategory.REVIEW:
            return <CheckCircle size={18} className="text-purple-500" />;
        case NotificationCategory.DISCUSSION:
            return <MessageSquare size={18} className="text-green-500" />;
        default:
            // Fallback to type-based icons
            switch (type) {
                case NotificationType.SUCCESS:
                    return <CheckCircle size={18} className="text-green-500" />;
                case NotificationType.WARNING:
                    return <AlertTriangle size={18} className="text-yellow-500" />;
                case NotificationType.ERROR:
                    return <AlertCircle size={18} className="text-red-500" />;
                default:
                    return <Info size={18} className="text-blue-500" />;
            }
    }
};

const NotificationItem = ({ notification, onRead }: NotificationItemProps) => {
    return (
        <div
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors relative group ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
            onClick={() => !notification.isRead && onRead(notification.id)}
        >
            <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type, notification.category)}
                </div>

                <div className="flex-1 min-w-0">
                    <p className={`text-sm text-gray-900 mb-1 ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                        {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {notification.message}
                    </p>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                            {format(new Date(notification.createdAt), 'MMM dd, p')}
                        </span>
                        {notification.category && (
                            <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {notification.category}
                            </span>
                        )}
                    </div>
                </div>

                {/* Unread Indicator */}
                {!notification.isRead && (
                    <div className="flex-shrink-0 self-center">
                        <span className="block w-2 h-2 bg-blue-600 rounded-full" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationItem;
