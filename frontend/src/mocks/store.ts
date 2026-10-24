import type { Account, AccountNote, AccountDeal, BusinessLine, Tier, DealSide, AccountStatus } from '../types/account';
import type { Category, SubCategory, Service } from '../types/lookup';
import type { User } from '../types/user';
import type { AccountContact, AccountFollowUp } from '../types/contact';
import { ROLE_PRESET_PERMISSIONS } from '../constants/users';

// ==========================================
// 1. LOOKUP DATA
// ==========================================

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-hosp', name: 'Hospitals / Providers' },
  // TODO: placeholder categories pending backend confirmation
  { id: 'cat-pharma', name: 'Pharmaceuticals & Biotech' },
  { id: 'cat-pe', name: 'Private Equity & Funds' },
  { id: 'cat-medtech', name: 'MedTech & Devices' },
];

export const MOCK_SUB_CATEGORIES: SubCategory[] = [
  { id: 'sub-listed', categoryId: 'cat-hosp', name: 'Listed group' },
  // TODO: placeholder sub-categories pending backend confirmation
  { id: 'sub-single', categoryId: 'cat-hosp', name: 'Single hospital system' },
  { id: 'sub-specialty', categoryId: 'cat-hosp', name: 'Specialty medical center' },
  { id: 'sub-pharma-innovator', categoryId: 'cat-pharma', name: 'Innovator pharma' },
  { id: 'sub-pharma-generic', categoryId: 'cat-pharma', name: 'Generic manufacturer' },
  { id: 'sub-pe-growth', categoryId: 'cat-pe', name: 'Growth equity' },
  { id: 'sub-pe-buyout', categoryId: 'cat-pe', name: 'Buyout / control fund' },
  { id: 'sub-med-diagnostic', categoryId: 'cat-medtech', name: 'Diagnostic imaging' },
  { id: 'sub-med-implants', categoryId: 'cat-medtech', name: 'Surgical & implants' },
];

// TODO: 4 placeholder services pending backend confirmation
export const MOCK_SERVICES: Service[] = [
  { id: 'srv-ma', name: 'M&A Advisory' },
  { id: 'srv-cdd', name: 'Commercial Due Diligence' },
  { id: 'srv-partnerships', name: 'Strategic Partnerships' },
  { id: 'srv-market-entry', name: 'Cross-Border Market Entry' },
];

/**
 * Seed Users with roles, initials codes, and granular permissions.
 * Passwords exist exclusively in request DTOs and are simulated in an internal map.
 */
export const MOCK_USERS: User[] = [
  {
    id: 'usr-super',
    name: 'Alex Mercer',
    code: 'AM',
    username: 'alex.mercer',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    email: 'alex.mercer@crm.saga.com',
    phone: '+66 80 123 4567',
    photoUrl: null,
    managerId: null,
    managerName: null,
    permissions: [...ROLE_PRESET_PERMISSIONS.SUPER_ADMIN],
    createdDate: '2026-05-01',
    updatedDate: '2026-10-18',
  },
  {
    id: 'usr-ploy',
    name: 'Ploy S.',
    code: 'PS',
    username: 'ploy.s',
    role: 'ADMIN',
    status: 'ACTIVE',
    email: 'ploy.s@saga-consulting.com',
    phone: '+66 81 234 5678',
    photoUrl: null,
    managerId: null,
    managerName: null,
    permissions: [...ROLE_PRESET_PERMISSIONS.ADMIN],
    createdDate: '2026-06-01',
    updatedDate: '2026-10-14',
  },
  {
    id: 'usr-1',
    name: 'Danai K.',
    code: 'DK',
    username: 'danai.k',
    role: 'MEMBER',
    status: 'ACTIVE',
    email: 'danai.k@saga-consulting.com',
    phone: '+66 82 345 6789',
    photoUrl: null,
    managerId: 'usr-ploy',
    managerName: 'Ploy S.',
    permissions: [...ROLE_PRESET_PERMISSIONS.MEMBER],
    createdDate: '2026-06-01',
    updatedDate: '2026-10-12',
  },
  {
    id: 'usr-2',
    name: 'Michael Chang',
    code: 'MC',
    username: 'michael.c',
    role: 'MEMBER',
    status: 'ACTIVE',
    email: 'michael.c@saga-consulting.com',
    phone: '+66 83 456 7890',
    photoUrl: null,
    managerId: 'usr-ploy',
    managerName: 'Ploy S.',
    permissions: [...ROLE_PRESET_PERMISSIONS.MEMBER],
    createdDate: '2026-06-01',
    updatedDate: '2026-10-11',
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    code: 'ER',
    username: 'elena.r',
    role: 'MEMBER',
    status: 'ACTIVE',
    email: 'elena.r@saga-consulting.com',
    phone: '+66 84 567 8901',
    photoUrl: null,
    managerId: 'usr-ploy',
    managerName: 'Ploy S.',
    permissions: [...ROLE_PRESET_PERMISSIONS.MEMBER],
    createdDate: '2026-06-01',
    updatedDate: '2026-10-09',
  },
  {
    id: 'usr-4',
    name: 'David Adeleke',
    code: 'DA',
    username: 'david.a',
    role: 'MEMBER',
    status: 'ACTIVE',
    email: 'david.a@saga-consulting.com',
    phone: null,
    photoUrl: null,
    managerId: 'usr-ploy',
    managerName: 'Ploy S.',
    permissions: [...ROLE_PRESET_PERMISSIONS.MEMBER],
    createdDate: '2026-06-01',
    updatedDate: '2026-10-05',
  },
  {
    id: 'usr-inactive',
    name: 'Alex Thorne',
    code: 'AT',
    username: 'alex.t',
    role: 'MEMBER',
    status: 'INACTIVE',
    email: 'alex.t@saga-consulting.com',
    phone: null,
    photoUrl: null,
    managerId: 'usr-ploy',
    managerName: 'Ploy S.',
    permissions: [...ROLE_PRESET_PERMISSIONS.MEMBER],
    createdDate: '2026-05-15',
    updatedDate: '2026-09-30',
  },
];

export const MOCK_COUNTRIES: string[] = [
  'Thailand',
  'Singapore',
  'United States',
  'United Kingdom',
  'Switzerland',
  'Germany',
  'Japan',
  'France',
  'Australia',
  'Canada',
];

export const MOCK_BUSINESS_LINES: BusinessLine[] = [
  'Healthcare',
  'Financial Advisory',
  'Networking & Partnerships',
];

export const MOCK_TIERS: Tier[] = ['TIER_1', 'TIER_2', 'TIER_3'];
export const MOCK_DEAL_SIDES: DealSide[] = ['BUY_SIDE', 'SELL_SIDE'];
export const MOCK_STATUSES: AccountStatus[] = ['ACTIVE', 'INACTIVE'];

// Safe date helpers
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getRelativeDateStr = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return formatDate(d);
};

// ==========================================
// 2. SEED ACCOUNTS (EXACTLY 134 ACCOUNTS)
// ==========================================

const RAW_ADDITIONAL_COMPANY_NAMES = [
  'Apex Capital Partners', 'Bluecrest Life Sciences', 'Aura Health Holdings', 'BioNexus Genesis',
  'Meridian Diagnostics', 'Veritas MedTech', 'Summit Strategic Alpha', 'Zenith Health Systems',
  'Elysium Biopharma', 'Vanguard Healthcare Trust', 'Pinnacle Therapeutics', 'Novus Health Group',
  'Clarion Surgical Innovations', 'Ascend Capital Solutions', 'Starlight Clinical Care',
  'Sovereign Advisory Network', 'Helios Medical Consortium', 'Polaris Molecular Labs',
  'Aegis Healthcare Syndicate', 'Crestview Oncology Alliance', 'Titan BioVentures',
  'Equinox Life Partners', 'Krypton Pharma Solutions', 'Solstice Hospital Trust',
  'Valence MedTech Advisory', 'Caelum Healthcare Holdings', 'Radiant Biologics',
  'Centurion Global Advisory', 'Halcyon Clinic Registry', 'Beacon Health Group',
  'Strata Capital Management', 'Nexus MedTech Solutions', 'Proxima Clinical Network',
  'Arcadia Healthcare Partners', 'Triton Surgical Systems', 'Zephyr Global Advisory',
  'Altus BioPharma', 'Fortis Medical Dynamics', 'Astraean Capital Group', 'Verve Diagnostics',
  'Oasis Care Network', 'Chrono Therapeutics', 'Vector Strategic Partners', 'Aura Biologics Group',
  'Horizon Medical Registry', 'Omni Health Alliances', 'Solaria Capital Advisory',
  'Astra Health Ventures', 'Quantum Life Sciences', 'Kestrel Healthcare Advisors',
  'Sierra Clinical Network', 'Borealis Pharma Solutions', 'Eminence Health Group',
  'Vanguard Strategic Trust', 'Aethel Clinical Registry', 'Lucid Bioventures',
  'Aegis Medical Holdings', 'Paladin Capital Partners', 'Cygnus Health Dynamics',
  'Astral Therapeutics Group', 'Vesta Strategic Network', 'Olympia Care Alliances',
  'Kestrel BioVentures', 'Altair Surgical Consortium', 'Solis Healthcare Network',
  'Antares Capital Advisors', 'Echo Diagnostics', 'Lyra Life Partners',
  'Novant Medical Syndicate', 'Cypress Health Ventures', 'Polaris Capital Network',
  'Serenade Biologics', 'Venture Health Alliances', 'Aura Therapeutics Group',
  'Epsilon MedTech Systems', 'Kinetix Clinical Trust', 'Orion Strategic Registry',
  'Zephyr Care Holdings', 'Vertex Advisory Network', 'Pinnacle Health Partners',
  'Crestline Life Sciences', 'Halcyon Medical Systems', 'Valence Strategic Trust',
  'Astrum Care Consortium', 'Omnia Healthcare Advisory', 'Solaria Biopharma Group',
  'Altair Medical Solutions', 'Starlight Strategic Alpha', 'BioNova Clinical Group',
  'Genesis Health Dynamics', 'Vanguard Clinical Partners', 'Apex BioVentures',
  'Clarion Life Sciences', 'Meridian Health Alliance', 'Zenith Capital Solutions',
  'Solstice MedTech Network', 'Centurion Medical Group', 'Beacon Clinical Solutions',
  'Strata Healthcare Trust', 'Nexus Strategic Advisors', 'Arcadia Biologics',
  'Proxima Health Partners', 'Triton Medical Syndicate', 'Zephyr Therapeutics',
  'Altus Strategic Network', 'Fortis BioSolutions', 'Aura Care Alliances',
  'Verve Healthcare Partners', 'Oasis Strategic Advisory', 'Chrono Clinical Systems',
  'Vector BioVentures', 'Solaria Health Alliances', 'Astraean Life Sciences',
  'Kestrel Strategic Trust', 'Sierra MedTech Network', 'Borealis Health Advisory',
  'Eminence Clinical Solutions', 'Aethel BioPharma', 'Paladin Health Alliances',
  'Astral Strategic Advisory', 'Vesta Medical Holdings', 'Olympia Life Sciences',
  'Altair Care Group', 'Antares Health Dynamics', 'Echo Strategic Partners',
  'Lyra Clinical Trust', 'Novant BioVentures', 'Cypress Strategic Alpha',
];

const INITIAL_ACCOUNTS: Account[] = [
  // 1. Siam Care (TIER_1) - Ploy S., 3 contacts, 5 notes, 1 deal
  {
    id: 'acc-001',
    name: 'Siam Care',
    businessLine: 'Healthcare',
    country: 'Thailand',
    websiteUrl: 'https://siamcare.example.com',
    categoryId: 'cat-hosp',
    subCategoryId: 'sub-listed',
    tier: 'TIER_1',
    ownerId: 'usr-ploy',
    status: 'ACTIVE',
    dealSide: 'BUY_SIDE',
    serviceId: 'srv-partnerships',
    sourceRef: 'APAC Healthcare Leadership Summit 2026',
    note: 'Premier private hospital network in Southeast Asia exploring digital health and cross-border M&A partnerships.',
    createdBy: 'usr-ploy',
    createdDate: '2026-08-15',
    updatedBy: 'usr-ploy',
    updatedDate: '2026-10-14',
  },
  // 2. Northwind Pharma (TIER_1)
  {
    id: 'acc-002',
    name: 'Northwind Pharma',
    businessLine: 'Healthcare',
    country: 'United States',
    websiteUrl: 'https://northwindpharma.example.com',
    categoryId: 'cat-pharma',
    subCategoryId: 'sub-pharma-innovator',
    tier: 'TIER_1',
    ownerId: 'usr-1',
    status: 'ACTIVE',
    dealSide: 'SELL_SIDE',
    serviceId: 'srv-ma',
    sourceRef: 'Direct Partner Outreach',
    note: 'Specialty oncology formulation manufacturer preparing corporate carve-out.',
    createdBy: 'usr-1',
    createdDate: '2026-07-20',
    updatedBy: 'usr-1',
    updatedDate: '2026-10-12',
  },
  // 3. Harbor Capital (TIER_2)
  {
    id: 'acc-003',
    name: 'Harbor Capital',
    businessLine: 'Financial Advisory',
    country: 'United Kingdom',
    websiteUrl: 'https://harborcap.example.com',
    categoryId: 'cat-pe',
    subCategoryId: 'sub-pe-buyout',
    tier: 'TIER_2',
    ownerId: 'usr-2',
    status: 'ACTIVE',
    dealSide: 'BUY_SIDE',
    serviceId: 'srv-cdd',
    sourceRef: 'London PE Syndicate',
    note: 'Mid-market private equity sponsor deploying capital across pan-European diagnostic clinics.',
    createdBy: 'usr-2',
    createdDate: '2026-08-01',
    updatedBy: 'usr-2',
    updatedDate: '2026-10-11',
  },
  // 4. Orion Labs (TIER_2)
  {
    id: 'acc-004',
    name: 'Orion Labs',
    businessLine: 'Healthcare',
    country: 'Switzerland',
    websiteUrl: 'https://orionlabs.example.com',
    categoryId: 'cat-medtech',
    subCategoryId: 'sub-med-diagnostic',
    tier: 'TIER_2',
    ownerId: 'usr-3',
    status: 'ACTIVE',
    dealSide: 'SELL_SIDE',
    serviceId: 'srv-market-entry',
    sourceRef: 'Zurich MedTech Innovation Day',
    note: 'Next-gen molecular diagnostics provider seeking Asian joint venture distribution partners.',
    createdBy: 'usr-3',
    createdDate: '2026-08-10',
    updatedBy: 'usr-3',
    updatedDate: '2026-10-09',
  },
  // 5. Lumen Partners (TIER_3)
  {
    id: 'acc-005',
    name: 'Lumen Partners',
    businessLine: 'Networking & Partnerships',
    country: 'Singapore',
    websiteUrl: 'https://lumenpartners.example.com',
    categoryId: 'cat-pe',
    subCategoryId: 'sub-pe-growth',
    tier: 'TIER_3',
    ownerId: 'usr-4',
    status: 'ACTIVE',
    dealSide: 'BUY_SIDE',
    serviceId: 'srv-partnerships',
    sourceRef: 'APAC Venture Dialogue',
    note: 'Regional strategic advisory syndicate connecting family offices with healthcare operators.',
    createdBy: 'usr-4',
    createdDate: '2026-09-01',
    updatedBy: 'usr-4',
    updatedDate: '2026-10-05',
  },
];

// Seed remaining 129 accounts to reach exactly 134 accounts
(() => {
  const ownerIds = ['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-ploy'];
  const categories = ['cat-hosp', 'cat-pharma', 'cat-pe', 'cat-medtech'];
  const services = ['srv-ma', 'srv-cdd', 'srv-partnerships', 'srv-market-entry'];
  const lines: BusinessLine[] = ['Healthcare', 'Financial Advisory', 'Networking & Partnerships'];
  const countries = ['United States', 'United Kingdom', 'Germany', 'Singapore', 'France', 'Japan', 'Switzerland', 'Canada', 'Australia', 'Thailand'];
  
  // Distribution target: 27 Tier 1, 36 Tier 2, 71 Tier 3 (matching dashboard chart)
  // Currently: 2 T1, 2 T2, 1 T3 -> Need: 25 T1, 34 T2, 70 T3
  let t1Needed = 25;
  let t2Needed = 34;

  for (let i = 0; i < 129; i++) {
    const idNum = i + 6;
    const paddedId = String(idNum).padStart(3, '0');
    const name = RAW_ADDITIONAL_COMPANY_NAMES[i % RAW_ADDITIONAL_COMPANY_NAMES.length] + (i >= RAW_ADDITIONAL_COMPANY_NAMES.length ? ` ${Math.floor(i / RAW_ADDITIONAL_COMPANY_NAMES.length) + 1}` : '');
    
    let tier: Tier = 'TIER_3';
    if (t1Needed > 0) {
      tier = 'TIER_1';
      t1Needed--;
    } else if (t2Needed > 0) {
      tier = 'TIER_2';
      t2Needed--;
    }

    const catId = categories[i % categories.length];
    const subCat = MOCK_SUB_CATEGORIES.find((s) => s.categoryId === catId);
    const ownerId = ownerIds[i % ownerIds.length];
    const country = countries[i % countries.length];
    const businessLine = lines[i % lines.length];
    const serviceId = services[i % services.length];
    const dealSide: DealSide = i % 2 === 0 ? 'BUY_SIDE' : 'SELL_SIDE';
    const status: AccountStatus = i % 15 === 0 ? 'INACTIVE' : 'ACTIVE';
    
    const daysAgo = (i % 30) + 1;
    const updatedDate = getRelativeDateStr(-daysAgo);
    const createdDate = getRelativeDateStr(-daysAgo - 45);

    INITIAL_ACCOUNTS.push({
      id: `acc-${paddedId}`,
      name,
      businessLine,
      country,
      websiteUrl: `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.example.com`,
      categoryId: catId,
      subCategoryId: subCat?.id ?? null,
      tier,
      ownerId,
      status,
      dealSide,
      serviceId,
      sourceRef: `Executive Reference #${idNum}`,
      note: `Strategic profile for ${name} operating across ${country}.`,
      createdBy: ownerId,
      createdDate,
      updatedBy: ownerId,
      updatedDate,
    });
  }
})();

// ==========================================
// 3. SEED CONTACTS & FOLLOW-UPS
// ==========================================

export const INITIAL_CONTACTS: AccountContact[] = [
  // Siam Care contacts (3 contacts)
  {
    id: 'cnt-001',
    companyId: 'acc-001',
    name: 'Dr. Somchai Prasert',
    targetRole: 'Chief Medical Officer',
    tier: 'TIER_1',
    relationshipStatus: 'HOT',
    nextStep: 'Finalize terms for telehealth pilot across 3 flagship hospitals',
    nextFollowUpDate: getRelativeDateStr(2),
    email: 'somchai.p@siamcare.th',
    isClosed: false,
  },
  {
    id: 'cnt-002',
    companyId: 'acc-001',
    name: 'Anong Kittisuk',
    targetRole: 'VP Strategic Planning & M&A',
    tier: 'TIER_1',
    relationshipStatus: 'WARM',
    nextStep: 'Deliver revised financial synergies model',
    nextFollowUpDate: getRelativeDateStr(5),
    email: 'anong.k@siamcare.th',
    isClosed: false,
  },
  {
    id: 'cnt-003',
    companyId: 'acc-001',
    name: 'Thanawat Ratanaporn',
    targetRole: 'Director of Clinical Operations',
    tier: 'TIER_2',
    relationshipStatus: 'WARM',
    nextStep: 'Coordinate on-site hospital walkthrough with clinical leads',
    nextFollowUpDate: getRelativeDateStr(9),
    email: 'thanawat.r@siamcare.th',
    isClosed: false,
  },

  // Northwind Pharma contacts
  {
    id: 'cnt-004',
    companyId: 'acc-002',
    name: 'Dr. Robert Harrison',
    targetRole: 'SVP Global Regulatory Affairs',
    tier: 'TIER_1',
    relationshipStatus: 'HOT',
    nextStep: 'Review FDA Phase III clearance timeline',
    nextFollowUpDate: getRelativeDateStr(-2), // overdue
    email: 'r.harrison@northwindpharma.example.com',
    isClosed: false,
  },
  {
    id: 'cnt-005',
    companyId: 'acc-002',
    name: 'Clara Sterling',
    targetRole: 'Head of Corporate Development',
    tier: 'TIER_1',
    relationshipStatus: 'WARM',
    nextStep: 'Send revised valuation teaser',
    nextFollowUpDate: getRelativeDateStr(0), // today
    email: 'c.sterling@northwindpharma.example.com',
    isClosed: false,
  },

  // Harbor Capital contacts
  {
    id: 'cnt-006',
    companyId: 'acc-003',
    name: 'Alistair Vance',
    targetRole: 'Managing Director, Healthcare Buyouts',
    tier: 'TIER_2',
    relationshipStatus: 'HOT',
    nextStep: 'Host investment committee review call',
    nextFollowUpDate: getRelativeDateStr(3),
    email: 'a.vance@harborcap.example.com',
    isClosed: false,
  },

  // Orion Labs contacts
  {
    id: 'cnt-007',
    companyId: 'acc-004',
    name: 'Dr. Beatrix Meyer',
    targetRole: 'Chief Scientific Officer',
    tier: 'TIER_2',
    relationshipStatus: 'WARM',
    nextStep: 'Share diagnostic assay benchmarking data',
    nextFollowUpDate: getRelativeDateStr(4),
    email: 'b.meyer@orionlabs.example.com',
    isClosed: false,
  },

  // Lumen Partners contacts
  {
    id: 'cnt-008',
    companyId: 'acc-005',
    name: 'Jonathan Lim',
    targetRole: 'Managing Partner',
    tier: 'TIER_3',
    relationshipStatus: 'COLD',
    nextStep: 'Check in on LP syndication progress',
    nextFollowUpDate: getRelativeDateStr(14),
    email: 'j.lim@lumenpartners.example.com',
    isClosed: false,
  },
];

// Generate additional contacts across the accounts
(() => {
  for (let i = 9; i <= 60; i++) {
    const accId = `acc-${String((i % 20) + 1).padStart(3, '0')}`;
    INITIAL_CONTACTS.push({
      id: `cnt-${String(i).padStart(3, '0')}`,
      companyId: accId,
      name: `Executive Contact ${i}`,
      targetRole: i % 3 === 0 ? 'Chief Operating Officer' : i % 2 === 0 ? 'VP Corporate Development' : 'Director of Procurement',
      tier: i % 4 === 0 ? 'TIER_1' : i % 3 === 0 ? 'TIER_2' : 'TIER_3',
      relationshipStatus: i % 3 === 0 ? 'HOT' : i % 2 === 0 ? 'WARM' : 'COLD',
      nextStep: `Coordinate quarterly strategic update with key stakeholders (${i})`,
      nextFollowUpDate: getRelativeDateStr((i % 10) - 2),
      email: `contact${i}@example.com`,
      isClosed: false,
    });
  }
})();

export const INITIAL_FOLLOW_UPS: AccountFollowUp[] = [
  // Siam Care primary next action: "Send revised pilot proposal"
  {
    id: 'flw-001',
    contactId: 'cnt-001',
    dueDate: getRelativeDateStr(2),
    lastContactedDate: getRelativeDateStr(-3),
    action: 'Send revised pilot proposal',
    ownerId: 'usr-ploy',
  },
  {
    id: 'flw-002',
    contactId: 'cnt-002',
    dueDate: getRelativeDateStr(5),
    lastContactedDate: getRelativeDateStr(-2),
    action: 'Deliver updated synergy breakdown model',
    ownerId: 'usr-ploy',
  },
  {
    id: 'flw-003',
    contactId: 'cnt-004',
    dueDate: getRelativeDateStr(-2), // overdue
    lastContactedDate: getRelativeDateStr(-6),
    action: 'Follow up on regulatory validation schedule',
    ownerId: 'usr-1',
  },
  {
    id: 'flw-004',
    contactId: 'cnt-005',
    dueDate: getRelativeDateStr(0), // today
    lastContactedDate: getRelativeDateStr(-4),
    action: 'Confirm attendee list for partner pitch next Thursday',
    ownerId: 'usr-1',
  },
  {
    id: 'flw-005',
    contactId: 'cnt-006',
    dueDate: getRelativeDateStr(3),
    lastContactedDate: getRelativeDateStr(-1),
    action: 'Host bilateral strategy alignment call with managing partner',
    ownerId: 'usr-2',
  },
];

// ==========================================
// 4. SEED NOTES (TODO: PENDING DATA MODEL)
// ==========================================

export const INITIAL_NOTES: AccountNote[] = [
  // 5 notes for Siam Care (newest first)
  {
    id: 'note-001',
    accountId: 'acc-001',
    authorName: 'Ploy S.',
    createdDate: '2026-10-14',
    text: 'Executive steering committee agreed on revised governance structure. Final term sheet pending partner sign-off.',
  },
  {
    id: 'note-002',
    accountId: 'acc-001',
    authorName: 'Ploy S.',
    createdDate: '2026-10-10',
    text: 'Follow-up dinner with Dr. Somchai. Confirmed interest in cross-border pilot across 3 flagship hospitals.',
  },
  {
    id: 'note-003',
    accountId: 'acc-001',
    authorName: 'Ploy S.',
    createdDate: '2026-10-02',
    text: 'Delivered initial commercial feasibility report. Client CFO requested additional sensitivity analysis on foreign currency hedging.',
  },
  {
    id: 'note-004',
    accountId: 'acc-001',
    authorName: 'Ploy S.',
    createdDate: '2026-09-24',
    text: 'Introductory alignment call with Singapore delegation and Siam Care strategic planning leadership.',
  },
  {
    id: 'note-005',
    accountId: 'acc-001',
    authorName: 'Ploy S.',
    createdDate: '2026-09-15',
    text: 'Account originated via APAC Healthcare Leadership Forum referral. High strategic fit for cross-border expansion.',
  },
  // Notes for other accounts
  {
    id: 'note-006',
    accountId: 'acc-002',
    authorName: 'Sarah Jenkins',
    createdDate: '2026-10-12',
    text: 'Management presentation completed. Data room open to pre-qualified bidders.',
  },
  {
    id: 'note-007',
    accountId: 'acc-003',
    authorName: 'Michael Chang',
    createdDate: '2026-10-11',
    text: 'Preliminary investment memo approved by healthcare investment committee.',
  },
];

// ==========================================
// 5. SEED DEALS (TODO: PENDING DATA MODEL)
// ==========================================

export const INITIAL_DEALS: AccountDeal[] = [
  // 1 deal for Siam Care
  {
    id: 'deal-001',
    accountId: 'acc-001',
    name: 'APAC Telehealth & Diagnostic Alliance',
    stage: 'PROPOSAL',
    value: 3500000,
  },
  // Deals for other accounts
  {
    id: 'deal-002',
    accountId: 'acc-002',
    name: 'Oncology Therapeutics Portfolio Carve-out',
    stage: 'DUE_DILIGENCE',
    value: 12500000,
  },
  {
    id: 'deal-003',
    accountId: 'acc-003',
    name: 'European Diagnostic Centers Buyout',
    stage: 'NEGOTIATION',
    value: 45000000,
  },
];

// ==========================================
// 6. SHARED IN-MEMORY MOCK STORE INSTANCE
// ==========================================

/**
 * ARCHITECTURAL NOTE ON PROFILE PHOTOS:
 * In a production deployment, profile photos are uploaded to cloud object storage (e.g., Azure Blob Storage / AWS S3)
 * via multipart/form-data. The database and API responses store and return a CDN/blob URL string (photoUrl),
 * NEVER raw base64 data inside JSON payloads.
 * In this mock environment, uploaded photos are converted to in-memory blob/data URLs to simulate realistic
 * image URL rendering and clean network transfers.
 */
class MockStore {
  accounts: Account[] = [...INITIAL_ACCOUNTS];
  contacts: AccountContact[] = [...INITIAL_CONTACTS];
  followUps: AccountFollowUp[] = [...INITIAL_FOLLOW_UPS];
  notes: AccountNote[] = [...INITIAL_NOTES];
  deals: AccountDeal[] = [...INITIAL_DEALS];

  categories: Category[] = [...MOCK_CATEGORIES];
  subCategories: SubCategory[] = [...MOCK_SUB_CATEGORIES];
  services: Service[] = [...MOCK_SERVICES];
  users: User[] = [...MOCK_USERS];
  countries: string[] = [...MOCK_COUNTRIES];

  // Internal simulated password map for dev mock verification (never returned)
  private passwords: Map<string, string> = new Map([
    ['usr-super', 'Password123!'],
    ['usr-ploy', 'Password123!'],
    ['usr-1', 'Password123!'],
    ['usr-2', 'Password123!'],
    ['usr-3', 'Password123!'],
    ['usr-4', 'Password123!'],
    ['usr-inactive', 'Password123!'],
  ]);

  verifyPassword(userId: string, pass: string): boolean {
    const stored = this.passwords.get(userId) || 'Password123!';
    return stored === pass;
  }

  setPassword(userId: string, newPass: string): void {
    this.passwords.set(userId, newPass);
  }

  getCurrentMockUserId(): string {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem('dev_mock_user_id') || 'usr-ploy';
    }
    return 'usr-ploy';
  }

  setCurrentMockUserId(id: string): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('dev_mock_user_id', id);
    }
  }

  getCurrentMockUser(): User {
    const currentId = this.getCurrentMockUserId();
    return this.users.find((u) => u.id === currentId) || this.users[0];
  }

  reset() {
    this.accounts = [...INITIAL_ACCOUNTS];
    this.contacts = [...INITIAL_CONTACTS];
    this.followUps = [...INITIAL_FOLLOW_UPS];
    this.notes = [...INITIAL_NOTES];
    this.deals = [...INITIAL_DEALS];
    this.users = [...MOCK_USERS];
  }
}

export const mockStore = new MockStore();
