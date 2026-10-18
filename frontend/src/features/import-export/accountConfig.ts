import type { ImportExportConfig } from './types';
import { ACCOUNT_COLUMNS } from './constants/accountColumns';
import type { Account } from '../../types/account';

/**
 * Account Import/Export configuration object.
 * Follows the reusable ImportExportConfig contract so the Contacts module
 * can implement ContactImportConfig with identical shape and behavior.
 */
export const accountImportExportConfig: ImportExportConfig<Account> = {
  entityName: 'accounts',
  templateFilename: 'accounts-import-template.xlsx',
  defaultSheetName: 'Accounts',
  columns: ACCOUNT_COLUMNS,
  maxRows: 500,
  maxSizeBytes: 5 * 1024 * 1024, // 5 MB
  instructions: {
    title: 'ACCOUNTS IMPORT TEMPLATE INSTRUCTIONS',
    rules: [
      'Save the workbook as a standard .xlsx, .csv, or supported spreadsheet file.',
      'Keep the top header row intact; column order should follow the template.',
      'Maximum 500 data accounts per import file.',
      'Required columns are marked with an asterisk (*).',
      'Categories, sub-categories, services, and owners are matched against system records.',
    ],
  },
};
