import type { Account, AccountDetail } from '../../../types/account';
import type { AccountLookups } from '../../../types/lookup';
import { ACCOUNT_EXPORT_COLUMNS } from '../constants/accountColumns';

/**
 * Security: CSV Formula Injection (DDE) mitigation.
 * If a cell string starts with '=', '+', '-', or '@', prefix it with a single apostrophe (').
 */
export function sanitizeCsvCellValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);

  // If starts with potential formula trigger characters, prefix with single quote
  let safeStr = str;
  if (/^[=+\-@]/.test(safeStr)) {
    safeStr = `'${safeStr}`;
  }

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (/[",\r\n]/.test(safeStr)) {
    return `"${safeStr.replace(/"/g, '""')}"`;
  }

  return safeStr;
}

export interface ExportRowData {
  [key: string]: string;
}

/**
 * Transforms an account model into an export row matching ACCOUNT_EXPORT_COLUMNS.
 */
export function mapAccountToExportRow(
  acc: Account | AccountDetail | (Account & { nextFollowUpDate?: string | null }),
  lookups?: AccountLookups | null
): ExportRowData {
  const categoryName =
    lookups?.categories.find((c) => c.id === acc.categoryId)?.name || acc.categoryId || '';
  const subCategoryName =
    lookups?.subCategories.find((s) => s.id === acc.subCategoryId)?.name || acc.subCategoryId || '';
  const serviceName =
    lookups?.services.find((s) => s.id === acc.serviceId)?.name || acc.serviceId || '';
  const owner = lookups?.owners.find((o) => o.id === acc.ownerId);
  const ownerUsername = owner?.username || owner?.code.toLowerCase() || acc.ownerId || '';

  let tierLabel: string = acc.tier || '';
  if (acc.tier === 'TIER_1') tierLabel = 'Tier 1';
  else if (acc.tier === 'TIER_2') tierLabel = 'Tier 2';
  else if (acc.tier === 'TIER_3') tierLabel = 'Tier 3';

  let dealSideLabel = '';
  if (acc.dealSide === 'BUY_SIDE') dealSideLabel = 'Buy-Side';
  else if (acc.dealSide === 'SELL_SIDE') dealSideLabel = 'Sell-Side';

  const statusLabel = acc.status === 'ACTIVE' ? 'Active' : 'Inactive';
  const nextFollowUp =
    'nextFollowUpDate' in acc && acc.nextFollowUpDate ? String(acc.nextFollowUpDate) : '';

  return {
    'Name*': acc.name || '',
    'Business line*': acc.businessLine || '',
    'Category*': categoryName,
    'Sub-category': subCategoryName,
    'Service*': serviceName,
    'Tier*': tierLabel,
    'Owner username': ownerUsername,
    'Deal side': dealSideLabel,
    Country: acc.country || '',
    Website: acc.websiteUrl || '',
    'Source reference': acc.sourceRef || '',
    Note: acc.note || '',
    Status: statusLabel,
    'Next follow-up': nextFollowUp,
    'Created date': acc.createdDate || '',
    'Updated date': acc.updatedDate || '',
  };
}

/**
 * Builds CSV string with UTF-8 BOM and formula injection protection.
 */
export function buildAccountsCsv(
  accounts: (Account | AccountDetail)[],
  lookups?: AccountLookups | null
): Uint8Array {
  const headers = ACCOUNT_EXPORT_COLUMNS.map((col) => col.header);
  const rows = accounts.map((acc) => {
    const rowMap = mapAccountToExportRow(acc, lookups);
    return headers.map((h) => sanitizeCsvCellValue(rowMap[h] || '')).join(',');
  });

  const headerLine = headers.map((h) => sanitizeCsvCellValue(h)).join(',');
  const csvContent = [headerLine, ...rows].join('\r\n');

  // Prepend UTF-8 BOM (\uFEFF) so Excel and external tools detect UTF-8 properly (e.g. for non-English names)
  const encoder = new TextEncoder();
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const textBytes = encoder.encode(csvContent);

  const result = new Uint8Array(bom.length + textBytes.length);
  result.set(bom, 0);
  result.set(textBytes, bom.length);
  return result;
}

/**
 * Builds XLSX workbook buffer with all text cells explicitly written as strings (t: 's').
 */
export async function buildAccountsXlsx(
  accounts: (Account | AccountDetail)[],
  lookups?: AccountLookups | null
): Promise<Uint8Array> {
  const XLSX = await import('xlsx');

  const headers = ACCOUNT_EXPORT_COLUMNS.map((col) => col.header);
  const aoa: string[][] = [headers];

  accounts.forEach((acc) => {
    const rowMap = mapAccountToExportRow(acc, lookups);
    aoa.push(headers.map((h) => rowMap[h] || ''));
  });

  // Create worksheet from array-of-arrays
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Security: Force every cell to be plain string type 's' to prevent formula execution in Excel
  if (ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (cell && cell.v !== undefined && cell.v !== null) {
          cell.t = 's'; // string type
          cell.v = String(cell.v);
        }
      }
    }
  }

  // Set friendly column widths
  ws['!cols'] = [
    { wch: 25 }, // Name*
    { wch: 24 }, // Business line*
    { wch: 24 }, // Category*
    { wch: 24 }, // Sub-category
    { wch: 24 }, // Service*
    { wch: 15 }, // Tier*
    { wch: 20 }, // Owner username
    { wch: 16 }, // Deal side
    { wch: 18 }, // Country
    { wch: 28 }, // Website
    { wch: 24 }, // Source reference
    { wch: 35 }, // Note
    { wch: 14 }, // Status
    { wch: 18 }, // Next follow-up
    { wch: 16 }, // Created date
    { wch: 16 }, // Updated date
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Accounts');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbout);
}

/**
 * Transforms a Contact model into an export row matching the 18-column contact specification.
 */
export function mapContactToExportRow(contact: import('../../../types/contact').ContactListItem): ExportRowData {
  return {
    'Name*': contact.name,
    'Company*': contact.companyName || '',
    'Target role': contact.targetRole || '',
    'Persona category': contact.personaCategory || '',
    'Role keyword': contact.roleKeyword || '',
    'Tier*': contact.tier,
    'LinkedIn search name': contact.linkedinSearchName || '',
    'LinkedIn profile URL': contact.linkedinProfileUrl || '',
    Email: contact.email || '',
    Phone: contact.phoneNo || '',
    'Target angle': contact.targetAngle || '',
    Status: contact.status,
    'Next step': contact.nextStep || '',
    'Owner username': contact.ownerName || '',
    'Relationship status': contact.relationshipStatus,
    Closed: contact.isClosed ? 'Yes' : 'No',
    Note: contact.note || '',
    Remark: contact.remark || '',
  };
}

/**
 * Generates CSV string for contacts with UTF-8 BOM and formula injection protection.
 */
export async function buildContactsCsv(
  contacts: import('../../../types/contact').ContactListItem[]
): Promise<string> {
  const { CONTACT_COLUMNS } = await import('../constants/contactColumns');
  const headers = CONTACT_COLUMNS.map((c) => c.header);
  const rows = contacts.map((c) => mapContactToExportRow(c));

  const csvRows: string[] = [];
  csvRows.push(headers.map((h) => sanitizeCsvCellValue(h)).join(','));

  rows.forEach((row) => {
    const line = headers.map((h) => sanitizeCsvCellValue(row[h] || '')).join(',');
    csvRows.push(line);
  });

  // UTF-8 Byte Order Mark (\uFEFF)
  return '\uFEFF' + csvRows.join('\r\n');
}

/**
 * Generates XLSX binary buffer for contacts with string types.
 */
export async function buildContactsXlsx(
  contacts: import('../../../types/contact').ContactListItem[]
): Promise<Uint8Array> {
  const XLSX = await import('xlsx');
  const { CONTACT_COLUMNS } = await import('../constants/contactColumns');
  const headers = CONTACT_COLUMNS.map((c) => c.header);
  const rows = contacts.map((c) => mapContactToExportRow(c));

  const dataAoa: (string | number)[][] = [headers];
  rows.forEach((row) => {
    dataAoa.push(headers.map((h) => row[h] || ''));
  });

  const ws = XLSX.utils.aoa_to_sheet(dataAoa);

  // Force all cells to string type
  if (ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (cell && cell.v !== undefined && cell.v !== null) {
          cell.t = 's';
          cell.v = String(cell.v);
        }
      }
    }
  }

  ws['!cols'] = [
    { wch: 24 }, // Name*
    { wch: 24 }, // Company*
    { wch: 24 }, // Target role
    { wch: 20 }, // Persona category
    { wch: 20 }, // Role keyword
    { wch: 14 }, // Tier*
    { wch: 22 }, // LinkedIn search name
    { wch: 32 }, // LinkedIn profile URL
    { wch: 28 }, // Email
    { wch: 18 }, // Phone
    { wch: 35 }, // Target angle
    { wch: 14 }, // Status
    { wch: 35 }, // Next step
    { wch: 20 }, // Owner username
    { wch: 20 }, // Relationship status
    { wch: 12 }, // Closed
    { wch: 35 }, // Note
    { wch: 35 }, // Remark
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contacts');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbout);
}

