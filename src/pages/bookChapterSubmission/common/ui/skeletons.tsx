import React from 'react';
import styles from './skeletons.module.css';

/**
 * Card Skeleton - Loading placeholder for submission cards
 */
export const CardSkeleton: React.FC = () => (
  <div className={styles.cardSkeleton}>
    <div className={styles.skeletonHeader}>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonBadge} />
    </div>
    <div className={styles.skeletonAuthor} />
    <div className={styles.skeletonLine} />
    <div className={styles.skeletonLine} style={{ width: '70%' }} />
    <div className={styles.skeletonFooter}>
      <div className={styles.skeletonSmall} />
      <div className={styles.skeletonSmall} />
    </div>
  </div>
);

/**
 * Detail View Skeleton - Loading placeholder for detail panel
 */
export const DetailViewSkeleton: React.FC = () => (
  <div className={styles.detailSkeleton}>
    <div className={styles.skeletonHeader}>
      <div className={styles.skeletonLarge} />
      <div className={styles.skeletonMedium} />
    </div>
    <div className={styles.skeletonAlert} />
    <div className={styles.skeletonTabs}>
      <div className={styles.skeletonTab} />
      <div className={styles.skeletonTab} />
      <div className={styles.skeletonTab} />
    </div>
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonSection}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} style={{ width: '60%' }} />
      </div>
      <div className={styles.skeletonSection}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} />
      </div>
    </div>
  </div>
);

/**
 * Table Skeleton - Loading placeholder for lists
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className={styles.tableSkeleton}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={styles.tableRow}>
        <div className={styles.skeletonCell} />
        <div className={styles.skeletonCell} />
        <div className={styles.skeletonCell} style={{ width: '60%' }} />
        <div className={styles.skeletonCell} style={{ width: '40%' }} />
      </div>
    ))}
  </div>
);

/**
 * Text Skeleton - Loading placeholder for text content
 */
export const TextSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className={styles.textSkeleton}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={styles.skeletonLine}
        style={{
          width: i === lines - 1 ? '70%' : '100%',
          marginBottom: i === lines - 1 ? 0 : '8px',
        }}
      />
    ))}
  </div>
);

/**
 * Timeline Skeleton - Loading placeholder for workflow view
 */
export const TimelineSkeleton: React.FC = () => (
  <div className={styles.timelineSkeleton}>
    <div className={styles.skeletonProgressBar} />
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className={styles.skeletonTimelineItem}>
        <div className={styles.skeletonCircle} />
        <div className={styles.skeletonTimelineContent}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonLine} style={{ width: '60%' }} />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Avatar Skeleton - Loading placeholder for user avatars
 */
export const AvatarSkeleton: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => (
  <div
    className={styles.skeletonCircle}
    style={{
      width: size === 'sm' ? '32px' : size === 'md' ? '48px' : '64px',
      height: size === 'sm' ? '32px' : size === 'md' ? '48px' : '64px',
    }}
  />
);

/**
 * Message Skeleton - Loading placeholder for discussion messages
 */
export const MessageSkeleton: React.FC = () => (
  <div className={styles.messageSkeleton}>
    <div className={styles.skeletonCircle} style={{ width: '48px', height: '48px' }} />
    <div className={styles.messageContent}>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} style={{ width: '70%' }} />
    </div>
  </div>
);

/**
 * Form Skeleton - Loading placeholder for forms
 */
export const FormSkeleton: React.FC = () => (
  <div className={styles.formSkeleton}>
    <div className={styles.skeletonFormGroup}>
      <div className={styles.skeletonLabel} />
      <div className={styles.skeletonInput} />
    </div>
    <div className={styles.skeletonFormGroup}>
      <div className={styles.skeletonLabel} />
      <div className={styles.skeletonInput} style={{ height: '100px' }} />
    </div>
    <div className={styles.skeletonFormGroup}>
      <div className={styles.skeletonLabel} />
      <div className={styles.skeletonInput} />
    </div>
    <div className={styles.skeletonButtons}>
      <div className={styles.skeletonButton} />
      <div className={styles.skeletonButton} />
    </div>
  </div>
);

export default {
  CardSkeleton,
  DetailViewSkeleton,
  TableSkeleton,
  TextSkeleton,
  TimelineSkeleton,
  AvatarSkeleton,
  MessageSkeleton,
  FormSkeleton,
};