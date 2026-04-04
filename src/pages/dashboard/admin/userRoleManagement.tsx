import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users, Shield, Plus, MoreVertical, Edit2, Trash2, LogIn, Mail, Eye, UserCheck, UserX } from 'lucide-react';
import { userService, type User, type UserRole } from '../../../services/user.service';
import toast from 'react-hot-toast';
import UserDetailModal from './components/UserDetailModal';
import EmailUserModal from './components/EmailUserModal';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import CreateCustomRoleModal from '../../../customRoles/components/CreateCustomRoleModal';
import * as customRoleService from '../../../customRoles/services/customRoleService';
import type { CustomRole, SystemRole } from '../../../customRoles/types/customRoleTypes';
import '../../../customRoles/styles/customRoles.css';

type Tab = 'users' | 'roles';

export default function UserRoleManagement() {
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Custom Roles state
    const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
    const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
    const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
    const [loadingRoles, setLoadingRoles] = useState(false);

    // Actions state
    const [activeActionMenuId, setActiveActionMenuId] = useState<number | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number; alignment?: 'top' | 'bottom'; maxHeight?: number } | null>(null);
    const [showEditUserRoleModal, setShowEditUserRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // New Modals state
    const [showUserDetailModal, setShowUserDetailModal] = useState(false);
    const [showEmailUserModal, setShowEmailUserModal] = useState(false);

    // Alert Popup State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
        confirmText?: string;
        showCancel?: boolean; // Add showCancel property
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        showCancel: false, // Default to false
    });

    const actionMenuRef = useRef<HTMLDivElement>(null);

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setActiveActionMenuId(null);
                setDropdownPosition(null);
            }
        };

        const handleScroll = () => {
            if (activeActionMenuId !== null) {
                setActiveActionMenuId(null);
                setDropdownPosition(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [activeActionMenuId]);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'roles') {
            fetchRoles();
        }
    }, [activeTab, page, roleFilter, statusFilter]); // Re-fetch dependencies

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'users') {
                setPage(1); // Reset page on search
                fetchUsers();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userService.getAllUsers({
                page,
                limit: 10,
                search: searchTerm,
                role: roleFilter === 'all' ? undefined : roleFilter,
                isActive: statusFilter === 'all' ? undefined : (statusFilter === 'active')
            });
            if (response.success && response.data) {
                setUsers(response.data.users);
                setTotalPages(response.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const [systemRolesData, customRolesData] = await Promise.all([
                customRoleService.getAllSystemRoles(),
                customRoleService.getAllCustomRoles()
            ]);
            setSystemRoles(systemRolesData);
            setCustomRoles(customRolesData);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
            toast.error('Failed to load roles');
        } finally {
            setLoadingRoles(false);
        }
    };



    const handleImpersonate = (user: User) => {
        setAlertConfig({
            isOpen: true,
            type: 'warning',
            title: 'Confirm Login',
            message: `Are you sure you want to login as ${user.fullName}? This will open a new tab.`,
            showCancel: true,
            confirmText: 'Login',
            onConfirm: () => executeImpersonate(user),
        });
    };

    const executeImpersonate = async (user: User) => {
        setAlertConfig(prev => ({ ...prev, isOpen: false })); // Close alert
        try {
            const response = await userService.impersonateUser(user.id);
            if (response.success && response.data) {
                const { token, user: impersonatedUser } = response.data;

                // Construct URL for new tab
                const userParam = encodeURIComponent(JSON.stringify(impersonatedUser));
                const url = `/impersonate?token=${token}&user=${userParam}`;

                // Open in new tab
                window.open(url, '_blank');

                toast.success(`Opening session for ${user.fullName}...`);
            }
        } catch (error: any) {
            console.error('Impersonation error:', error);
            toast.error(error.message || 'Failed to impersonate user');
        }
    };

    const handleToggleStatus = (user: User) => {
        if (!user) return;
        const action = user.isActive ? 'deactivate' : 'reactivate';

        setAlertConfig({
            isOpen: true,
            type: user.isActive ? 'error' : 'success', // Red for deactivate, Green for activate (handled by type usually, or just warning)
            title: `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            message: `Are you sure you want to ${action} ${user.fullName}?`,
            showCancel: true,
            confirmText: 'Yes, proceed',
            onConfirm: () => executeToggleStatus(user),
        });
    };

    const executeToggleStatus = async (user: User) => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
        try {
            let response;
            const action = user.isActive ? 'deactivate' : 'reactivate';

            if (user.isActive) {
                response = await userService.deleteUser(user.id);
            } else {
                response = await userService.reactivateUser(user.id);
            }

            if (response.success) {
                toast.success(`User ${action}d successfully`);
                fetchUsers(); // Refresh list
                setActiveActionMenuId(null);
            }
        } catch (error: any) {
            const action = user.isActive ? 'deactivate' : 'reactivate';
            console.error('Status toggle error:', error);
            toast.error(error.message || `Failed to ${action} user`);
        }
    };

    const handleDeletePermanent = (user: User) => {
        if (!user) return;
        setAlertConfig({
            isOpen: true,
            type: 'error',
            title: 'Permanent Deletion',
            message: `Are you sure you want to PERMANENTLY delete ${user.fullName}? This action cannot be undone.`,
            showCancel: true,
            confirmText: 'Delete Permanently',
            onConfirm: () => executeDeletePermanent(user),
        });
    };

    const executeDeletePermanent = async (user: User) => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
        try {
            const response = await userService.deleteUserPermanent(user.id);

            if (response.success) {
                toast.success(`User ${user.fullName} permanently deleted`);
                fetchUsers(); // Refresh list
                setActiveActionMenuId(null);
            }
        } catch (error: any) {
            console.error('Delete permanent error:', error);
            toast.error(error.message || 'Failed to delete user permanently');
        }
    };

    const handleEditUserRole = (user: User) => {
        setSelectedUser(user);
        setShowEditUserRoleModal(true);
        setActiveActionMenuId(null);
    };

    const handleUpdateUserRole = async (role: UserRole) => {
        if (!selectedUser) return;

        try {
            const response = await userService.updateUserRole(selectedUser.id, role);
            if (response.success) {
                toast.success(`Role updated to ${role}`);
                setShowEditUserRoleModal(false);
                fetchUsers(); // Refresh list
            }
        } catch (error: any) {
            console.error('Update role error:', error);
            toast.error(error.message || 'Failed to update role');
        }
    };

    const openEmailModal = (user: User) => {
        setSelectedUser(user);
        setShowEmailUserModal(true);
        setActiveActionMenuId(null);
    };

    const openDetailModal = (user: User) => {
        setSelectedUser(user);
        setShowUserDetailModal(true);
        setActiveActionMenuId(null);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h1 className="text-base font-bold text-gray-900">User & Role Management</h1>
                    <p className="text-gray-500 mt-0.5 text-[10px]">Manage system users, roles, and permissions</p>
                </div>
                {/* {activeTab === 'roles' && (
                    <button
                        onClick={() => setShowCreateRoleModal(true)}
                        className="btn-primary flex items-center gap-1.5 w-full md:w-auto justify-center text-xs py-1.5 px-3"
                    >
                        <Plus size={16} />
                        Create New Role
                    </button>
                )} */}
                {activeTab === 'roles' && (
                    <button
                        disabled
                        className="btn-primary flex items-center gap-1.5 w-full md:w-auto justify-center opacity-50 cursor-not-allowed text-[10px] py-1.5 px-3"
                        title="Creation of new roles is currently disabled"
                    >
                        <Plus size={14} />
                        Create New Role
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <nav className="-mb-px flex space-x-6 min-w-max px-1">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`
                            whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs flex items-center gap-1.5
                            ${activeTab === 'users'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <Users size={16} />
                        All Users
                    </button>
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`
                            whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs flex items-center gap-1.5
                            ${activeTab === 'roles'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <Shield size={16} />
                        All Roles
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[300px]">
                {activeTab === 'users' ? (
                    <div className="p-3">
                        {/* User Filters */}
                        <div className="flex flex-col md:flex-row gap-2 mb-3">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    className="pl-8 pr-3 py-1.5 w-full text-[10px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative w-full md:w-40">
                                <select
                                    className="pl-3 pr-7 py-1.5 w-full text-[10px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white cursor-pointer"
                                    value={roleFilter}
                                    onChange={(e) => {
                                        setRoleFilter(e.target.value as any);
                                        setPage(1);
                                    }}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="reviewer">Reviewer</option>
                                    <option value="author">Author</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>
                            <div className="relative w-full md:w-36">
                                <select
                                    className="pl-3 pr-7 py-1.5 w-full text-[10px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value as any);
                                        setPage(1);
                                    }}
                                >
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                    <option value="all">All Users</option>
                                </select>
                            </div>
                        </div>

                        {/* Users Table */}
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                                <p className="mt-2 text-[10px] text-gray-500">Loading users...</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto min-h-[200px]">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {users.length > 0 ? users.map((user) => {
                                                return (
                                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-3 py-2">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px] border border-indigo-50">
                                                                    {user.profilePicture ? (
                                                                        <img src={user.profilePicture} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                                                                    ) : (
                                                                        user.fullName?.charAt(0) || user.username?.charAt(0)
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900 text-xs">{user.fullName}</p>
                                                                    <p className="text-[10px] text-gray-500 max-w-[150px] truncate" title={user.email}>{user.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span className={`
                                                            px-1.5 py-0.5 rounded-full text-[10px] font-medium border capitalize inline-flex items-center gap-1
                                                            ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                    user.role === 'editor' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                        user.role === 'reviewer' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                            'bg-gray-50 text-gray-600 border-gray-200'}
                                                        `}>
                                                                <Shield size={9} />
                                                                {user.role === 'developer' ? 'Default User' : user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${user.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                                <span className={`w-1 h-1 rounded-full ${user.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                                                {user.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-[10px] text-gray-500 whitespace-nowrap">
                                                            {new Date(user.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            {user.role !== 'developer' && (
                                                                <div className="relative inline-block text-left">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (activeActionMenuId === user.id) {
                                                                                setActiveActionMenuId(null);
                                                                                setDropdownPosition(null);
                                                                            } else {
                                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                                const windowHeight = window.innerHeight;

                                                                                const spaceBelow = windowHeight - rect.bottom;
                                                                                const spaceAbove = rect.top;

                                                                                // Show below if there's enough space (250px) or more space below than above
                                                                                const showBelow = spaceBelow >= 250 || spaceBelow > spaceAbove;

                                                                                const zoomFactor = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;

                                                                                // Normalize coordinates by zoom factor for fixed positioning
                                                                                const normalizedRect = {
                                                                                    top: rect.top / zoomFactor,
                                                                                    bottom: rect.bottom / zoomFactor,
                                                                                    left: rect.left / zoomFactor,
                                                                                    right: rect.right / zoomFactor
                                                                                };

                                                                                setDropdownPosition({
                                                                                    top: showBelow ? normalizedRect.bottom : normalizedRect.top,
                                                                                    right: (window.innerWidth - rect.right) / zoomFactor,
                                                                                    alignment: showBelow ? 'top' : 'bottom',
                                                                                    maxHeight: ((showBelow ? spaceBelow : spaceAbove) / zoomFactor) - 20
                                                                                });
                                                                                setActiveActionMenuId(user.id);
                                                                            }
                                                                        }}
                                                                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                                                    >
                                                                        <MoreVertical size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            }) : (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-gray-500">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <Users className="h-8 w-8 text-gray-300 mb-2" />
                                                            <p className="text-[10px]">No users found matching your criteria.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="px-3 py-2 border-t border-gray-100 flex justify-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-[10px] font-medium"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-2 py-1 text-gray-600 text-[10px] flex items-center">
                                            Page {page} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-[10px] font-medium"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="p-3">
                        {/* Roles Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Role Name</th>
                                        <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Users</th>
                                        <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Permissions</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loadingRoles ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                                                <p className="mt-2 text-[10px] text-gray-500">Loading roles...</p>
                                            </td>
                                        </tr>
                                    ) : [...systemRoles, ...customRoles].map((role) => (
                                        <tr key={role.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Shield size={12} className="text-gray-400" />
                                                    <span className="font-medium text-gray-900 text-xs">{role.displayName}</span>
                                                    {role.isSystemRole && (
                                                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide font-medium">System</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-[10px] text-gray-500">
                                                {role.description || 'No description'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                                                    {role.userCount} users
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-[10px] text-gray-500">
                                                <span className="text-primary-600 cursor-pointer hover:underline text-[10px]">
                                                    {role.permissionCount} permissions
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right flex justify-end gap-1.5">
                                                {!role.isSystemRole && (
                                                    <>
                                                        <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" title="Edit Role">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50" title="Delete Role">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Role Modal */}
            <CreateCustomRoleModal
                isOpen={showCreateRoleModal}
                onClose={() => setShowCreateRoleModal(false)}
                onSuccess={() => {
                    setShowCreateRoleModal(false);
                    fetchRoles();
                }}
            />

            {/* Edit User Role Modal */}
            {
                showEditUserRoleModal && selectedUser && (
                    <EditUserRoleModal
                        user={selectedUser}
                        onClose={() => setShowEditUserRoleModal(false)}
                        onUpdate={handleUpdateUserRole}
                    />
                )
            }

            {/* User Detail Modal */}
            <UserDetailModal
                user={selectedUser}
                isOpen={showUserDetailModal}
                onClose={() => setShowUserDetailModal(false)}
                onEmail={() => {
                    setShowUserDetailModal(false);
                    if (selectedUser) openEmailModal(selectedUser);
                }}
            />

            {/* Email User Modal */}
            <EmailUserModal
                user={selectedUser}
                isOpen={showEmailUserModal}
                onClose={() => setShowEmailUserModal(false)}
            />

            {/* Alert Popup */}
            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText={alertConfig.confirmText}
                showCancel={alertConfig.showCancel} // Pass showCancel
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={alertConfig.onConfirm}
            />
            {/* Fixed Position Dropdown - Rendered via Portal to escape transforms */}
            {activeActionMenuId !== null && dropdownPosition && createPortal(
                <div className="fixed inset-0 z-[100] cursor-default" onClick={() => setActiveActionMenuId(null)}>
                    <div
                        ref={actionMenuRef}
                        style={{
                            top: `${dropdownPosition.top}px`,
                            right: `${dropdownPosition.right}px`,
                            transform: dropdownPosition.alignment === 'bottom' ? 'translateY(-100%)' : 'none',
                            maxHeight: dropdownPosition.maxHeight ? `${dropdownPosition.maxHeight}px` : '300px',
                            overflowY: 'auto'
                        }}
                        className={`fixed w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[101] animate-in fade-in zoom-in-95 duration-200 ${dropdownPosition.alignment === 'bottom' ? 'origin-bottom-right' : 'origin-top-right'} transition-transform`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(() => {
                            const user = users.find(u => u.id === activeActionMenuId);
                            if (!user) return null;
                            return (
                                <>
                                    <button
                                        onClick={() => openDetailModal(user)}
                                        className="w-full text-left px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Eye size={12} className="text-gray-500" />
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => handleEditUserRole(user)}
                                        className="w-full text-left px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Edit2 size={12} className="text-gray-500" />
                                        Edit Role
                                    </button>
                                    <button
                                        onClick={() => openEmailModal(user)}
                                        className="w-full text-left px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Mail size={12} className="text-gray-500" />
                                        Email User
                                    </button>
                                    <button
                                        onClick={() => handleImpersonate(user)}
                                        className="w-full text-left px-3 py-1.5 text-[10px] text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                    >
                                        <LogIn size={12} />
                                        Login as User
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button
                                        onClick={() => handleToggleStatus(user)}
                                        className={`w-full text-left px-3 py-1.5 text-[10px] flex items-center gap-2 ${user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                    >
                                        {user.isActive ? (
                                            <>
                                                <UserX size={12} />
                                                Deactivate
                                            </>
                                        ) : (
                                            <>
                                                <UserCheck size={12} />
                                                Reactivate
                                            </>
                                        )}
                                    </button>
                                    {/* {!user.isActive && (
                                        <button
                                            onClick={() => handleDeletePermanent(user)}
                                            className="w-full text-left px-3 py-1.5 text-[10px] text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1 pt-1.5"
                                        >
                                            <Trash2 size={12} />
                                            Delete Permanently
                                        </button>
                                    )} */}
                                </>
                            );
                        })()}
                    </div>
                </div>,
                document.body
            )}
        </div >
    );
}



// Modal for editing user role
function EditUserRoleModal({ user, onClose, onUpdate }: { user: User, onClose: () => void, onUpdate: (role: UserRole) => void }) {
    const [role, setRole] = useState<UserRole>(user.role);
    const ROLES: UserRole[] = ['user', 'author', 'student', 'reviewer', 'editor', 'admin'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(role);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-sm text-gray-900">Edit User Role</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-3">
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                {user.fullName?.charAt(0) || user.username?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 text-xs">{user.fullName}</p>
                                <p className="text-[10px] text-gray-500">{user.email}</p>
                            </div>
                        </div>

                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Select Role</label>
                        <select
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 capitalize text-xs"
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                        >
                            {ROLES.map((r) => (
                                <option key={r} value={r} className="capitalize">{r}</option>
                            ))}
                        </select>
                        <p className="mt-1.5 text-[8px] text-gray-500 tracking-wide uppercase">
                            Changing a user's role will update their permissions and access levels immediately.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 text-[10px] font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100">
                            Cancel
                        </button>
                        <button type="submit" className="px-3 py-1.5 text-[10px] font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700">
                            Update Role
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
