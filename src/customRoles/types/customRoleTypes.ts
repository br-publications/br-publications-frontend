// Permission interface
export interface Permission {
    id: number;
    permissionKey: string;
    displayName: string;
    description: string | null;
    category: string;
}

// Permission category interface
export interface PermissionCategory {
    category: string;
    displayName: string;
    permissions: Permission[];
}

// Custom role interface
export interface CustomRole {
    id: number;
    name: string;
    displayName: string;
    description: string | null;
    isSystemRole: boolean;
    isActive: boolean;
    permissionCount: number;
    userCount: number;
    createdAt: string;
    createdBy: {
        id: number;
        fullName: string;
    } | null;
}

// System role interface (for default roles)
export interface SystemRole {
    id: number;
    name: string;
    displayName: string;
    description: string | null;
    isSystemRole: boolean;
    isActive: boolean;
    permissionCount: number;
    userCount: number;
    createdAt: string;
}

// Create custom role request
export interface CreateCustomRoleRequest {
    name: string;
    displayName: string;
    description?: string;
    permissionIds: number[];
}

// Update custom role request
export interface UpdateCustomRoleRequest {
    displayName?: string;
    description?: string;
    permissionIds?: number[];
}

// Role with full permissions
export interface RoleWithPermissions extends CustomRole {
    permissions: Permission[];
}

// Assign role to user request
export interface AssignRoleRequest {
    roleId: number;
}

// Role template for quick setup
export interface RoleTemplate {
    id: string;
    name: string;
    description: string;
    suggestedPermissions: string[]; // permission keys
}

// Predefined role templates
export const ROLE_TEMPLATES: RoleTemplate[] = [
    {
        id: 'content_manager',
        name: 'Content Manager',
        description: 'Manages website content and published books',
        suggestedPermissions: [
            'content:update-contact',
            'content:update-about',
            'content:view-contact',
            'content:view-about',
            'content:view-published-books',
        ],
    },
    {
        id: 'publishing_coordinator',
        name: 'Publishing Coordinator',
        description: 'Coordinates ISBN application and publication process',
        suggestedPermissions: [
            'textbook:apply-isbn',
            'textbook:receive-isbn',
            'textbook:start-publication',
            'textbook:view-all',
            'textbook:download-files',
        ],
    },
    {
        id: 'senior_editor',
        name: 'Senior Editor',
        description: 'Full editorial control with reviewer management',
        suggestedPermissions: [
            'chapter:view-all',
            'chapter:editor-decision',
            'chapter:accept-abstract',
            'chapter:assign-reviewers',
            'chapter:reassign-reviewer',
            'chapter:final-decision',
            'chapter:view-stats',
            'chapter:download-files',
            'chapter:discussion',
            'user:manage-reviewers',
        ],
    },
    {
        id: 'associate_editor',
        name: 'Associate Editor',
        description: 'Editorial workflow without final decisions',
        suggestedPermissions: [
            'chapter:view-all',
            'chapter:accept-abstract',
            'chapter:assign-reviewers',
            'chapter:view-stats',
            'chapter:download-files',
            'chapter:discussion',
        ],
    },
    {
        id: 'senior_reviewer',
        name: 'Senior Reviewer',
        description: 'Advanced review capabilities',
        suggestedPermissions: [
            'review:view-assignments',
            'review:accept-assignment',
            'review:decline-assignment',
            'review:start-review',
            'review:save-draft',
            'review:submit-review',
            'review:request-revision',
            'review:view-own',
            'chapter:discussion',
        ],
    },
    {
        id: 'user_manager',
        name: 'User Manager',
        description: 'User account management without role assignment',
        suggestedPermissions: [
            'user:create',
            'user:read',
            'user:update',
            'user:view-all',
            'user:email-user',
            'user:view-stats',
        ],
    },
    {
        id: 'recruitment_manager',
        name: 'Recruitment Manager',
        description: 'Manages recruitment applications',
        suggestedPermissions: [
            'recruitment:view-all',
            'recruitment:update-status',
            'recruitment:assign-role',
            'user:email-user',
        ],
    },
    {
        id: 'submission_coordinator',
        name: 'Submission Coordinator',
        description: 'Coordinates submission workflow',
        suggestedPermissions: [
            'textbook:view-all',
            'textbook:view-stats',
            'textbook:download-files',
            'textbook:discussion',
            'chapter:view-all',
            'chapter:view-stats',
            'chapter:download-files',
        ],
    },
    {
        id: 'report_analyst',
        name: 'Report Analyst',
        description: 'View statistics and generate reports',
        suggestedPermissions: [
            'textbook:view-stats',
            'chapter:view-stats',
            'user:view-stats',
            'reports:generate',
            'reports:export',
        ],
    },
    {
        id: 'project_coordinator',
        name: 'Project Coordinator',
        description: 'Manages project and internship applications',
        suggestedPermissions: [
            'project:view-all',
            'project:update-status',
            'user:email-user',
        ],
    },
];
