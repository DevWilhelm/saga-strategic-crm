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
  AccountImportPayload,
  AccountImportResponse,
  AccountImportRowResult,
} from '../../types/account';
import type { AccountLookups } from '../../types/lookup';
import { can } from '../../auth/permissions';
import { buildAccountsCsv, buildAccountsXlsx } from '../../features/import-export/utils/exportHelper';

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

  // 8. GET /api/accounts/export (All rows matching active filters & sort, format=xlsx|csv)
  http.get('*/api/accounts/export', async ({ request }) => {
    await delay(200);
    const currentUser = mockStore.getCurrentMockUser();

    // Permission check
    if (!can('account.export', undefined, currentUser)) {
      return HttpResponse.json(
        { status: 403, error: 'Forbidden', message: 'You do not have permission to export accounts.' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const format = (url.searchParams.get('format') || 'xlsx').toLowerCase();
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
    const sortParam = url.searchParams.get('sort') || 'updatedDate,desc';

    const todayStr = getTodayDateStr();

    // Filter accounts across all records
    const filtered = mockStore.accounts.filter((acc) => {
      if (q) {
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesWebsite = acc.websiteUrl ? acc.websiteUrl.toLowerCase().includes(q) : false;
        const matchesCountry = acc.country.toLowerCase().includes(q);
        if (!matchesName && !matchesWebsite && !matchesCountry) return false;
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

    // Check row limit of 10,000
    if (filtered.length > 10000) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Export limit exceeded. Maximum 10,000 accounts can be exported at once. Please narrow your filters.',
        },
        { status: 400 }
      );
    }

    // Sort accounts
    const [sortField = 'updatedDate', sortDirection = 'desc'] = sortParam.split(',');
    const isDesc = sortDirection.toLowerCase() === 'desc';

    filtered.sort((a, b) => {
      if (sortField === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return isDesc ? -cmp : cmp;
      }
      if (sortField === 'tier') {
        const cmp = a.tier.localeCompare(b.tier);
        return isDesc ? -cmp : cmp;
      }
      const valA = a.updatedDate || '';
      const valB = b.updatedDate || '';
      const cmp = valA.localeCompare(valB);
      return isDesc ? -cmp : cmp;
    });

    const lookups: AccountLookups = {
      businessLines: ['Healthcare', 'Financial Advisory', 'Networking & Partnerships'],
      categories: mockStore.categories,
      subCategories: mockStore.subCategories,
      services: mockStore.services,
      owners: mockStore.users.map((u) => ({
        id: u.id,
        name: u.name,
        code: u.code,
        username: u.username,
        photoUrl: u.photoUrl ?? null,
      })),
      tiers: ['TIER_1', 'TIER_2', 'TIER_3'],
      dealSides: ['BUY_SIDE', 'SELL_SIDE'],
      countries: mockStore.countries,
      statuses: ['ACTIVE', 'INACTIVE'],
    };

    const filename = `accounts-${todayStr}.${format === 'csv' ? 'csv' : 'xlsx'}`;

    if (format === 'csv') {
      const csvBytes = buildAccountsCsv(filtered, lookups);
      return new HttpResponse(csvBytes, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    const xlsxBytes = await buildAccountsXlsx(filtered, lookups);
    return new HttpResponse(xlsxBytes, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }),

  // 9. POST /api/accounts/import (Validate or Commit spreadsheet rows)
  http.post('*/api/accounts/import', async ({ request }) => {
    await delay(300);
    const currentUser = mockStore.getCurrentMockUser();

    // Permission check
    if (!can('account.import', undefined, currentUser)) {
      return HttpResponse.json(
        { status: 403, error: 'Forbidden', message: 'You do not have permission to import accounts.' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as AccountImportPayload;

    if (!body || !body.rows || !Array.isArray(body.rows)) {
      return HttpResponse.json(
        { status: 400, error: 'Bad Request', message: 'Invalid import payload.' },
        { status: 400 }
      );
    }

    if (body.rows.length > 500) {
      return HttpResponse.json(
        { status: 400, error: 'Bad Request', message: 'Import limit exceeded. Maximum 500 accounts can be imported at once.' },
        { status: 400 }
      );
    }

    const todayStr = getTodayDateStr();
    const existingNames = new Set(mockStore.accounts.map((a) => a.name.trim().toLowerCase()));
    const seenBatchNames = new Set<string>();

    const results: AccountImportRowResult[] = [];

    body.rows.forEach((row) => {
      const errors: FieldValidationError[] = [];

      // Validations
      if (!row.name || !row.name.trim()) {
        errors.push({ field: 'name', message: 'Account name is required' });
      } else if (row.name.trim().length > 200) {
        errors.push({ field: 'name', message: 'Account name must not exceed 200 characters' });
      }

      if (!row.businessLine) {
        errors.push({ field: 'businessLine', message: 'Business line is required' });
      }

      if (!row.categoryId) {
        errors.push({ field: 'categoryId', message: 'Category is required' });
      } else if (!mockStore.categories.some((c) => c.id === row.categoryId)) {
        errors.push({ field: 'categoryId', message: 'Category not found' });
      }

      if (row.subCategoryId) {
        const sub = mockStore.subCategories.find((s) => s.id === row.subCategoryId);
        if (!sub) {
          errors.push({ field: 'subCategoryId', message: 'Sub-category not found' });
        } else if (sub.categoryId !== row.categoryId) {
          errors.push({ field: 'subCategoryId', message: 'Sub-category does not belong to selected category' });
        }
      }

      if (!row.serviceId) {
        errors.push({ field: 'serviceId', message: 'Service is required' });
      } else if (!mockStore.services.some((s) => s.id === row.serviceId)) {
        errors.push({ field: 'serviceId', message: 'Service not found' });
      }

      if (!row.tier) {
        errors.push({ field: 'tier', message: 'Tier is required' });
      }

      // MEMBER owner rule
      if (currentUser.role === 'MEMBER' && row.ownerId && row.ownerId !== currentUser.id) {
        errors.push({ field: 'ownerId', message: 'Only an admin can assign other owners' });
      }

      if (row.websiteUrl && row.websiteUrl.trim() && !isValidUrl(row.websiteUrl.trim())) {
        errors.push({ field: 'websiteUrl', message: 'Website must be a valid HTTP or HTTPS URL' });
      }

      if (row.note && row.note.length > 2000) {
        errors.push({ field: 'note', message: 'Note must not exceed 2000 characters' });
      }

      if (errors.length > 0) {
        results.push({
          rowNumber: row.rowNumber,
          status: 'ERROR',
          errors,
        });
        return;
      }

      // Check duplicate
      const lowerName = row.name.trim().toLowerCase();
      const isDup = existingNames.has(lowerName) || seenBatchNames.has(lowerName);
      seenBatchNames.add(lowerName);

      if (isDup && body.duplicatePolicy === 'SKIP') {
        results.push({
          rowNumber: row.rowNumber,
          status: 'SKIPPED',
        });
        return;
      }

      // Valid row
      if (body.mode === 'COMMIT') {
        const assignedOwnerId = row.ownerId || currentUser.id;
        const newAccount: Account = {
          id: `acc-imp-${Date.now()}-${row.rowNumber}`,
          name: row.name.trim(),
          businessLine: row.businessLine,
          country: row.country?.trim() || 'Thailand',
          websiteUrl: row.websiteUrl?.trim() || null,
          categoryId: row.categoryId,
          subCategoryId: row.subCategoryId || null,
          tier: row.tier,
          ownerId: assignedOwnerId,
          status: row.status || 'ACTIVE',
          dealSide: row.dealSide || null,
          serviceId: row.serviceId,
          sourceRef: row.sourceRef?.trim() || null,
          note: row.note?.trim() || null,
          createdBy: currentUser.id,
          createdDate: todayStr,
          updatedBy: currentUser.id,
          updatedDate: todayStr,
        };

        mockStore.accounts.push(newAccount);
        existingNames.add(lowerName);

        results.push({
          rowNumber: row.rowNumber,
          status: 'CREATED',
          accountId: newAccount.id,
        });
      } else {
        results.push({
          rowNumber: row.rowNumber,
          status: 'VALID',
        });
      }
    });

    const total = body.rows.length;
    const created = results.filter((r) => r.status === 'CREATED' || r.status === 'VALID').length;
    const skipped = results.filter((r) => r.status === 'SKIPPED').length;
    const failed = results.filter((r) => r.status === 'ERROR').length;

    const response: AccountImportResponse = {
      total,
      created,
      skipped,
      failed,
      results,
    };

    return HttpResponse.json(response);
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
