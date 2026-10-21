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
  'account.import',
  'account.template',
  'account.export',
  'contacts.view',
  'contact.create',
  'contact.edit',
  'contact.close',
  'contact.delete',
  'contact.reassignOwner',
  'contact.template',
  'contact.import',
  'contact.export',
  'followup.manage',
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
    action: 'contact.create',
    category: 'Contacts',
    label: 'Create Contacts',
    description: 'Create new decision-maker and leadership contact profiles.',
  },
  {
    action: 'contact.edit',
    category: 'Contacts',
    label: 'Edit Contacts',
    description: 'Modify contact profiles and relationship intelligence.',
  },
  {
    action: 'contact.close',
    category: 'Contacts',
    label: 'Close / Reopen Contacts',
    description: 'Toggle closed or active engagement status for contacts.',
  },
  {
    action: 'contact.delete',
    category: 'Contacts',
    label: 'Delete Contacts',
    description: 'Remove contact records from the CRM.',
  },
  {
    action: 'contact.reassignOwner',
    category: 'Contacts',
    label: 'Reassign Contact Owner',
    description: 'Change the assigned owner of a contact.',
  },
  {
    action: 'contact.template',
    category: 'Contacts',
    label: 'Download Contact Template',
    description: 'Download verified Excel contact import template with reference lookups.',
  },
  {
    action: 'contact.import',
    category: 'Contacts',
    label: 'Import Contacts',
    description: 'Bulk upload contacts via spreadsheet import wizard.',
  },
  {
    action: 'contact.export',
    category: 'Contacts',
    label: 'Export Contacts',
    description: 'Export contact records to Excel or CSV formats.',
  },
  {
    action: 'followup.manage',
    category: 'Contacts',
    label: 'Manage Follow-ups',
    description: 'Schedule, update, complete, and delete contact follow-up tasks.',
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
    'contact.create',
    'contact.edit',
    'contact.close',
    'contact.delete',
    'contact.reassignOwner',
    'contact.template',
    'contact.import',
    'contact.export',
    'followup.manage',
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
    'contact.create',
    'contact.edit',
    'contact.close',
    'contact.delete',
    'contact.reassignOwner',
    'contact.template',
    'contact.import',
    'contact.export',
    'followup.manage',
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
    'contact.create',
    'contact.edit',
    'contact.close',
    'contact.template',
    'contact.import',
    'contact.export',
    'followup.manage',
  ],
};
