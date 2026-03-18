import React, { useState } from 'react';
import type { PermissionCategory, Permission } from '../types/customRoleTypes';
import '../styles/customRoles.css';

interface PermissionSelectorProps {
    categories: PermissionCategory[];
    selectedPermissions: number[];
    onChange: (permissionIds: number[]) => void;
}

const PermissionSelector: React.FC<PermissionSelectorProps> = ({
    categories,
    selectedPermissions,
    onChange,
}) => {
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    const toggleCategory = (category: string) => {
        setExpandedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const handlePermissionToggle = (permissionId: number) => {
        const newSelected = selectedPermissions.includes(permissionId)
            ? selectedPermissions.filter((id) => id !== permissionId)
            : [...selectedPermissions, permissionId];
        onChange(newSelected);
    };

    const handleSelectAllInCategory = (categoryPermissions: Permission[]) => {
        const categoryPermissionIds = categoryPermissions.map((p) => p.id);
        const allSelected = categoryPermissionIds.every((id) =>
            selectedPermissions.includes(id)
        );

        if (allSelected) {
            // Deselect all in category
            onChange(selectedPermissions.filter((id) => !categoryPermissionIds.includes(id)));
        } else {
            // Select all in category
            const newSelected = [...selectedPermissions];
            categoryPermissionIds.forEach((id) => {
                if (!newSelected.includes(id)) {
                    newSelected.push(id);
                }
            });
            onChange(newSelected);
        }
    };

    const getCategorySelectedCount = (categoryPermissions: Permission[]) => {
        return categoryPermissions.filter((p) => selectedPermissions.includes(p.id)).length;
    };

    return (
        <div className="permission-selector">
            {categories.map((category) => {
                const isExpanded = expandedCategories.includes(category.category);
                const selectedCount = getCategorySelectedCount(category.permissions);
                const allSelected = selectedCount === category.permissions.length;

                return (
                    <div key={category.category} className="permission-category">
                        <div
                            className="category-header"
                            onClick={() => toggleCategory(category.category)}
                        >
                            <div className="category-title">
                                <span>{category.displayName}</span>
                                <span className="category-count">
                                    {selectedCount}/{category.permissions.length}
                                </span>
                            </div>
                            <div className="category-actions">
                                <button
                                    type="button"
                                    className="select-all-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectAllInCategory(category.permissions);
                                    }}
                                    style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.75rem',
                                        marginRight: '0.5rem',
                                        background: allSelected ? '#ef4444' : '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {allSelected ? 'Deselect All' : 'Select All'}
                                </button>
                                <svg
                                    className={`category-toggle ${isExpanded ? 'expanded' : ''}`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="permission-list">
                                {category.permissions.map((permission) => (
                                    <div key={permission.id} className="permission-item">
                                        <input
                                            type="checkbox"
                                            id={`permission-${permission.id}`}
                                            className="permission-checkbox"
                                            checked={selectedPermissions.includes(permission.id)}
                                            onChange={() => handlePermissionToggle(permission.id)}
                                        />
                                        <label
                                            htmlFor={`permission-${permission.id}`}
                                            className="permission-info"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="permission-name">{permission.displayName}</div>
                                            <div className="permission-description">
                                                {permission.description || 'No description'}
                                            </div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default PermissionSelector;
