export const NotificationType = {
    INFO: 'INFO',
    SUCCESS: 'SUCCESS',
    WARNING: 'WARNING',
    ERROR: 'ERROR'
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const NotificationCategory = {
    SUBMISSION: 'SUBMISSION',
    REVIEW: 'REVIEW',
    DISCUSSION: 'DISCUSSION',
    TEXTBOOK_SUBMISSION: 'TEXTBOOK_SUBMISSION',
    TEXTBOOK_REVISION: 'TEXTBOOK_REVISION',
    TEXTBOOK_DECISION: 'TEXTBOOK_DECISION',
    TEXTBOOK_PUBLISHING: 'TEXTBOOK_PUBLISHING',
    SYSTEM: 'SYSTEM'
} as const;

export type NotificationCategory = typeof NotificationCategory[keyof typeof NotificationCategory];

export interface Notification {
    id: number;
    recipientId: number;
    senderId?: number;
    sender?: {
        id: number;
        fullName: string;
        email: string;
        profilePicture?: string;
    };
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    relatedEntityId?: number;
    relatedEntityType?: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationResponse {
    notifications: Notification[];
    totalNotifications: number;
    unreadCount: number;
    currentPage: number;
    totalPages: number;
}
