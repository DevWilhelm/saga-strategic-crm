import type { ImportExportConfig } from './types';
import { CONTACT_COLUMNS } from './constants/contactColumns';
import type { ContactListItem } from '../../types/contact';

/**
 * Contact Import/Export configuration object implementing the generic
 * ImportExportConfig contract.
 */
export const contactImportExportConfig: ImportExportConfig<ContactListItem> = {
  entityName: 'contacts',
  templateFilename: 'contacts-import-template.xlsx',
  defaultSheetName: 'Contacts',
  columns: CONTACT_COLUMNS,
  maxRows: 500,
  maxSizeBytes: 5 * 1024 * 1024, // 5 MB
  instructions: {
    title: 'CONTACTS IMPORT TEMPLATE INSTRUCTIONS',
    rules: [
      'Save the workbook as a standard .xlsx, .csv, or supported spreadsheet file.',
      'Keep the top header row intact; column order should follow the template.',
      'Maximum 500 contacts per import file.',
      'Required columns are marked with an asterisk (*). Name, Company, and Tier are mandatory.',
      'Company must match an existing CRM account name exactly (case-insensitive).',
      'Owner Username must match an active CRM user. Members may only assign themselves.',
      'Tiers accept TIER_1, TIER_2, TIER_3 (or T1, T2, T3). Relationship status accepts HOT, WARM, COLD.',
    ],
  },
};
