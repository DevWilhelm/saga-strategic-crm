import { http, HttpResponse, delay } from 'msw';
import { mockStore } from '../store';
import type {
  Account,
  AccountListItem,
  AccountDetail,
  CreateAccountDTO,
  UpdateAccountDTO,
  PaginatedAccountsResponse,
  NextActionInfo,
  FieldValidationError,
} from '../../types/account';
import type { AccountLookups } from '../../types/lookup';

// Helper to format local date
const getTodayDateStr = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// URL validation helper
const isValidUrl = (urlStr: string): boolean => {
  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const accountHandlers = [
  // 1. GET /api/accounts (Paginated List with Filters, Search, Sort)
  http.get('*/api/accounts', async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);

    const q = url.searchParams.get('q')?.trim().toLowerCase() || '';
    const businessLine = url.searchParams.get('businessLine');
    const categoryId = url.searchParams.get('categoryId');
    const subCategoryId = url.searchParams.get('subCategoryId');
    const serviceId = url.searchParams.get('serviceId');
    const tier = url.searchParams.get('tier');
    const dealSide = url.searchParams.get('dealSide');
    const ownerId = url.searchParams.get('ownerId');
    const country = url.searchParams.get('country');
    const status = url.searchParams.get('status');

    const page = Math.max(0, parseInt(url.searchParams.get('page') || '0', 10));
    const size = Math.min(100, Math.max(1, parseInt(url.searchParams.get('size') || '10', 10)));
    const sortParam = url.searchParams.get('sort') || 'updatedDate,desc';

    const todayStr = getTodayDateStr();

    // Filter accounts
    const filtered = mockStore.accounts.filter((acc) => {
      if (q) {
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesCountry = acc.country.toLowerCase().includes(q);
        const matchesWebsite = acc.websiteUrl?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesCountry && !matchesWebsite) return false;
      }
      if (businessLine && acc.businessLine !== businessLine) return false;
      if (categoryId && acc.categoryId !== categoryId) return false;
      if (subCategoryId && acc.subCategoryId !== subCategoryId) return false;
      if (serviceId && acc.serviceId !== serviceId) return false;
      if (tier && acc.tier !== tier) return false;
      if (dealSide && acc.dealSide !== dealSide) return false;
      if (ownerId && acc.ownerId !== ownerId) return false;
      if (country && acc.country.toLowerCase() !== country.toLowerCase()) return false;
      if (status && acc.status !== status) return false;
      return true;
    });

    // Enrich accounts into AccountListItem shape
    const enrichedItems: AccountListItem[] = filtered.map((acc) => {
      const category = mockStore.categories.find((c) => c.id === acc.categoryId);
      const subCategory = mockStore.subCategories.find((s) => s.id === acc.subCategoryId);
      const owner = mockStore.users.find((u) => u.id === acc.ownerId);

      // Earliest upcoming follow-up of its contacts (dueDate >= today)
      const accContacts = mockStore.contacts.filter((c) => c.companyId === acc.id);
      const contactIds = accContacts.map((c) => c.id);

      const upcomingFollowUps = mockStore.followUps
        .filter((f) => contactIds.includes(f.contactId) && f.dueDate >= todayStr)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      const nextFollowUpDate = upcomingFollowUps.length > 0 ? upcomingFollowUps[0].dueDate : null;

      return {
        id: acc.id,
        name: acc.name,
        businessLine: acc.businessLine,
        categoryName: category?.name || 'Uncategorized',
        subCategoryName: subCategory?.name || null,
        tier: acc.tier,
        dealSide: acc.dealSide || null,
        ownerId: acc.ownerId,
        ownerName: owner?.name || 'Unassigned',
        country: acc.country,
        status: acc.status,
        nextFollowUpDate,
        updatedDate: acc.updatedDate,
      };
    });

    // Sort validation and execution
    const ALLOWED_SORT_FIELDS = ['name', 'tier', 'nextFollowUpDate', 'updatedDate'];
    const [sortField = 'updatedDate', sortDirection = 'desc'] = sortParam.split(',');
    const normalizedDir = sortDirection.toLowerCase();

    if (!ALLOWED_SORT_FIELDS.includes(sortField) || !['asc', 'desc'].includes(normalizedDir)) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: `Invalid sort parameter '${sortParam}'. Allowed fields: name, tier, nextFollowUpDate, updatedDate (format: field,asc|desc)`,
          errors: [
            {
              field: 'sort',
              message: `Invalid sort field '${sortField}'. Allowed fields: name, tier, nextFollowUpDate, updatedDate`,
            },
          ],
        },
        { status: 400 }
      );
    }

    const isDesc = normalizedDir === 'desc';

    enrichedItems.sort((a, b) => {
      if (sortField === 'nextFollowUpDate') {
        const dateA = a.nextFollowUpDate;
        const dateB = b.nextFollowUpDate;
        // Nulls last in both asc and desc
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        const cmp = dateA.localeCompare(dateB);
        return isDesc ? -cmp : cmp;
      }

      let cmp: number;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'tier':
          cmp = a.tier.localeCompare(b.tier);
          break;
        case 'updatedDate':
        default:
          cmp = a.updatedDate.localeCompare(b.updatedDate);
          break;
      }

      return isDesc ? -cmp : cmp;
    });

    // Pagination (0-based)
    const totalElements = enrichedItems.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = enrichedItems.slice(start, start + size);

    const response: PaginatedAccountsResponse = {
      content,
      page,
      size,
      totalElements,
      totalPages,
    };

    return HttpResponse.json(response);
  }),

  // 7. GET /api/accounts/lookups (Lookup options for filters & forms)
  // Note: Placed before /api/accounts/:id to prevent route shadowing
  http.get('*/api/accounts/lookups', async () => {
    await delay(100);
    const currentUser = mockStore.getCurrentMockUser();
    let ownersList: AccountLookups['owners'];

    if (currentUser.role === 'ADMIN') {
      // ADMIN: returns all active owners WITH username (for template generation and owner reassignment)
      ownersList = mockStore.users
        .filter((u) => u.status === 'ACTIVE')
        .map((u) => ({
          id: u.id,
          name: u.name,
          code: u.code,
          username: u.username,
          photoUrl: u.photoUrl ?? null,
        }));
    } else if (currentUser.role === 'MEMBER') {
      // MEMBER: returns ONLY the member themselves, without username (privacy rule)
      ownersList = [
        {
          id: currentUser.id,
          name: currentUser.name,
          code: currentUser.code,
          photoUrl: currentUser.photoUrl ?? null,
        },
      ];
    } else {
      // VIEWER / OTHER: returns all active owners WITHOUT username (id, name, code, photoUrl only)
      ownersList = mockStore.users
        .filter((u) => u.status === 'ACTIVE')
        .map((u) => ({
          id: u.id,
          name: u.name,
          code: u.code,
          photoUrl: u.photoUrl ?? null,
        }));
    }

    const lookups: AccountLookups = {
      businessLines: mockStore.accounts.length > 0
        ? ['Healthcare', 'Financial Advisory', 'Networking & Partnerships']
        : [],
      categories: mockStore.categories,
      subCategories: mockStore.subCategories,
      services: mockStore.services,
      owners: ownersList,
      tiers: ['TIER_1', 'TIER_2', 'TIER_3'],
      dealSides: ['BUY_SIDE', 'SELL_SIDE'],
      countries: mockStore.countries,
      statuses: ['ACTIVE', 'INACTIVE'],
    };
    return HttpResponse.json(lookups);
  }),

  // 2. GET /api/accounts/:id (Account Detail)
  http.get('*/api/accounts/:id', async ({ params }) => {
    await delay(120);
    const { id } = params;
    const account = mockStore.accounts.find((a) => a.id === id);

    if (!account) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: `Account with id '${id}' not found` },
        { status: 404 }
      );
    }

    const category = mockStore.categories.find((c) => c.id === account.categoryId);
    const subCategory = mockStore.subCategories.find((s) => s.id === account.subCategoryId);
    const service = mockStore.services.find((s) => s.id === account.serviceId);
    const owner = mockStore.users.find((u) => u.id === account.ownerId);
    const createdBy = mockStore.users.find((u) => u.id === account.createdBy);
    const updatedBy = mockStore.users.find((u) => u.id === account.updatedBy);

    const contacts = mockStore.contacts.filter((c) => c.companyId === account.id);
    const notes = mockStore.notes.filter((n) => n.accountId === account.id);
    const deals = mockStore.deals.filter((d) => d.accountId === account.id);

    // Compute nextAction: earliest upcoming or overdue follow-up
    const contactIds = contacts.map((c) => c.id);
    const followUps = mockStore.followUps
      .filter((f) => contactIds.includes(f.contactId))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    let nextAction: NextActionInfo | null = null;
    if (followUps.length > 0) {
      const earliest = followUps[0];
      const relContact = contacts.find((c) => c.id === earliest.contactId);
      nextAction = {
        action: earliest.action,
        dueDate: earliest.dueDate,
        contactName: relContact?.name || 'Contact',
      };
    }

    const detail: AccountDetail = {
      ...account,
      categoryName: category?.name || 'Uncategorized',
      subCategoryName: subCategory?.name || null,
      serviceName: service?.name || 'Unassigned Service',
      ownerName: owner?.name || 'Unassigned',
      createdByName: createdBy?.name || account.createdBy,
      updatedByName: updatedBy?.name || account.updatedBy,
      contactCount: contacts.length,
      noteCount: notes.length,
      dealCount: deals.length,
      nextAction,
    };

    return HttpResponse.json(detail);
  }),

  // 3. POST /api/accounts (Create Account)
  http.post('*/api/accounts', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as CreateAccountDTO;
    const errors: FieldValidationError[] = [];

    // Validations
    if (!body.name || !body.name.trim()) {
      errors.push({ field: 'name', message: 'Account name is required' });
    } else if (body.name.trim().length > 200) {
      errors.push({ field: 'name', message: 'Account name must not exceed 200 characters' });
    }

    if (!body.businessLine) {
      errors.push({ field: 'businessLine', message: 'Business line is required' });
    }

    if (!body.categoryId) {
      errors.push({ field: 'categoryId', message: 'Category is required' });
    }

    if (!body.serviceId) {
      errors.push({ field: 'serviceId', message: 'Service is required' });
    }

    if (!body.tier) {
      errors.push({ field: 'tier', message: 'Tier is required' });
    }

    if (!body.ownerId) {
      errors.push({ field: 'ownerId', message: 'Owner is required' });
    }

    if (body.websiteUrl && body.websiteUrl.trim() && !isValidUrl(body.websiteUrl.trim())) {
      errors.push({ field: 'websiteUrl', message: 'Website must be a valid HTTP or HTTPS URL' });
    }

    if (body.note && body.note.length > 2000) {
      errors.push({ field: 'note', message: 'Note must not exceed 2000 characters' });
    }

    if (errors.length > 0) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Validation failed for account payload',
          errors,
        },
        { status: 400 }
      );
    }

    const todayStr = getTodayDateStr();
    const newAccount: Account = {
      id: `acc-${Date.now()}`,
      name: body.name.trim(),
      businessLine: body.businessLine,
      country: body.country?.trim() || 'United States',
      websiteUrl: body.websiteUrl?.trim() || null,
      categoryId: body.categoryId,
      subCategoryId: body.subCategoryId || null,
      tier: body.tier,
      ownerId: body.ownerId,
      status: body.status || 'ACTIVE',
      dealSide: body.dealSide || null,
      serviceId: body.serviceId,
      sourceRef: body.sourceRef?.trim() || null,
      note: body.note?.trim() || null,
      createdBy: 'usr-ploy',
      createdDate: todayStr,
      updatedBy: 'usr-ploy',
      updatedDate: todayStr,
    };

    mockStore.accounts.unshift(newAccount);
    return HttpResponse.json(newAccount, { status: 201 });
  }),

  // 3. PUT /api/accounts/:id (Update Account)
  http.put('*/api/accounts/:id', async ({ params, request }) => {
    await delay(200);
    const { id } = params;
    const index = mockStore.accounts.findIndex((a) => a.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: `Account with id '${id}' not found` },
        { status: 404 }
      );
    }

    const body = (await request.json()) as UpdateAccountDTO;
    const errors: FieldValidationError[] = [];

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        errors.push({ field: 'name', message: 'Account name cannot be empty' });
      } else if (body.name.trim().length > 200) {
        errors.push({ field: 'name', message: 'Account name must not exceed 200 characters' });
      }
    }

    if (body.websiteUrl && body.websiteUrl.trim() && !isValidUrl(body.websiteUrl.trim())) {
      errors.push({ field: 'websiteUrl', message: 'Website must be a valid HTTP or HTTPS URL' });
    }

    if (body.note && body.note.length > 2000) {
      errors.push({ field: 'note', message: 'Note must not exceed 2000 characters' });
    }

    if (errors.length > 0) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Validation failed for account payload',
          errors,
        },
        { status: 400 }
      );
    }

    const existing = mockStore.accounts[index];
    const todayStr = getTodayDateStr();

    const updatedAccount: Account = {
      ...existing,
      ...body,
      country: body.country !== undefined ? (body.country ? body.country.trim() : existing.country) : existing.country,
      name: body.name ? body.name.trim() : existing.name,
      websiteUrl: body.websiteUrl !== undefined ? (body.websiteUrl ? body.websiteUrl.trim() : null) : existing.websiteUrl,
      sourceRef: body.sourceRef !== undefined ? (body.sourceRef ? body.sourceRef.trim() : null) : existing.sourceRef,
      note: body.note !== undefined ? (body.note ? body.note.trim() : null) : existing.note,
      updatedBy: 'usr-ploy',
      updatedDate: todayStr,
    };

    mockStore.accounts[index] = updatedAccount;
    return HttpResponse.json(updatedAccount, { status: 200 });
  }),

  // 4. GET /api/accounts/:id/contacts
  http.get('*/api/accounts/:id/contacts', async ({ params }) => {
    await delay(120);
    const { id } = params;
    const contacts = mockStore.contacts.filter((c) => c.companyId === id);
    return HttpResponse.json(contacts);
  }),

  // 5. GET /api/accounts/:id/notes (newest first)
  http.get('*/api/accounts/:id/notes', async ({ params }) => {
    await delay(120);
    const { id } = params;
    const notes = mockStore.notes
      .filter((n) => n.accountId === id)
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
    return HttpResponse.json(notes);
  }),

  // 5. POST /api/accounts/:id/notes (Optional: Add a note)
  http.post('*/api/accounts/:id/notes', async ({ params, request }) => {
    await delay(150);
    const { id } = params;
    const body = (await request.json()) as { text?: string };

    if (!body.text || !body.text.trim()) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Note text is required',
          errors: [{ field: 'text', message: 'Note text cannot be empty' }],
        },
        { status: 400 }
      );
    }

    const todayStr = getTodayDateStr();
    const newNote = {
      id: `note-${Date.now()}`,
      accountId: String(id),
      authorName: 'Ploy S.',
      createdDate: todayStr,
      text: body.text.trim(),
    };

    mockStore.notes.unshift(newNote);
    return HttpResponse.json(newNote, { status: 201 });
  }),

  // 6. GET /api/accounts/:id/deals
  http.get('*/api/accounts/:id/deals', async ({ params }) => {
    await delay(120);
    const { id } = params;
    const deals = mockStore.deals.filter((d) => d.accountId === id);
    return HttpResponse.json(deals);
  }),
];
