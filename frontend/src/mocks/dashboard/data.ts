import type {
  Account,
  Contact,
  DashboardKpis,
  FollowUp,
  FollowUpDTO,
  FunnelStage,
  OwnerOption,
} from '../../types/dashboard';

export const MOCK_OWNERS: OwnerOption[] = [
  { id: 'usr-1', name: 'Sarah Jenkins' },
  { id: 'usr-2', name: 'Michael Chang' },
  { id: 'usr-3', name: 'Elena Rostova' },
  { id: 'usr-4', name: 'David Adeleke' },
  { id: 'usr-5', name: 'Sophia Patel' },
];

export const MOCK_BUSINESS_LINES = [
  'All lines',
  'Healthcare',
  'Financial Advisory',
  'Networking & Partnerships',
];

export const MOCK_COUNTRIES = [
  'Singapore',
  'Japan',
  'United States',
  'United Kingdom',
  'Germany',
  'Switzerland',
  'Australia',
  'France',
  'South Korea',
  'United Arab Emirates',
];

// Curated 46 Healthcare accounts
const HEALTHCARE_COMPANIES = [
  'Kyoto Biopharma Labs',
  'Olympus BioTech Global',
  'Cerner Pacific Health',
  'Aethel Life Sciences',
  'Novartis APAC Consortium',
  'MedAlliance Diagnostics',
  'Caelus Health Systems',
  'GeneSys Therapeutics',
  'Asklepios Genomics',
  'Sinomedical Innovations',
  'Vivant MedTech Partners',
  'Summit NeuroCare Group',
  'PharmaNexus Asia',
  'Radiant BioVentures',
  'Apex Cellular Research',
  'Helix Oncology Alliance',
  'Horizon BioPharma',
  'AstraHealth Solutions',
  'BioGenix Diagnostics',
  'Vanguard MedSystems',
  'Sterling BioAnalytics',
  'Meridian Life Sciences',
  'NovaCare Hospital Network',
  'Catalyst BioPharma',
  'Bluecrest Health Tech',
  'Silverline Therapeutics',
  'Aegis Clinical Research',
  'Nexus Genomics Group',
  'Valence BioHealth',
  'Crestview Biologics',
  'Elevation Pharma Group',
  'Kensington Medical Care',
  'Ironwood Life Sciences',
  'Solomon BioSystems',
  'Ascent Digital Health',
  'Trident Healthcare',
  'Atlas Global Pharma',
  'Bridgepoint MedTech',
  'Redwood Clinical Group',
  'Charter BioVentures',
  'Bravura Health Systems',
  'Aventine Diagnostics',
  'Cobalt BioPharma',
  'Monarch Health Partners',
  'Providence Life Sciences',
  'Lumina Genomics APAC',
];

// Curated 46 Financial Advisory accounts
const FINANCIAL_COMPANIES = [
  'Temasek Strategic Capital',
  'Silverline Asset Management',
  'Horizon Private Equity',
  'Crestview M&A Partners',
  'Sumitomo Meridian Advisory',
  'Bluecrest Wealth Partners',
  'Solstice Global Capital',
  'Kensho Cross-Border Advisors',
  'Evercore Pacific Partners',
  'Vantage Global Holdings',
  'Redstone Merchant Banking',
  'Atlas Sovereign Fund',
  'Bridgepoint Capital Asia',
  'Apex Capital Group',
  'Vanguard Investment Partners',
  'Beacon Equity Partners',
  'Sterling Financial Advisors',
  'Northbridge Capital',
  'Pinnacle Merchant Partners',
  'Catalyst Strategic Equity',
  'Omni Capital Management',
  'Frontier Private Capital',
  'Aegis Wealth Advisors',
  'Nexus Structured Finance',
  'Valence Capital Partners',
  'Elevation Asset Advisory',
  'Kensington Merchant Group',
  'Ironwood Capital Asia',
  'Solomon Cross-Border Fund',
  'Ascent Financial Strategies',
  'Trident Equity Advisors',
  'Redwood Asset Management',
  'Charter Merchant Partners',
  'Bravura Global Finance',
  'Aventine Capital Holdings',
  'Cobalt Wealth Partners',
  'Monarch Equity Advisors',
  'Providence Financial Group',
  'Orion Private Capital',
  'Strata Advisory Partners',
  'Ardent Investment Group',
  'Everest Asset Partners',
  'Helios Merchant Capital',
  'Veritas Global Advisory',
  'Paladin Financial Partners',
  'Aurelius Capital Asia',
];

// Curated 42 Networking & Partnerships accounts
const NETWORKING_COMPANIES = [
  'Pan-Asian Trade Consortium',
  'ASEAN Strategic Alliance',
  'Global Tech Ventures Forum',
  'Nippon Enterprise Network',
  'Indo-Pacific Commerce Syndicate',
  'SilkBridge Enterprise Group',
  'Pacific Cross-Border Chamber',
  'Trans-Pacific Strategic Council',
  'Singapore Innovation Exchange',
  'Eurasian Venture Alliance',
  'Global BioNexus Forum',
  'APAC Sovereign Dialogue',
  'Cross-Border Industrial Council',
  'Apex Strategic Alliances',
  'Vanguard Global Forum',
  'Beacon Enterprise Guild',
  'Horizon Trade Federation',
  'Summit Strategic Network',
  'Sterling Commerce Group',
  'Northbridge Partner Guild',
  'Meridian Strategic Alliance',
  'Pinnacle Venture Network',
  'Catalyst Innovation Hub',
  'Omni Enterprise Syndicate',
  'Bluecrest Global Chamber',
  'Silverline Industry Alliance',
  'Frontier Economic Forum',
  'Aegis Strategic Network',
  'Nexus APAC Alliance',
  'Valence Enterprise Council',
  'Crestview Global Syndicate',
  'Elevation Trade Chamber',
  'Kensington Strategic Guild',
  'Ironwood Enterprise Network',
  'Solomon Innovation Alliance',
  'Ascent Cross-Border Forum',
  'Trident Global Consortium',
  'Atlas Strategic Guild',
  'Bridgepoint Enterprise Hub',
  'Redwood Industrial Alliance',
  'Charter Commerce Network',
  'Bravura Strategic Syndicate',
];

// Combine into exactly 134 interleaved accounts
interface CompanyMeta {
  name: string;
  category: 'Healthcare' | 'Financial Advisory' | 'Networking & Partnerships';
}

const rawCompanyList: CompanyMeta[] = [];
const maxRounds = Math.max(
  HEALTHCARE_COMPANIES.length,
  FINANCIAL_COMPANIES.length,
  NETWORKING_COMPANIES.length
);

for (let r = 0; r < maxRounds; r++) {
  if (r < HEALTHCARE_COMPANIES.length) {
    rawCompanyList.push({ name: HEALTHCARE_COMPANIES[r], category: 'Healthcare' });
  }
  if (r < FINANCIAL_COMPANIES.length) {
    rawCompanyList.push({ name: FINANCIAL_COMPANIES[r], category: 'Financial Advisory' });
  }
  if (r < NETWORKING_COMPANIES.length) {
    rawCompanyList.push({ name: NETWORKING_COMPANIES[r], category: 'Networking & Partnerships' });
  }
}

// Generate exactly 134 accounts with rich attributes
export const MOCK_ACCOUNTS: Account[] = rawCompanyList.map((comp, idx) => {
  const id = `acc-${idx + 1}`;
  const owner = MOCK_OWNERS[idx % MOCK_OWNERS.length];
  const country = MOCK_COUNTRIES[idx % MOCK_COUNTRIES.length];

  // Top accounts have curated tiers ensuring prominent Tier 1 clients across all 5 partners
  let tier: string;
  if (idx < 12) {
    tier = [0, 1, 3, 4, 6, 7, 9, 10, 11].includes(idx) ? 'TIER_1' : 'TIER_2';
  } else {
    tier = idx % 3 === 0 ? 'TIER_1' : idx % 3 === 1 ? 'TIER_2' : 'TIER_3';
  }

  // Balanced deal side: 67 Buy-Side, 67 Sell-Side
  const deal_side = idx % 2 === 0 ? 'BUY_SIDE' : 'SELL_SIDE';

  // Deterministic recent update dates (top 8 are the freshest within past 7 days)
  let hoursAgo: number;
  if (idx === 0) hoursAgo = 4;
  else if (idx === 1) hoursAgo = 14;
  else if (idx === 2) hoursAgo = 28;
  else if (idx === 3) hoursAgo = 52;
  else if (idx === 4) hoursAgo = 76;
  else if (idx === 5) hoursAgo = 100;
  else if (idx === 6) hoursAgo = 124;
  else if (idx === 7) hoursAgo = 148;
  else hoursAgo = 170 + (idx - 8) * 6;

  const updatedDate = new Date(Date.now() - hoursAgo * 3600000);

  return {
    id,
    name: comp.name,
    country,
    tier,
    deal_side,
    owner_id: owner.id,
    owner_name: owner.name,
    category: comp.category,
    updated_at: updatedDate.toISOString(),
  };
});

// Curated names and profiles for 178 contacts
const contactFirstNames = [
  'Kenji', 'Claire', 'Vikram', 'Mei-Ling', 'Alister', 'Helene', 'Marcus', 'Evelyn',
  'Takeshi', 'Sophie', 'Hiroshi', 'Charlotte', 'Rajiv', 'Beatrice', 'David', 'Ananya',
  'Julian', 'Chloe', 'Alexander', 'Nicole', 'Min-Jun', 'Sarah', 'Taro', 'Madeleine',
  'Arjun', 'Vivienne', 'Daniel', 'Li-Wei', 'Sebastian', 'Camille', 'Nicholas', 'Yuka',
  'Gabriel', 'Elena', 'Nathan', 'Ji-Woo', 'Arthur', 'Valerie', 'Dominic', 'Soo-Jin',
  'Harrison', 'Catherine', 'Benjamin', 'Lin', 'Lucas', 'Hannah', 'Oliver', 'Maria'
];

const contactLastNames = [
  'Sato', 'Delacroix', 'Malhotra', 'Zhou', 'Sterling', 'Dubois', 'Vance', 'Tan',
  'Takahashi', 'Moreau', 'Tanaka', 'Mercer', 'Sharma', 'Beaumont', 'Adeleke', 'Patel',
  'Sinclair', 'Laurent', 'Rothschild', 'Chen', 'Park', 'Jenkins', 'Watanabe', 'Fontaine',
  'Gupta', 'Marchand', 'Chang', 'Huang', 'Blackwood', 'Girard', 'Hastings', 'Yamamoto',
  'Rostova', 'Thornton', 'Kim', 'Montague', 'Caron', 'O’Connor', 'Kang', 'Kensington',
  'Dupont', 'Morrison', 'Lin', 'Alister', 'Wu', 'Holt', 'Alvarez', 'Nakamura'
];

const executiveTitles = [
  'Chief Executive Officer',
  'Managing Director, APAC M&A',
  'Executive Director, Strategic Advisory',
  'Head of Global Partnerships',
  'Chief Investment Officer',
  'VP Corporate Development',
  'Partner, Cross-Border Transactions',
  'Head of Strategic Investments',
  'Senior Vice President, Healthcare',
  'Chief Strategy Officer',
  'Executive Director, Capital Markets',
  'Managing Director, Private Equity',
];

const strategicNextSteps = [
  'Deliver final cross-border M&A valuation memo',
  'Coordinate Tokyo/Singapore leadership chemistry summit',
  'Review Phase III clinical trial partnership term sheet',
  'Finalize strategic consortium governance charter',
  'Present executive board advisory deck in Singapore',
  'Execute bilateral Non-Disclosure Agreement (NDA)',
  'Review commercial due diligence findings and synergy matrix',
  'Align on sovereign co-investment syndication framework',
  'Schedule leadership chemistry session in Zurich',
  'Deliver regulatory roadmap for APAC market entry',
  'Follow up on indicative non-binding letter of intent (LOI)',
  'Draft cross-border joint venture operational framework',
  'Coordinate on-site clinical manufacturing due diligence',
  'Review shareholder rights agreement with outside counsel',
  'Present revised transaction structure and tax optimization deck',
  'Confirm attendee roster for bilateral strategic forum',
];

interface PriorityProfile {
  name: string;
  title: string;
  nextStep: string;
  status: 'HOT' | 'WARM' | 'COLD';
  companyIdx: number;
}

// Top Tier-1 executive lead profiles (curated realistic mix of HOT, WARM, and COLD)
const topPriorityProfiles: PriorityProfile[] = [
  {
    name: 'Dr. Kenji Sato',
    title: 'Chief Executive Officer',
    nextStep: 'Deliver final cross-border M&A valuation memo',
    status: 'HOT',
    companyIdx: 0, // acc-1: Kyoto Biopharma Labs (usr-1)
  },
  {
    name: 'Claire Delacroix',
    title: 'Managing Director, APAC M&A',
    nextStep: 'Coordinate Tokyo/Singapore leadership chemistry summit',
    status: 'HOT',
    companyIdx: 1, // acc-2: Temasek Strategic Capital (usr-2)
  },
  {
    name: 'Marcus Vance',
    title: 'Partner, Cross-Border Advisory',
    nextStep: 'Review commercial due diligence findings and synergy matrix',
    status: 'WARM',
    companyIdx: 7, // acc-8: Horizon Private Equity (usr-3)
  },
  {
    name: 'Dr. Helene Dubois',
    title: 'VP Global Business Development',
    nextStep: 'Execute bilateral Non-Disclosure Agreement (NDA)',
    status: 'COLD',
    companyIdx: 3, // acc-4: Olympus BioTech Global (usr-4)
  },
  {
    name: 'Evelyn Tan',
    title: 'Head of Corporate Strategy',
    nextStep: 'Align on sovereign co-investment syndication framework',
    status: 'WARM',
    companyIdx: 4, // acc-5: Silverline Asset Management (usr-5)
  },
  {
    name: 'Takeshi Tanaka',
    title: 'Managing Director, Capital Markets',
    nextStep: 'Deliver regulatory roadmap for APAC market entry',
    status: 'COLD',
    companyIdx: 10, // acc-11: Crestview M&A Partners (usr-1)
  },
  {
    name: 'Vikram Malhotra',
    title: 'Executive Director, Healthcare Advisory',
    nextStep: 'Review Phase III clinical trial partnership term sheet',
    status: 'HOT',
    companyIdx: 6, // acc-7: Cerner Pacific Health (usr-2)
  },
  {
    name: 'Alister Sterling',
    title: 'Chief Investment Officer',
    nextStep: 'Present executive board advisory deck in Singapore',
    status: 'WARM',
    companyIdx: 7, // acc-8: Horizon Private Equity (usr-3)
  },
];

// Generate exactly 178 contacts (linked to 134 accounts)
export const MOCK_CONTACTS: Contact[] = Array.from({ length: 178 }, (_, idx) => {
  let companyIdx: number;
  let name: string;
  let title: string;
  let next_step: string;
  let relationship_status: 'HOT' | 'WARM' | 'COLD';

  if (idx < 8) {
    // Exact top priority contacts: Tier 1, 3 HOT, 3 WARM, 2 COLD
    const profile = topPriorityProfiles[idx];
    companyIdx = profile.companyIdx;
    name = profile.name;
    title = profile.title;
    next_step = profile.nextStep;
    relationship_status = profile.status;
  } else {
    // Accounts 0..43 have 2 contacts each (88 contacts), accounts 44..133 have 1 contact each (90 contacts)
    if (idx < 88) {
      companyIdx = Math.floor(idx / 2);
    } else {
      companyIdx = 44 + (idx - 88);
    }
    const fn = contactFirstNames[idx % contactFirstNames.length];
    const ln = contactLastNames[(idx + Math.floor(idx / 7)) % contactLastNames.length];
    name = `${fn} ${ln}`;
    title = executiveTitles[idx % executiveTitles.length];
    next_step = strategicNextSteps[idx % strategicNextSteps.length];

    // Distribution: total 32 HOT, 84 WARM, 62 COLD
    // 3 HOT, 3 WARM, 2 COLD already assigned in top 8
    if (idx < 37) {
      // 29 more HOT -> total 32 HOT
      relationship_status = 'HOT';
    } else if (idx < 118) {
      // 81 more WARM -> total 84 WARM
      relationship_status = 'WARM';
    } else {
      // 60 more COLD -> total 62 COLD
      relationship_status = 'COLD';
    }
  }

  const company = MOCK_ACCOUNTS[companyIdx];
  const tier = company.tier;

  // Very small fraction closed, none in top 8
  const is_closed = idx > 20 && idx % 16 === 0;

  const email = `${name.toLowerCase().replace(/[^a-z]/g, '')}@${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

  return {
    id: `cnt-${idx + 1}`,
    name,
    company_id: company.id,
    company_name: company.name,
    tier,
    relationship_status,
    next_step,
    is_closed,
    title,
    email,
  };
});

const followUpActions = [
  'Send revised draft of bilateral joint-venture governance charter',
  'Deliver updated financial model with cross-border tax synergies',
  'Confirm attendee roster for Tokyo partner summit next Wednesday',
  'Finalize regulatory clearance timetable for Singapore market launch',
  'Schedule executive diligence Q&A with clinical advisory board',
  'Deliver briefing deck on cross-border licensing terms and royalties',
  'Review sovereign co-investment allocation and syndication terms',
  'Send debrief notes and action items from CEO chemistry dinner',
  'Coordinate site inspection for medtech manufacturing facility',
  'Follow up on outstanding commercial due diligence data room requests',
  'Review draft shareholder agreement with local transaction counsel',
  'Verify APAC consortium milestone checklist and execution timeline',
  'Host bilateral strategy alignment call with managing partner',
  'Execute Non-Disclosure Agreement (NDA) with advisory committee',
  'Deliver preliminary enterprise valuation sensitivity analysis',
  'Review cross-border IP licensing terms with Japanese partners',
  'Coordinate on-site diligence briefing with medical board',
  'Submit confidential investment memorandum (CIM) to lead investor',
  'Confirm bilateral panel discussion participants for Singapore summit',
  'Send follow-up commercial terms sheet to board of directors',
  'Review syndicated debt financing proposal with treasury team',
  'Conduct executive chemistry session with prospective buyout team',
  'Deliver final APAC regulatory clearance roadmap and risk matrix',
  'Sign off on joint venture operating guidelines and voting charter',
  'Deliver draft transaction agreement to executive steering committee',
  'Coordinate European roadshow schedule with global placement agent',
  'Finalize Q3 cross-border M&A pipeline review presentation',
  'Review Phase IIb clinical validation data with specialist partners',
  'Follow up on indicative valuation feedback from sovereign investor',
  'Schedule legal drafting session for multi-party consortium MOU',
  'Send financial audit checklist to target company CFO',
  'Deliver executive summary on APAC healthcare expansion opportunities',
  'Review board deck on proposed cross-border asset carveout',
  'Align on management equity incentive structure for key leadership',
  'Finalize venue and agenda for Zurich strategic advisory retreat',
  'Coordinate technical due diligence call with software architects',
  'Review working capital adjustment mechanism with M&A tax lead',
  'Draft executive briefing for cross-border ministerial dialogue',
  'Send updated terms for commercial distribution partnership',
  'Schedule follow-up chemistry dinner with prospective target founders',
  'Review antitrust and foreign investment clearance filings',
  'Deliver valuation benchmarks for comparable APAC healthcare deals',
  'Coordinate partner vote on new strategic advisory mandate',
  'Review syndicate underwriting commitments and fee allocations',
  'Prepare quarterly advisory performance report for limited partners',
  'Follow up on customer reference interview scheduling',
  'Review final escrow agreement and closing funds flow memorandum',
  'Send closing completion certificates to transaction principals',
];

// Safe local calendar date formatter (YYYY-MM-DD)
export const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Target distribution of overdue items per owner:
// Sarah Jenkins (usr-1): 3, Michael Chang (usr-2): 2, Elena Rostova (usr-3): 3, David Adeleke (usr-4): 2, Sophia Patel (usr-5): 2 (total 12)
const overdueOwnerIds = [
  'usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5',
  'usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5',
  'usr-1', 'usr-3',
];

// Generate exactly 48 realistic follow-ups: 12 Overdue, 12 Today, 24 This week
export const MOCK_FOLLOW_UPS: FollowUp[] = Array.from({ length: 48 }, (_, idx) => {
  const action = followUpActions[idx % followUpActions.length];
  const now = new Date();

  let dueDateStr: string;
  let ownerId: string;
  let contact: Contact;

  if (idx < 12) {
    // 12 Overdue follow-ups: 1 to 5 days in the past
    const daysAgo = 1 + (idx % 5);
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
    dueDateStr = formatLocalDate(d);
    ownerId = overdueOwnerIds[idx];

    // First 8 overdue follow-ups are assigned directly to the top 8 Tier-1 priority contacts (HOT, WARM, COLD)
    if (idx < 8) {
      contact = MOCK_CONTACTS[idx];
    } else {
      // Remaining 4 overdue items belong to Tier 2 / Tier 3 accounts
      const candidate = MOCK_CONTACTS.slice(8).find((c) => {
        const acc = MOCK_ACCOUNTS.find((a) => a.id === c.company_id);
        return acc?.owner_id === ownerId && acc?.tier !== 'TIER_1';
      });
      contact = candidate || MOCK_CONTACTS[idx];
    }
  } else if (idx < 24) {
    // 12 Today follow-ups
    dueDateStr = formatLocalDate(now);
    ownerId = MOCK_OWNERS[idx % MOCK_OWNERS.length].id;
    contact = MOCK_CONTACTS[12 + idx];
  } else {
    // 24 This week follow-ups: 1 to 6 days ahead
    const daysAhead = 1 + (idx % 6);
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
    dueDateStr = formatLocalDate(d);
    ownerId = MOCK_OWNERS[idx % MOCK_OWNERS.length].id;
    contact = MOCK_CONTACTS[20 + idx];
  }

  const dueDateObj = new Date(dueDateStr);
  const lastContactedObj = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate() - 4);

  return {
    id: `flw-${idx + 1}`,
    contact_id: contact.id,
    action,
    last_contacted_date: formatLocalDate(lastContactedObj),
    due_date: dueDateStr,
    owner_id: ownerId,
  };
});

// Helper to assemble FollowUpDTOs with consistent categorization & sorting
export const getEnrichedFollowUps = (): FollowUpDTO[] => {
  const todayStr = formatLocalDate(new Date());

  const enriched = MOCK_FOLLOW_UPS.map((f) => {
    const contact = MOCK_CONTACTS.find((c) => c.id === f.contact_id);
    const company = contact ? MOCK_ACCOUNTS.find((a) => a.id === contact.company_id) : undefined;

    let status_category: 'OVERDUE' | 'TODAY' | 'THIS_WEEK' = 'THIS_WEEK';
    if (f.due_date < todayStr) {
      status_category = 'OVERDUE';
    } else if (f.due_date === todayStr) {
      status_category = 'TODAY';
    }

    return {
      id: f.id,
      contact_id: f.contact_id,
      contact_name: contact ? contact.name : 'Unknown Contact',
      company_id: contact ? contact.company_id : '',
      company_name: company ? company.name : 'Independent',
      action: f.action,
      due_date: f.due_date,
      last_contacted_date: f.last_contacted_date,
      owner_id: f.owner_id,
      status_category,
    };
  });

  return enriched.sort((a, b) => {
    if (a.due_date !== b.due_date) {
      return a.due_date.localeCompare(b.due_date);
    }
    return a.contact_name.localeCompare(b.contact_name);
  });
};

// Compute KPI summary and outreach funnel from the exact same filtered dataset
export function computeDashboardMetrics(
  accounts: Account[],
  contacts: Contact[],
  followUps: FollowUpDTO[]
): { kpis: DashboardKpis; funnel: FunnelStage[] } {
  const totalAccounts = accounts.length;
  const peopleNamed = contacts.length;

  // Funnel calculations derived directly from the filtered contacts:
  const toContact = peopleNamed;
  const connected = Math.min(toContact, Math.round(toContact * 0.72));
  const messaged = Math.min(connected, Math.round(toContact * 0.44));
  // Meetings: contacts at the active meeting stage (HOT relationship status)
  const meetings = contacts.filter((c) => c.relationship_status === 'HOT').length;

  const funnel: FunnelStage[] = [
    {
      stage: 'TO_CONTACT',
      label: 'To contact',
      count: toContact,
      percentage: 100,
    },
    {
      stage: 'CONNECTED',
      label: 'Connected',
      count: connected,
      percentage: toContact > 0 ? Math.round((connected / toContact) * 100) : 0,
    },
    {
      stage: 'MESSAGED',
      label: 'Messaged',
      count: messaged,
      percentage: toContact > 0 ? Math.round((messaged / toContact) * 100) : 0,
    },
    {
      stage: 'MEETINGS',
      label: 'Meetings',
      count: meetings,
      percentage: toContact > 0 ? Math.round((meetings / toContact) * 100) : 0,
    },
  ];

  // Overdue count: exact count of overdue follow-up action items in scope
  const overdueCount = followUps.filter((f) => f.status_category === 'OVERDUE').length;

  const kpis: DashboardKpis = {
    totalAccounts,
    peopleNamed,
    meetings,
    overdueCount,
  };

  return { kpis, funnel };
}
