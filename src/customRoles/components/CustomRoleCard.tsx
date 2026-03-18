import React from 'react';
import type { CustomRole, SystemRole } from '../types/customRoleTypes';
import '../styles/customRoles.css';

interface CustomRoleCardProps {
    role: CustomRole | SystemRole;
    isSystemRole?: boolean;
    onEdit?: (role: CustomRole | SystemRole) => void;
    onDelete?: (role: CustomRole | SystemRole) => void;
}

const CustomRoleCard: React.FC<CustomRoleCardProps> = ({
    role,
    isSystemRole = false,
    onEdit,
    onDelete,
}) => {
    const handleEdit = () => {
        if (onEdit && !isSystemRole) {
            onEdit(role);
        }
    };

    const handleDelete = () => {
        if (onDelete && !isSystemRole) {
            if (window.confirm(`Are you sure you want to delete the role "${role.displayName}"?`)) {
                onDelete(role);
            }
        }
    };

    return (
        <div className={`custom-role-card ${isSystemRole ? 'system-role' : 'custom-role'}`}>
            <div className="role-card-header">
                <div className="role-title-section">
                    <h3 className="role-display-name">{role.displayName}</h3>
                    {isSystemRole && <span className="system-badge">System Role</span>}
                </div>
                {!isSystemRole && (
                    <div className="role-actions">
                        <button
                            className="role-action-btn edit-btn"
                            onClick={handleEdit}
                            title="Edit role"
                            aria-label="Edit role"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                        <button
                            className="role-action-btn delete-btn"
                            onClick={handleDelete}
                            title="Delete role"
                            aria-label="Delete role"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            <div className="role-card-body">
                <p className="role-description">
                    {role.description || 'No description provided'}
                </p>

                <div className="role-stats">
                    <div className="role-stat">
                        <div className="stat-icon permissions-icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{role.permissionCount}</span>
                            <span className="stat-label">Permissions</span>
                        </div>
                    </div>

                    <div className="role-stat">
                        <div className="stat-icon users-icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{role.userCount}</span>
                            <span className="stat-label">Users</span>
                        </div>
                    </div>
                </div>

                {!isSystemRole && 'createdBy' in role && role.createdBy && (
                    <div className="role-metadata">
                        <span className="metadata-label">Created by:</span>
                        <span className="metadata-value">{role.createdBy.fullName}</span>
                    </div>
                )}
            </div>

            {/* Tooltip for detailed info */}
            <div className="role-tooltip">
                <div className="tooltip-content">
                    <h4>{role.displayName}</h4>
                    <p>{role.description || 'No description'}</p>
                    <div className="tooltip-stats">
                        <div>
                            <strong>Permissions:</strong> {role.permissionCount}
                        </div>
                        <div>
                            <strong>Users:</strong> {role.userCount}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomRoleCard;
