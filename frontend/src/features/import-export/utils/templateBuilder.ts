import type { AccountLookups } from '../../../types/lookup';
import { ACCOUNT_IMPORT_COLUMNS } from '../constants/accountColumns';
import { downloadArrayBuffer } from './downloadHelper';

/**
 * Generates and downloads the official Accounts Import Template:
 * 1. Sheet "Accounts": Header row only with all 13 standard import columns
 * 2. Sheet "Instructions": Overview table with requirements, accepted values, max length, and examples
 * 3. Sheet "Lists": Allowed lookup values for Business Lines, Categories & Sub-categories, Services, Owners, Tiers, Deal Sides, Statuses
 *
 * Uses lazy dynamic import() for SheetJS so the initial page bundle does not grow.
 */
export async function downloadAccountTemplate(
  lookups?: AccountLookups | null,
  currentUsername?: string
): Promise<void> {
  // Lazy dynamic import of SheetJS
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Accounts (Header row only, no sample data)
  // -------------------------------------------------------------
  const accountHeaders = ACCOUNT_IMPORT_COLUMNS.map((col) => col.header);
  const accountsWs = XLSX.utils.aoa_to_sheet([accountHeaders]);

  // Set friendly column widths for Accounts sheet
  accountsWs['!cols'] = [
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
  ];

  XLSX.utils.book_append_sheet(wb, accountsWs, 'Accounts');

  // -------------------------------------------------------------
  // Sheet 2: Instructions
  // -------------------------------------------------------------
  const instructionsAoa: (string | number)[][] = [
    ['ACCOUNTS IMPORT TEMPLATE INSTRUCTIONS'],
    ['Save as .xlsx, keep the header row, maximum 500 rows, one account per row.'],
    [], // Blank line
    ['Column', 'Required', 'Accepted Values', 'Max Length', 'Example'],
  ];

  ACCOUNT_IMPORT_COLUMNS.forEach((col) => {
    instructionsAoa.push([
      col.header,
      col.required ? 'Yes' : 'No',
      col.acceptedValues || '',
      col.maxLength ? String(col.maxLength) : '-',
      col.example || '',
    ]);
  });

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsAoa);
  instructionsWs['!cols'] = [
    { wch: 22 }, // Column
    { wch: 12 }, // Required
    { wch: 48 }, // Accepted Values
    { wch: 14 }, // Max Length
    { wch: 36 }, // Example
  ];

  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

  // -------------------------------------------------------------
  // Sheet 3: Lists (All allowed lookup values)
  // -------------------------------------------------------------
  // Gather lookup data
  const businessLines = [
    'Healthcare',
    'Financial Advisory',
    'Networking & Partnerships',
  ];

  const categories = lookups?.categories || [];
  const subCategories = lookups?.subCategories || [];
  const services = (lookups?.services || []).map((s) => s.name);
  const owners = (lookups?.owners || []).map((o) => ({
    username: o.username || currentUsername || o.code.toLowerCase(),
    name: o.name,
  }));
  const tiers = ['Tier 1', 'Tier 2', 'Tier 3'];
  const dealSides = ['Buy-Side', 'Sell-Side'];
  const statuses = ['Active', 'Inactive'];

  // Build category/sub-category pairing rows
  const catSubPairs: Array<[string, string]> = [];
  categories.forEach((cat) => {
    const subs = subCategories.filter((s) => s.categoryId === cat.id);
    if (subs.length > 0) {
      subs.forEach((sub) => {
        catSubPairs.push([cat.name, sub.name]);
      });
    } else {
      catSubPairs.push([cat.name, '']);
    }
  });

  // Calculate maximum row count for lists
  const maxListRows = Math.max(
    catSubPairs.length,
    businessLines.length,
    services.length,
    owners.length,
    tiers.length,
    dealSides.length,
    statuses.length,
    1
  );

  const listsAoa: string[][] = [];

  // Header row for Lists sheet
  listsAoa.push([
    'Category',
    'Sub-category',
    '',
    'Business Line',
    '',
    'Service',
    '',
    'Owner Username',
    'Owner Full Name',
    '',
    'Tier',
    '',
    'Deal Side',
    '',
    'Status',
  ]);

  for (let i = 0; i < maxListRows; i++) {
    const row: string[] = [
      catSubPairs[i]?.[0] || '',
      catSubPairs[i]?.[1] || '',
      '',
      businessLines[i] || '',
      '',
      services[i] || '',
      '',
      owners[i]?.username || '',
      owners[i]?.name || '',
      '',
      tiers[i] || '',
      '',
      dealSides[i] || '',
      '',
      statuses[i] || '',
    ];
    listsAoa.push(row);
  }

  const listsWs = XLSX.utils.aoa_to_sheet(listsAoa);
  listsWs['!cols'] = [
    { wch: 24 }, // Category
    { wch: 24 }, // Sub-category
    { wch: 4 },  // spacer
    { wch: 26 }, // Business Line
    { wch: 4 },  // spacer
    { wch: 28 }, // Service
    { wch: 4 },  // spacer
    { wch: 20 }, // Owner Username
    { wch: 24 }, // Owner Full Name
    { wch: 4 },  // spacer
    { wch: 14 }, // Tier
    { wch: 4 },  // spacer
    { wch: 16 }, // Deal Side
    { wch: 4 },  // spacer
    { wch: 14 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, listsWs, 'Lists');

  // -------------------------------------------------------------
  // Generate file buffer and trigger download
  // -------------------------------------------------------------
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadArrayBuffer(
    wbout,
    'accounts-import-template.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

/**
 * Generates and downloads the official Contacts Import Template:
 * 1. Sheet "Contacts": Header row with 18 standard columns + 2 sample demonstration rows
 * 2. Sheet "Instructions": Requirements, accepted values, max length, and examples
 * 3. Sheet "Lists": Reference lists for Companies, Tiers, Relationship Statuses, Statuses, and Owners
 */
export async function downloadContactTemplate(options?: {
  companies?: Array<{ name: string }>;
  owners?: Array<{ username?: string | null; name: string }>;
  currentUsername?: string;
  isMember?: boolean;
}): Promise<void> {
  const XLSX = await import('xlsx');
  const { CONTACT_COLUMNS } = await import('../constants/contactColumns');

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Contacts (Header row + 2 sample rows)
  // -------------------------------------------------------------
  const contactHeaders = CONTACT_COLUMNS.map((col) => col.header);

  const sampleRows = [
    [
      'Dr. Somchai Prasert',
      options?.companies?.[0]?.name || 'Siam Care Group',
      'Chief Medical Officer',
      'C-Suite',
      'Medical Officer',
      'TIER_1',
      'somchai-prasert',
      'https://www.linkedin.com/in/somchai-prasert',
      'somchai.p@siamcare.th',
      '+66 2 123 4567',
      'Digital telehealth transformation across 3 flagship hospitals',
      'ACTIVE',
      'Finalize terms for telehealth pilot across 3 flagship hospitals',
      options?.currentUsername || 'ploy.s',
      'HOT',
      'No',
      'Highly receptive to international clinical advisory partnerships.',
      'Key decision-maker for health-tech vendor selection.',
    ],
    [
      'Anong Kittisuk',
      options?.companies?.[0]?.name || 'Siam Care Group',
      'VP Strategic Planning & M&A',
      'M&A / Strategy',
      'Corporate Strategy',
      'TIER_1',
      'anong-kittisuk',
      'https://www.linkedin.com/in/anong-kittisuk',
      'anong.k@siamcare.th',
      '+66 81 987 6543',
      'Commercial due diligence for cross-border hospital acquisitions',
      'ACTIVE',
      'Deliver revised financial synergies model',
      options?.currentUsername || 'ploy.s',
      'WARM',
      'No',
      'Evaluates corporate acquisitions in Vietnam and Indonesia.',
      'Requires quantitative synergy models before board presentations.',
    ],
  ];

  const contactsWs = XLSX.utils.aoa_to_sheet([contactHeaders, ...sampleRows]);

  contactsWs['!cols'] = [
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

  XLSX.utils.book_append_sheet(wb, contactsWs, 'Contacts');

  // -------------------------------------------------------------
  // Sheet 2: Instructions
  // -------------------------------------------------------------
  const instructionsAoa: (string | number)[][] = [
    ['CONTACTS IMPORT TEMPLATE INSTRUCTIONS'],
    ['Save as .xlsx or .csv, keep the header row, maximum 500 rows, one contact per row.'],
    ['Company must match an existing CRM account name exactly (case-insensitive).'],
    ['Owner Username must be an active CRM user. Members may only assign themselves.'],
    [],
    ['Column', 'Required', 'Accepted Values', 'Max Length', 'Example'],
  ];

  CONTACT_COLUMNS.forEach((col) => {
    instructionsAoa.push([
      col.header,
      col.required ? 'Yes' : 'No',
      col.acceptedValues || 'Text',
      col.maxLength || '-',
      col.example || '',
    ]);
  });

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsAoa);
  instructionsWs['!cols'] = [
    { wch: 25 }, // Column
    { wch: 12 }, // Required
    { wch: 50 }, // Accepted Values
    { wch: 14 }, // Max Length
    { wch: 30 }, // Example
  ];

  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

  // -------------------------------------------------------------
  // Sheet 3: Lists (Allowed Lookups & References)
  // -------------------------------------------------------------
  const listsHeader = [
    'Allowed Companies',
    '',
    'Priority Tiers',
    '',
    'Relationship Statuses',
    '',
    'Record Statuses',
    '',
    'Allowed Owner Usernames',
    'Owner Full Name',
  ];

  const listsData: (string | undefined)[][] = [];
  const maxRows = Math.max(
    options?.companies?.length || 0,
    3, // Tiers
    3, // Relationship Statuses
    2, // Statuses
    options?.owners?.length || 1
  );

  const tiers = ['TIER_1', 'TIER_2', 'TIER_3'];
  const relationships = ['HOT', 'WARM', 'COLD'];
  const statuses = ['ACTIVE', 'INACTIVE'];

  // Filter owners if caller is Member
  let allowedOwners = options?.owners || [];
  if (options?.isMember && options.currentUsername) {
    allowedOwners = allowedOwners.filter((o) => o.username === options.currentUsername);
  }

  for (let i = 0; i < maxRows; i++) {
    listsData.push([
      options?.companies?.[i]?.name || '',
      '',
      tiers[i] || '',
      '',
      relationships[i] || '',
      '',
      statuses[i] || '',
      '',
      allowedOwners[i]?.username || '',
      allowedOwners[i]?.name || '',
    ]);
  }

  const listsWs = XLSX.utils.aoa_to_sheet([listsHeader, ...listsData]);
  listsWs['!cols'] = [
    { wch: 28 }, // Company Name
    { wch: 4 },  // spacer
    { wch: 16 }, // Tier
    { wch: 4 },  // spacer
    { wch: 22 }, // Relationship Status
    { wch: 4 },  // spacer
    { wch: 16 }, // Status
    { wch: 4 },  // spacer
    { wch: 24 }, // Owner Username
    { wch: 24 }, // Owner Full Name
  ];

  XLSX.utils.book_append_sheet(wb, listsWs, 'Lists');

  // Generate and download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadArrayBuffer(
    wbout,
    'contacts-import-template.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}
