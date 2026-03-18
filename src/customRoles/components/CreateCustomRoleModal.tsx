import React, { useState, useEffect } from 'react';
import PermissionSelector from './PermissionSelector';
import {
    type PermissionCategory,
    type CreateCustomRoleRequest,
    ROLE_TEMPLATES,
    type RoleTemplate,
} from '../types/customRoleTypes';
import * as customRoleService from '../services/customRoleService';
import '../styles/customRoles.css';

interface CreateCustomRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateCustomRoleModal: React.FC<CreateCustomRoleModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        description: '',
    });
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadPermissions();
        }
    }, [isOpen]);

    const loadPermissions = async () => {
        try {
            setIsLoadingPermissions(true);
            const categories = await customRoleService.getPermissionsByCategory();
            setPermissionCategories(categories);
        } catch (error: any) {
            console.error('Failed to load permissions:', error);
            window.dispatchEvent(new CustomEvent('app-alert', {
                detail: {
                    type: 'error',
                    title: 'Load Failed',
                    message: 'Failed to load permissions. Please try again.'
                }
            }));
        } finally {
            setIsLoadingPermissions(false);
        }
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);

        if (!templateId) {
            return;
        }

        const template = ROLE_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return;

        // Auto-fill form data
        setFormData({
            name: template.id,
            displayName: template.name,
            description: template.description,
        });

        // Auto-select permissions based on template
        const permissionIds: number[] = [];
        permissionCategories.forEach((category) => {
            category.permissions.forEach((permission) => {
                if (template.suggestedPermissions.includes(permission.permissionKey)) {
                    permissionIds.push(permission.id);
                }
            });
        });
        setSelectedPermissions(permissionIds);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate name
        if (!formData.name.trim()) {
            newErrors.name = 'Role name is required';
        } else if (!/^[a-z_]+$/.test(formData.name)) {
            newErrors.name = 'Role name must be lowercase with underscores only (e.g., content_manager)';
        }

        // Validate display name
        if (!formData.displayName.trim()) {
            newErrors.displayName = 'Display name is required';
        }

        // Validate permissions
        if (selectedPermissions.length === 0) {
            newErrors.permissions = 'At least one permission must be selected';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const requestData: CreateCustomRoleRequest = {
                name: formData.name.trim(),
                displayName: formData.displayName.trim(),
                description: formData.description.trim() || undefined,
                permissionIds: selectedPermissions,
            };

            await customRoleService.createCustomRole(requestData);
            window.dispatchEvent(new CustomEvent('app-alert', {
                detail: {
                    type: 'success',
                    title: 'Success',
                    message: 'Custom role created successfully!'
                }
            }));
            handleClose();
            onSuccess();
        } catch (error: any) {
            console.error('Failed to create custom role:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create custom role';
            window.dispatchEvent(new CustomEvent('app-alert', {
                detail: {
                    type: 'error',
                    title: 'Creation Failed',
                    message: errorMessage
                }
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form
        setFormData({
            name: '',
            displayName: '',
            description: '',
        });
        setSelectedPermissions([]);
        setSelectedTemplate('');
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Create Custom Role</h2>
                    <button
                        type="button"
                        className="modal-close-btn"
                        onClick={handleClose}
                        aria-label="Close modal"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Role Template Selector */}
                        <div className="form-group">
                            <label htmlFor="template" className="form-label">
                                Role Template (Optional)
                                <span
                                    style={{
                                        marginLeft: '0.5rem',
                                        fontSize: '0.75rem',
                                        color: '#6b7280',
                                        fontWeight: 'normal',
                                    }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }}
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    Select a template to auto-fill permissions
                                </span>
                            </label>
                            <select
                                id="template"
                                className="form-select"
                                value={selectedTemplate}
                                onChange={(e) => handleTemplateChange(e.target.value)}
                            >
                                <option value="">-- Select a template --</option>
                                {ROLE_TEMPLATES.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name} - {template.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Role Name */}
                        <div className="form-group">
                            <label htmlFor="name" className="form-label required">
                                Role Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                className="form-input"
                                placeholder="e.g., content_manager"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value.toLowerCase() })
                                }
                            />
                            {errors.name && <div className="form-error">{errors.name}</div>}
                            <div className="form-hint">
                                Use lowercase letters and underscores only (e.g., content_manager)
                            </div>
                        </div>

                        {/* Display Name */}
                        <div className="form-group">
                            <label htmlFor="displayName" className="form-label required">
                                Display Name
                            </label>
                            <input
                                type="text"
                                id="displayName"
                                className="form-input"
                                placeholder="e.g., Content Manager"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            />
                            {errors.displayName && <div className="form-error">{errors.displayName}</div>}
                            <div className="form-hint">Human-readable name shown to users</div>
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label htmlFor="description" className="form-label">
                                Description
                            </label>
                            <textarea
                                id="description"
                                className="form-textarea"
                                placeholder="Describe what this role can do..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <div className="form-hint">Optional description of the role's purpose</div>
                        </div>

                        {/* Permission Selector */}
                        <div className="form-group">
                            <label className="form-label required">
                                Permissions ({selectedPermissions.length} selected)
                            </label>
                            {errors.permissions && <div className="form-error">{errors.permissions}</div>}

                            {isLoadingPermissions ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    Loading permissions...
                                </div>
                            ) : (
                                <PermissionSelector
                                    categories={permissionCategories}
                                    selectedPermissions={selectedPermissions}
                                    onChange={setSelectedPermissions}
                                />
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading || isLoadingPermissions}
                        >
                            {isLoading ? 'Creating...' : 'Create Role'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCustomRoleModal;
