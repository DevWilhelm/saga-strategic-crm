import { http, HttpResponse, delay } from 'msw';
import {
  MOCK_ACCOUNTS,
  MOCK_BUSINESS_LINES,
  MOCK_CONTACTS,
  MOCK_COUNTRIES,
  MOCK_OWNERS,
  getEnrichedFollowUps,
  computeDashboardMetrics,
} from '../dashboard/data';
import type {
  Account,
  CategoryDistributionMetric,
  Contact,
  DashboardChartsData,
  DashboardFilterOptions,
  FollowUpDTO,
  OwnerWorkloadMetric,
  StaleContactDTO,
} from '../../types/dashboard';

// Helper to filter accounts based on request query parameters
function filterAccounts(url: URL): Account[] {
  const businessLine = url.searchParams.get('businessLine');
  const ownerId = url.searchParams.get('ownerId');
  const tier = url.searchParams.get('tier');
  const dealSide = url.searchParams.get('dealSide');
  const country = url.searchParams.get('country');

  return MOCK_ACCOUNTS.filter((acc) => {
    if (businessLine && businessLine !== 'All lines' && businessLine !== 'ALL' && acc.category !== businessLine) {
      return false;
    }
    if (ownerId && ownerId !== 'ALL' && acc.owner_id !== ownerId) {
      return false;
    }
    if (tier && tier !== 'ALL' && acc.tier !== tier) {
      return false;
    }
    if (dealSide && dealSide !== 'ALL' && acc.deal_side !== dealSide) {
      return false;
    }
    if (country && country !== 'ALL' && acc.country !== country) {
      return false;
    }
    return true;
  });
}

function filterContacts(filteredAccounts: Account[], url: URL): Contact[] {
  const allowedAccountIds = new Set(filteredAccounts.map((a) => a.id));
  const tier = url.searchParams.get('tier');

  return MOCK_CONTACTS.filter((c) => {
    if (!allowedAccountIds.has(c.company_id)) {
      return false;
    }
    if (tier && tier !== 'ALL' && c.tier !== tier) {
      return false;
    }
    return true;
  });
}

export const dashboardHandlers = [
  // 1. KPI Cards
  http.get('*/api/dashboard/kpis', async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const accounts = filterAccounts(url);
    const contacts = filterContacts(accounts, url);

    const allowedContactIds = new Set(contacts.map((c) => c.id));
    const allFollowUps = getEnrichedFollowUps();
    const followUps = allFollowUps.filter((f) => allowedContactIds.has(f.contact_id));

    const { kpis } = computeDashboardMetrics(accounts, contacts, followUps);
    return HttpResponse.json(kpis);
  }),

  // 2. Outreach Funnel
  http.get('*/api/dashboard/funnel', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const accounts = filterAccounts(url);
    const contacts = filterContacts(accounts, url);

    const allowedContactIds = new Set(contacts.map((c) => c.id));
    const allFollowUps = getEnrichedFollowUps();
    const followUps = allFollowUps.filter((f) => allowedContactIds.has(f.contact_id));

    const { funnel } = computeDashboardMetrics(accounts, contacts, followUps);
    return HttpResponse.json(funnel);
  }),

  // 3. Follow-Ups Panel
  http.get('*/api/dashboard/follow-ups', async ({ request }) => {
    await delay(180);
    const url = new URL(request.url);
    const accounts = filterAccounts(url);
    const contacts = filterContacts(accounts, url);

    const allowedContactIds = new Set(contacts.map((c) => c.id));
    const followUps = getEnrichedFollowUps().filter((f) => allowedContactIds.has(f.contact_id));

    return HttpResponse.json<FollowUpDTO[]>(followUps);
  }),

  // 4. Charts (Stage 2 ready)
  http.get('*/api/dashboard/charts', async ({ request }) => {
    await delay(220);
    const url = new URL(request.url);
    const accounts = filterAccounts(url);
    const contacts = filterContacts(accounts, url);

    // Relationship Temperature
    const hotCount = contacts.filter((c) => c.relationship_status === 'HOT').length;
    const warmCount = contacts.filter((c) => c.relationship_status === 'WARM').length;
    const coldCount = contacts.filter((c) => c.relationship_status === 'COLD').length;

    // Accounts by Tier
    const t1 = accounts.filter((a) => a.tier === 'TIER_1').length;
    const t2 = accounts.filter((a) => a.tier === 'TIER_2').length;
    const t3 = accounts.filter((a) => a.tier === 'TIER_3').length;

    // Deal Side
    const buySide = accounts.filter((a) => a.deal_side === 'BUY_SIDE').length;
    const sellSide = accounts.filter((a) => a.deal_side === 'SELL_SIDE').length;

    const data: DashboardChartsData = {
      relationshipTemperature: [
        { status: 'HOT', count: hotCount },
        { status: 'WARM', count: warmCount },
        { status: 'COLD', count: coldCount },
      ],
      accountsByTier: [
        { tier: 'Tier 1', count: t1 },
        { tier: 'Tier 2', count: t2 },
        { tier: 'Tier 3', count: t3 },
      ],
      dealSideDistribution: [
        { dealSide: 'Buy-Side', count: buySide },
        { dealSide: 'Sell-Side', count: sellSide },
      ],
    };

    return HttpResponse.json(data);
  }),

  // 5. Priority Contacts (ranks by follow-up urgency & recency + relationship status)
  http.get('*/api/dashboard/priority-contacts', async ({ request }) => {
    await delay(160);
    const url = new URL(request.url);
    const accounts = filterAccounts(url);
    const contacts = filterContacts(accounts, url);

    const allFollowUps = getEnrichedFollowUps();

    // Map each contact to their most urgent scheduled follow-up
    const followUpByContact = new Map<string, FollowUpDTO>();
    allFollowUps.forEach((f) => {
      const existing = followUpByContact.get(f.contact_id);
      if (!existing) {
        followUpByContact.set(f.contact_id, f);
      } else {
        const rank = (cat: string) => (cat === 'OVERDUE' ? 3 : cat === 'TODAY' ? 2 : 1);
        if (rank(f.status_category) > rank(existing.status_category)) {
          followUpByContact.set(f.contact_id, f);
        } else if (
          rank(f.status_category) === rank(existing.status_category) &&
          f.due_date < existing.due_date
        ) {
          followUpByContact.set(f.contact_id, f);
        }
      }
    });

    const getPriorityScore = (c: Contact) => {
      const f = followUpByContact.get(c.id);
      // Follow-up urgency: overdue actions require immediate executive intervention
      let urgencyScore: number;
      if (f) {
        if (f.status_category === 'OVERDUE') {
          urgencyScore = 1000;
        } else if (f.status_category === 'TODAY') {
          urgencyScore = 800;
        } else {
          urgencyScore = 600;
        }
      } else {
        urgencyScore = 200;
      }

      // Relationship status weighting (HOT, WARM, and COLD are all eligible)
      let statusScore = 0;
      if (c.relationship_status === 'HOT') statusScore = 30;
      else if (c.relationship_status === 'WARM') statusScore = 20;
      else if (c.relationship_status === 'COLD') statusScore = 10;

      return urgencyScore + statusScore;
    };

    // Tier 1 leads, not closed (inclusive of HOT, WARM, COLD)
    const sorted = [...contacts]
      .filter((c) => !c.is_closed && c.tier === 'TIER_1')
      .sort((a, b) => {
        const scoreA = getPriorityScore(a);
        const scoreB = getPriorityScore(b);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }

        // Secondary tiebreaker: earlier follow-up due date first
        const fA = followUpByContact.get(a.id);
        const fB = followUpByContact.get(b.id);
        if (fA && fB && fA.due_date !== fB.due_date) {
          return fA.due_date.localeCompare(fB.due_date);
        }

        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);

    return HttpResponse.json(sorted);
  }),

  // 6. Recent Accounts
  http.get('*/api/dashboard/recent-accounts', async ({ request }) => {
    await delay(160);
    const url = new URL(request.url);
    const accounts = filterAccounts(url);

    const sorted = [...accounts]
      .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
      .slice(0, 8);

    return HttpResponse.json(sorted);
  }),

  // 7. Filter Options
  http.get('*/api/dashboard/filter-options', async () => {
    await delay(100);
    const options: DashboardFilterOptions = {
      businessLines: MOCK_BUSINESS_LINES,
      owners: MOCK_OWNERS,
      tiers: ['TIER_1', 'TIER_2', 'TIER_3'],
      dealSides: ['BUY_SIDE', 'SELL_SIDE'],
      countries: MOCK_COUNTRIES,
    };
    return HttpResponse.json(options);
  }),

  // 8. Stale Contacts
  http.get('*/api/dashboard/stale-contacts', async ({ request }) => {
    await delay(160);
    const url = new URL(request.url);
    const accounts = filterAccounts(url);
    const contacts = filterContacts(accounts, url);
    const allowedContactIds = new Set(contacts.map((c) => c.id));
    const allFollowUps = getEnrichedFollowUps();
    const followUps = allFollowUps.filter((f) => allowedContactIds.has(f.contact_id));

    const now = new Date();
    const contactFollowUpsMap = new Map<string, FollowUpDTO[]>();
    followUps.forEach((f) => {
      const list = contactFollowUpsMap.get(f.contact_id) || [];
      list.push(f);
      contactFollowUpsMap.set(f.contact_id, list);
    });

    const stale: StaleContactDTO[] = [];
    contacts.forEach((c) => {
      const cFollowUps = contactFollowUpsMap.get(c.id);
      if (!cFollowUps || cFollowUps.length === 0) {
        const idx = parseInt(c.id.replace('cnt-', ''), 10) || 1;
        const daysSince = 32 + (idx % 28);
        const lastContactDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSince)
          .toISOString()
          .split('T')[0];

        stale.push({
          id: c.id,
          name: c.name,
          company_id: c.company_id,
          company_name: c.company_name || 'Independent',
          last_contacted_date: lastContactDate,
          days_since_contact: daysSince,
          reason: 'NO_FOLLOW_UP',
        });
      } else {
        const earliestOrLatest = cFollowUps[0];
        const lastDate = new Date(earliestOrLatest.last_contacted_date);
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 30) {
          stale.push({
            id: c.id,
            name: c.name,
            company_id: c.company_id,
            company_name: c.company_name || 'Independent',
            last_contacted_date: earliestOrLatest.last_contacted_date,
            days_since_contact: diffDays,
            reason: 'OVER_30_DAYS',
          });
        }
      }
    });

    const sortedStale = stale
      .sort((a, b) => b.days_since_contact - a.days_since_contact)
      .slice(0, 8);

    return HttpResponse.json(sortedStale);
  }),

  // 9. Accounts by category (Horizontal bar chart)
  http.get('*/api/dashboard/accounts-by-category', async ({ request }) => {
    await delay(160);
    const url = new URL(request.url);
    const accounts = filterAccounts(url);

    const categories = MOCK_BUSINESS_LINES.slice(1);
    const countsMap = new Map<string, number>();
    categories.forEach((cat) => countsMap.set(cat, 0));

    accounts.forEach((acc) => {
      countsMap.set(acc.category, (countsMap.get(acc.category) || 0) + 1);
    });

    const result: CategoryDistributionMetric[] = categories.map((cat) => ({
      category: cat,
      count: countsMap.get(cat) || 0,
    }));

    return HttpResponse.json(result);
  }),

  // 10. Accounts per owner (Workload & overdue count)
  http.get('*/api/dashboard/accounts-per-owner', async ({ request }) => {
    await delay(160);
    const url = new URL(request.url);
    const accounts = filterAccounts(url);
    const contacts = filterContacts(accounts, url);
    const allowedContactIds = new Set(contacts.map((c) => c.id));
    const allFollowUps = getEnrichedFollowUps();
    const followUps = allFollowUps.filter((f) => allowedContactIds.has(f.contact_id));

    const ownerFilter = url.searchParams.get('ownerId');
    const ownersInScope =
      ownerFilter && ownerFilter !== 'ALL'
        ? MOCK_OWNERS.filter((o) => o.id === ownerFilter)
        : MOCK_OWNERS;

    const result: OwnerWorkloadMetric[] = ownersInScope.map((owner) => {
      const account_count = accounts.filter((a) => a.owner_id === owner.id).length;
      const overdue_count = followUps.filter(
        (f) => f.owner_id === owner.id && f.status_category === 'OVERDUE'
      ).length;

      return {
        owner_id: owner.id,
        owner_name: owner.name,
        account_count,
        overdue_count,
      };
    });

    return HttpResponse.json(result);
  }),
];
