export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MEMBER'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const PERMISSION_ACTIONS = [
  'dashboard.view',
  'accounts.view',
  'account.create',
  'account.edit',
  'account.reassignOwner',
  'contacts.view',
  'account.import',
  'account.template',
  'account.export',
  'lookup.manage',
  'user.manage',
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export interface PermissionDefinition {
  action: PermissionAction;
  category: 'Analytics' | 'Accounts' | 'Contacts' | 'Metadata' | 'Administration';
  label: string;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    action: 'dashboard.view',
    category: 'Analytics',
    label: 'View Dashboard',
    description: 'Access executive KPI summary cards, outreach funnel, and relationship analytics.',
  },
  {
    action: 'accounts.view',
    category: 'Accounts',
    label: 'View Accounts',
    description: 'Browse target accounts list and inspect detailed account profiles.',
  },
  {
    action: 'account.create',
    category: 'Accounts',
    label: 'Create Accounts',
    description: 'Register new target companies and institutional profiles in the CRM.',
  },
  {
    action: 'account.edit',
    category: 'Accounts',
    label: 'Edit Accounts',
    description: 'Modify company details (Super Admins and Admins can edit any; Members can edit accounts they own).',
  },
  {
    action: 'account.reassignOwner',
    category: 'Accounts',
    label: 'Reassign Account Owner',
    description: 'Change the assigned account owner to another team member.',
  },
  {
    action: 'account.import',
    category: 'Accounts',
    label: 'Import Accounts',
    description: 'Bulk upload accounts via spreadsheet import wizard.',
  },
  {
    action: 'account.template',
    category: 'Accounts',
    label: 'Download Account Template',
    description: 'Download verified Excel accounts import template with live lookups.',
  },
  {
    action: 'account.export',
    category: 'Accounts',
    label: 'Export Accounts',
    description: 'Export account records to Excel or CSV formats with security safeguards.',
  },
  {
    action: 'contacts.view',
    category: 'Contacts',
    label: 'View Contacts',
    description: 'Access stakeholder contacts directory and decision-maker records.',
  },
  {
    action: 'lookup.manage',
    category: 'Metadata',
    label: 'Manage Lookups',
    description: 'Configure industry categories, sub-categories, and strategic advisory services.',
  },
  {
    action: 'user.manage',
    category: 'Administration',
    label: 'Manage Users & Permissions',
    description: 'Create, update, activate/deactivate users, reset passwords, and manage team members.',
  },
];

export const ROLE_PRESET_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  SUPER_ADMIN: [
    'dashboard.view',
    'accounts.view',
    'account.create',
    'account.edit',
    'account.reassignOwner',
    'account.import',
    'account.template',
    'account.export',
    'contacts.view',
    'lookup.manage',
    'user.manage',
  ],
  ADMIN: [
    'dashboard.view',
    'accounts.view',
    'account.create',
    'account.edit',
    'account.reassignOwner',
    'account.import',
    'account.template',
    'account.export',
    'contacts.view',
    'lookup.manage',
    'user.manage',
  ],
  MEMBER: [
    'dashboard.view',
    'accounts.view',
    'account.create',
    'account.edit',
    'account.import',
    'account.template',
    'account.export',
    'contacts.view',
  ],
};
