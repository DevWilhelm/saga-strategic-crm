import type {
  AccountImportRowPayload,
  BusinessLine,
  Tier,
  DealSide,
  AccountStatus,
} from '../../../types/account';
import type { AccountLookups } from '../../../types/lookup';
import type { CurrentUser } from '../../../types/user';
import { ACCOUNT_IMPORT_COLUMNS } from '../constants/accountColumns';
import { analyzeHeaders, type HeaderAnalysisResult } from './headerNormalization';
import type { ValidatedImportRow, RowValidationError } from '../types';
import { downloadArrayBuffer } from './downloadHelper';

/**
 * Normalizes Tier values accepting:
 * "Tier 1", "TIER_1", "T1", "1" -> "TIER_1"
 */
export function normalizeTier(val: string): Tier | null {
  const clean = val.trim().toUpperCase().replace(/[\s_]+/g, '');
  if (clean === 'TIER1' || clean === 'T1' || clean === '1') return 'TIER_1';
  if (clean === 'TIER2' || clean === 'T2' || clean === '2') return 'TIER_2';
  if (clean === 'TIER3' || clean === 'T3' || clean === '3') return 'TIER_3';
  return null;
}

/**
 * Normalizes Deal Side values accepting:
 * "Buy-Side", "BUY_SIDE", "Buy side", "Buy" -> "BUY_SIDE"
 * "Sell-Side", "SELL_SIDE", "Sell side", "Sell" -> "SELL_SIDE"
 */
export function normalizeDealSide(val: string): DealSide | null {
  const clean = val.trim().toUpperCase().replace(/[\s_-]+/g, '');
  if (clean === 'BUYSIDE' || clean === 'BUY') return 'BUY_SIDE';
  if (clean === 'SELLSIDE' || clean === 'SELL') return 'SELL_SIDE';
  return null;
}

/**
 * Normalizes Business Line values matching:
 * "Healthcare", "Financial Advisory", "Networking & Partnerships"
 */
export function normalizeBusinessLine(val: string): BusinessLine | null {
  const clean = val.trim().toLowerCase().replace(/[\s_&-]+/g, '');
  if (clean.includes('health')) return 'Healthcare';
  if (clean.includes('financial') || clean.includes('advisory')) return 'Financial Advisory';
  if (clean.includes('network') || clean.includes('partner')) return 'Networking & Partnerships';
  return null;
}

/**
 * Normalizes Account Status values accepting:
 * "Active", "ACTIVE", "Inactive", "INACTIVE" (blank defaults to ACTIVE)
 */
export function normalizeStatus(val: string): AccountStatus | null {
  if (!val || !val.trim()) return 'ACTIVE';
  const clean = val.trim().toUpperCase();
  if (clean === 'ACTIVE') return 'ACTIVE';
  if (clean === 'INACTIVE') return 'INACTIVE';
  return null;
}

/**
 * Validates a website URL (must start with http:// or https://)
 */
export function isValidWebsiteUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface ClientValidationResult {
  headerAnalysis: HeaderAnalysisResult;
  rows: ValidatedImportRow<AccountImportRowPayload>[];
  counts: {
    total: number;
    valid: number;
    errors: number;
    duplicates: number;
  };
}

/**
 * Client-side validator for parsed spreadsheet rows.
 * Enforces:
 * 1. Missing required headers check
 * 2. Lookup matching by name/username (case-insensitive & trimmed)
 * 3. MEMBER rule: owner must be themselves
 * 4. Duplicate name checks (in CRM & in-batch)
 */
export function validateImportRows(
  rawHeaders: string[],
  rawRows: Record<string, string>[],
  lookups: AccountLookups | undefined,
  currentUser: CurrentUser | null | undefined,
  existingAccountNames: Set<string>
): ClientValidationResult {
  const headerAnalysis = analyzeHeaders(rawHeaders, ACCOUNT_IMPORT_COLUMNS);
  const rows: ValidatedImportRow<AccountImportRowPayload>[] = [];

  const seenInBatchNames = new Set<string>();

  rawRows.forEach((rowObj, index) => {
    const rowNumber = index + 2; // Row 1 is header
    const errors: RowValidationError[] = [];

    // Helper to get raw cell value by ColumnDefinition key
    const getVal = (colKey: string): string => {
      for (const [rawHeader, colDef] of headerAnalysis.matchedColumns.entries()) {
        if (colDef.key === colKey) {
          return (rowObj[rawHeader] || '').trim();
        }
      }
      return '';
    };

    // 1. Name validation
    const rawName = getVal('name');
    if (!rawName) {
      errors.push({ field: 'name', message: 'Account name is required' });
    } else if (rawName.length > 200) {
      errors.push({ field: 'name', message: 'Account name must not exceed 200 characters' });
    }

    // 2. Business line validation
    const rawBusinessLine = getVal('businessLine');
    const businessLine = normalizeBusinessLine(rawBusinessLine);
    if (!rawBusinessLine) {
      errors.push({ field: 'businessLine', message: 'Business line is required' });
    } else if (!businessLine) {
      errors.push({
        field: 'businessLine',
        message: 'Must be Healthcare, Financial Advisory, or Networking & Partnerships',
      });
    }

    // 3. Category validation (lookup match by name)
    const rawCategory = getVal('category');
    let matchedCategoryId = '';
    if (!rawCategory) {
      errors.push({ field: 'category', message: 'Category is required' });
    } else {
      const match = lookups?.categories.find(
        (c) => c.name.trim().toLowerCase() === rawCategory.toLowerCase()
      );
      if (match) {
        matchedCategoryId = match.id;
      } else {
        errors.push({
          field: 'category',
          message: `Category "${rawCategory}" not found in system lookups`,
        });
      }
    }

    // 4. Sub-category validation (must belong to matched category)
    const rawSubCategory = getVal('subCategory');
    let matchedSubCategoryId: string | null = null;
    if (rawSubCategory) {
      const match = lookups?.subCategories.find(
        (s) => s.name.trim().toLowerCase() === rawSubCategory.toLowerCase()
      );
      if (match) {
        if (matchedCategoryId && match.categoryId !== matchedCategoryId) {
          errors.push({
            field: 'subCategory',
            message: `Sub-category "${rawSubCategory}" does not belong to the selected Category`,
          });
        } else {
          matchedSubCategoryId = match.id;
        }
      } else {
        errors.push({
          field: 'subCategory',
          message: `Sub-category "${rawSubCategory}" not found in system lookups`,
        });
      }
    }

    // 5. Service validation (lookup match by name)
    const rawService = getVal('service');
    let matchedServiceId = '';
    if (!rawService) {
      errors.push({ field: 'service', message: 'Service is required' });
    } else {
      const match = lookups?.services.find(
        (s) => s.name.trim().toLowerCase() === rawService.toLowerCase()
      );
      if (match) {
        matchedServiceId = match.id;
      } else {
        errors.push({
          field: 'service',
          message: `Service "${rawService}" not found in system lookups`,
        });
      }
    }

    // 6. Tier validation
    const rawTier = getVal('tier');
    const tier = normalizeTier(rawTier);
    if (!rawTier) {
      errors.push({ field: 'tier', message: 'Tier is required' });
    } else if (!tier) {
      errors.push({
        field: 'tier',
        message: 'Must be Tier 1, Tier 2, or Tier 3 (also accepts TIER_1, T1, 1)',
      });
    }

    // 7. Owner validation (MEMBER rule: owner must be themselves; blank = themselves)
    const rawOwner = getVal('ownerUsername');
    let matchedOwnerId = currentUser?.id || '';

    if (rawOwner) {
      const cleanOwner = rawOwner.toLowerCase();
      const matchedOwner = lookups?.owners.find(
        (o) =>
          (o.username && o.username.toLowerCase() === cleanOwner) ||
          o.name.toLowerCase() === cleanOwner ||
          o.code.toLowerCase() === cleanOwner
      );

      if (!matchedOwner) {
        errors.push({
          field: 'ownerUsername',
          message: `Owner "${rawOwner}" not found in active users`,
        });
      } else {
        // Enforce MEMBER owner rule
        if (currentUser?.role === 'MEMBER' && matchedOwner.id !== currentUser.id) {
          errors.push({
            field: 'ownerUsername',
            message: 'Only an admin can assign other owners',
          });
        } else {
          matchedOwnerId = matchedOwner.id;
        }
      }
    } else {
      // Blank defaults to importing user
      matchedOwnerId = currentUser?.id || '';
    }

    // 8. Deal side validation (optional)
    const rawDealSide = getVal('dealSide');
    let dealSide: DealSide | null = null;
    if (rawDealSide) {
      dealSide = normalizeDealSide(rawDealSide);
      if (!dealSide) {
        errors.push({
          field: 'dealSide',
          message: 'Must be Buy-Side or Sell-Side (also accepts BUY_SIDE, Buy side)',
        });
      }
    }

    // 9. Country (optional)
    const rawCountry = getVal('country');

    // 10. Website URL (optional)
    const rawWebsite = getVal('websiteUrl');
    if (rawWebsite && !isValidWebsiteUrl(rawWebsite)) {
      errors.push({
        field: 'websiteUrl',
        message: 'Website must be a valid HTTP or HTTPS URL',
      });
    }

    // 11. Source reference (optional)
    const rawSource = getVal('sourceRef');

    // 12. Note (optional, max 2000)
    const rawNote = getVal('note');
    if (rawNote && rawNote.length > 2000) {
      errors.push({ field: 'note', message: 'Note must not exceed 2000 characters' });
    }

    // 13. Status (optional, defaults to ACTIVE)
    const rawStatus = getVal('status');
    const status = normalizeStatus(rawStatus);
    if (rawStatus && !status) {
      errors.push({ field: 'status', message: 'Status must be Active or Inactive' });
    }

    // -------------------------------------------------------------
    // Duplicate Detection
    // -------------------------------------------------------------
    let isDuplicate = false;
    let duplicateReason: string | undefined;

    if (rawName) {
      const lowerName = rawName.toLowerCase();
      if (seenInBatchNames.has(lowerName)) {
        isDuplicate = true;
        duplicateReason = 'Duplicate account name in file';
      } else if (existingAccountNames.has(lowerName)) {
        isDuplicate = true;
        duplicateReason = 'Account with this name already exists in CRM';
      }
      seenInBatchNames.add(lowerName);
    }

    let rowStatus: 'VALID' | 'ERROR' | 'DUPLICATE' = 'VALID';
    if (errors.length > 0) {
      rowStatus = 'ERROR';
    } else if (isDuplicate) {
      rowStatus = 'DUPLICATE';
    }

    const payloadData: AccountImportRowPayload = {
      rowNumber,
      name: rawName,
      businessLine: (businessLine as BusinessLine) || 'Healthcare',
      categoryId: matchedCategoryId,
      subCategoryId: matchedSubCategoryId,
      serviceId: matchedServiceId,
      tier: (tier as Tier) || 'TIER_1',
      ownerId: matchedOwnerId,
      dealSide,
      country: rawCountry || null,
      websiteUrl: rawWebsite || null,
      sourceRef: rawSource || null,
      note: rawNote || null,
      status: (status as AccountStatus) || 'ACTIVE',
    };

    rows.push({
      rowNumber,
      status: rowStatus,
      data: payloadData,
      raw: rowObj,
      errors,
      duplicateReason,
    });
  });

  const validCount = rows.filter((r) => r.status === 'VALID').length;
  const errorsCount = rows.filter((r) => r.status === 'ERROR').length;
  const duplicatesCount = rows.filter((r) => r.status === 'DUPLICATE').length;

  return {
    headerAnalysis,
    rows,
    counts: {
      total: rows.length,
      valid: validCount,
      errors: errorsCount,
      duplicates: duplicatesCount,
    },
  };
}

/**
 * Builds and downloads an Excel error report (.xlsx):
 * Includes original rows plus "Row", "Status", and "Error" columns.
 */
export async function downloadErrorReport(
  rawHeaders: string[],
  rows: ValidatedImportRow<AccountImportRowPayload>[]
): Promise<void> {
  const XLSX = await import('xlsx');

  const reportHeaders = ['Row', 'Status', 'Error', ...rawHeaders];
  const reportAoa: string[][] = [reportHeaders];

  rows.forEach((r) => {
    const errorText = r.errors.map((e) => `${e.field}: ${e.message}`).join('; ') || r.duplicateReason || '';
    const rowValues = rawHeaders.map((h) => r.raw[h] || '');
    reportAoa.push([String(r.rowNumber), r.status, errorText, ...rowValues]);
  });

  const ws = XLSX.utils.aoa_to_sheet(reportAoa);
  ws['!cols'] = [
    { wch: 8 },  // Row
    { wch: 14 }, // Status
    { wch: 45 }, // Error
    ...rawHeaders.map(() => ({ wch: 22 })),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Error Report');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadArrayBuffer(
    wbout,
    `accounts-import-error-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}
