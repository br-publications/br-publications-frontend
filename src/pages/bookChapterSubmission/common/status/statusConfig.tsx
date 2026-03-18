/**
 * statusConfig.ts
 * Complete status configuration for all 10 submission statuses
 * Includes colors, icons, and labels for UI display
 *
 * Status Type Definition (from submissionTypes.ts):
 * 'ABSTRACT_SUBMITTED' | 'MANUSCRIPTS_PENDING' | 'REVIEWER_ASSIGNMENT' | 'UNDER_REVIEW' |
 * 'EDITORIAL_REVIEW' | 'APPROVED' | 'ISBN_APPLIED' | 'PUBLICATION_IN_PROGRESS' |
 * 'PUBLISHED' | 'REJECTED'
 */

import React from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Edit,
  Trophy,
  Hash,
  Loader,
} from 'lucide-react';
import type { SubmissionStatus } from '../../../../types/submissionTypes';

interface StatusConfigItem {
  color: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

/**
 * Complete status configuration - All 10 statuses
 * Maps each SubmissionStatus to display properties: color, icon, and label
 */
export const statusConfig: Record<SubmissionStatus, StatusConfigItem> = {
  // ============================================================================
  // 1. SUBMISSION PHASE
  // ============================================================================
  ABSTRACT_SUBMITTED: {
    color: '#3b82f6',
    icon: <FileText size={16} />,
    label: 'Abstract Submitted',
    description: 'Abstract submitted and waiting for editor review',
  },

  // ============================================================================
  // 2. MANUSCRIPT COLLECTION PHASE
  // ============================================================================
  MANUSCRIPTS_PENDING: {
    color: '#f59e0b',
    icon: <AlertCircle size={16} />,
    label: 'Manuscripts Pending',
    description: 'Abstract accepted — awaiting manuscript uploads for each chapter',
  },

  // ============================================================================
  // 3. REVIEWER ASSIGNMENT PHASE
  // ============================================================================
  REVIEWER_ASSIGNMENT: {
    color: '#8b5cf6',
    icon: <Users size={16} />,
    label: 'Assigning Reviewers',
    description: 'Manuscripts received — editor is assigning peer reviewers',
  },

  // ============================================================================
  // 4. PEER REVIEW PHASE
  // ============================================================================
  UNDER_REVIEW: {
    color: '#3b82f6',
    icon: <Clock size={16} />,
    label: 'Under Peer Review',
    description: 'Peer reviewers are evaluating the manuscripts',
  },

  // ============================================================================
  // 5. EDITORIAL REVIEW PHASE
  // ============================================================================
  EDITORIAL_REVIEW: {
    color: '#8b5cf6',
    icon: <Edit size={16} />,
    label: 'Editorial Review',
    description: 'Editor is making per-chapter decisions based on peer reviews',
  },

  // ============================================================================
  // 6. APPROVED
  // ============================================================================
  APPROVED: {
    color: '#10b981',
    icon: <CheckCircle size={16} />,
    label: 'Approved',
    description: 'All chapters approved — ready to start proof editing',
  },

  // ============================================================================
  // 7. ISBN APPLIED
  // ============================================================================
  ISBN_APPLIED: {
    color: '#06b6d4',
    icon: <Hash size={16} />,
    label: 'Proof Editing',
    description: 'Proof editing in progress — awaiting ISBN & DOI to start publication',
  },

  // ============================================================================
  // 8. PUBLICATION IN PROGRESS
  // ============================================================================
  PUBLICATION_IN_PROGRESS: {
    color: '#f97316',
    icon: <Loader size={16} />,
    label: 'Publication in Progress',
    description: 'ISBN & DOI recorded — book is being prepared for publication',
  },

  // ============================================================================
  // 9. PUBLISHED
  // ============================================================================
  PUBLISHED: {
    color: '#2ecc71',
    icon: <Trophy size={16} />,
    label: 'Published',
    description: 'Book chapter has been published',
  },

  // ============================================================================
  // 10. REJECTED
  // ============================================================================
  REJECTED: {
    color: '#ef4444',
    icon: <AlertCircle size={16} />,
    label: 'Rejected',
    description: 'Submission rejected',
  },
};

/**
 * Get status color
 */
export const getStatusColor = (status: SubmissionStatus): string => {
  return statusConfig[status]?.color || '#6b7280';
};

/**
 * Get status icon
 */
export const getStatusIcon = (status: SubmissionStatus): React.ReactNode => {
  return statusConfig[status]?.icon || <Clock size={16} />;
};

/**
 * Get status label
 */
export const getStatusLabel = (status: SubmissionStatus): string => {
  return statusConfig[status]?.label || status;
};

/**
 * Get status description
 */
export const getStatusDescription = (status: SubmissionStatus): string => {
  return statusConfig[status]?.description || 'Status unknown';
};

/**
 * Get all statuses grouped by phase
 */
export const getStatusesByPhase = () => {
  return {
    submission: [
      { status: 'ABSTRACT_SUBMITTED' as SubmissionStatus, label: 'Abstract Submitted' },
    ],
    manuscripts: [
      { status: 'MANUSCRIPTS_PENDING' as SubmissionStatus, label: 'Manuscripts Pending' },
    ],
    review: [
      { status: 'REVIEWER_ASSIGNMENT' as SubmissionStatus, label: 'Assigning Reviewers' },
      { status: 'UNDER_REVIEW' as SubmissionStatus, label: 'Under Peer Review' },
    ],
    editorial: [
      { status: 'EDITORIAL_REVIEW' as SubmissionStatus, label: 'Editorial Review' },
      { status: 'APPROVED' as SubmissionStatus, label: 'Approved' },
      { status: 'REJECTED' as SubmissionStatus, label: 'Rejected' },
    ],
    production: [
      { status: 'ISBN_APPLIED' as SubmissionStatus, label: 'ISBN Applied' },
      { status: 'PUBLICATION_IN_PROGRESS' as SubmissionStatus, label: 'Publication in Progress' },
      { status: 'PUBLISHED' as SubmissionStatus, label: 'Published' },
    ],
  };
};

export default {
  statusConfig,
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
  getStatusDescription,
  getStatusesByPhase,
};