import { http, HttpResponse, delay } from 'msw';
import { INITIAL_ACCOUNTS, INITIAL_CONTACTS } from './data';
import type {
  Account,
  Contact,
  CreateAccountDTO,
  UpdateAccountDTO,
  CreateContactDTO,
  UpdateContactDTO,
  PaginatedResponse,
} from '../types/crm';

// In-memory data stores for live CRUD interaction
let accounts: Account[] = [...INITIAL_ACCOUNTS];
let contacts: Contact[] = [...INITIAL_CONTACTS];

export const handlers = [
  // --- ACCOUNTS ENDPOINTS (/api/v1/accounts) ---

  // GET /api/v1/accounts (paginated list with search)
  http.get('*/api/v1/accounts', async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20', 10), 100);

    let filtered = accounts;
    if (search) {
      filtered = filtered.filter((acc) => acc.name.toLowerCase().includes(search));
    }

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const pagedData = filtered.slice(startIndex, startIndex + pageSize);

    const response: PaginatedResponse<Account> = {
      data: pagedData,
      meta: { page, pageSize, total },
    };
    return HttpResponse.json(response);
  }),

  // POST /api/v1/accounts
  http.post('*/api/v1/accounts', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as CreateAccountDTO;

    if (!body.name || !body.name.trim()) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Account name is required',
            details: [{ field: 'name', message: 'Must provide account name' }],
          },
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newAccount: Account = {
      id: `acc-${Date.now()}`,
      name: body.name.trim(),
      industry: body.industry ?? null,
      website: body.website ?? null,
      phone: body.phone ?? null,
      ownerId: body.ownerId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    accounts.unshift(newAccount);
    return HttpResponse.json(newAccount, { status: 201 });
  }),

  // GET /api/v1/accounts/:id
  http.get('*/api/v1/accounts/:id', async ({ params }) => {
    await delay(100);
    const { id } = params;
    const account = accounts.find((a) => a.id === id);

    if (!account) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 }
      );
    }

    return HttpResponse.json(account);
  }),

  // PATCH /api/v1/accounts/:id
  http.patch('*/api/v1/accounts/:id', async ({ params, request }) => {
    await delay(200);
    const { id } = params;
    const index = accounts.findIndex((a) => a.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 }
      );
    }

    const updates = (await request.json()) as UpdateAccountDTO;
    const existing = accounts[index];
    const updatedAccount: Account = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    accounts[index] = updatedAccount;
    return HttpResponse.json(updatedAccount);
  }),

  // DELETE /api/v1/accounts/:id
  http.delete('*/api/v1/accounts/:id', async ({ params }) => {
    await delay(200);
    const { id } = params;
    const exists = accounts.some((a) => a.id === id);

    if (!exists) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 }
      );
    }

    accounts = accounts.filter((a) => a.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/v1/accounts/:id/contacts
  http.get('*/api/v1/accounts/:id/contacts', async ({ params, request }) => {
    await delay(150);
    const { id } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20', 10), 100);

    const related = contacts.filter((c) => c.accountId === id);
    const total = related.length;
    const startIndex = (page - 1) * pageSize;
    const pagedData = related.slice(startIndex, startIndex + pageSize);

    const response: PaginatedResponse<Contact> = {
      data: pagedData,
      meta: { page, pageSize, total },
    };
    return HttpResponse.json(response);
  }),

  // --- CONTACTS ENDPOINTS (/api/v1/contacts) ---

  // GET /api/v1/contacts (paginated list with search and account filter)
  http.get('*/api/v1/contacts', async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const accountId = url.searchParams.get('accountId');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20', 10), 100);

    let filtered = contacts;
    if (accountId) {
      filtered = filtered.filter((c) => c.accountId === accountId);
    }
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(search) ||
          c.lastName.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const pagedData = filtered.slice(startIndex, startIndex + pageSize);

    const response: PaginatedResponse<Contact> = {
      data: pagedData,
      meta: { page, pageSize, total },
    };
    return HttpResponse.json(response);
  }),

  // POST /api/v1/contacts
  http.post('*/api/v1/contacts', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as CreateContactDTO;

    if (!body.firstName?.trim() || !body.lastName?.trim()) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'First name and last name are required',
          },
        },
        { status: 400 }
      );
    }

    if (!body.email?.trim()) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Valid email is required',
          },
        },
        { status: 400 }
      );
    }

    // Email unique check
    const duplicate = contacts.some(
      (c) => c.email.toLowerCase() === body.email.trim().toLowerCase()
    );
    if (duplicate) {
      return HttpResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: `Email '${body.email}' is already in use`,
          },
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const newContact: Contact = {
      id: `cnt-${Date.now()}`,
      accountId: body.accountId ?? null,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim(),
      phone: body.phone ?? null,
      title: body.title ?? null,
      createdAt: now,
      updatedAt: now,
    };

    contacts.unshift(newContact);
    return HttpResponse.json(newContact, { status: 201 });
  }),

  // GET /api/v1/contacts/:id
  http.get('*/api/v1/contacts/:id', async ({ params }) => {
    await delay(100);
    const { id } = params;
    const contact = contacts.find((c) => c.id === id);

    if (!contact) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    return HttpResponse.json(contact);
  }),

  // PATCH /api/v1/contacts/:id
  http.patch('*/api/v1/contacts/:id', async ({ params, request }) => {
    await delay(200);
    const { id } = params;
    const index = contacts.findIndex((c) => c.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    const updates = (await request.json()) as UpdateContactDTO;

    if (updates.email) {
      const duplicate = contacts.some(
        (c) => c.id !== id && c.email.toLowerCase() === updates.email!.trim().toLowerCase()
      );
      if (duplicate) {
        return HttpResponse.json(
          {
            error: {
              code: 'CONFLICT',
              message: `Email '${updates.email}' is already in use`,
            },
          },
          { status: 409 }
        );
      }
    }

    const existing = contacts[index];
    const updatedContact: Contact = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    contacts[index] = updatedContact;
    return HttpResponse.json(updatedContact);
  }),

  // DELETE /api/v1/contacts/:id
  http.delete('*/api/v1/contacts/:id', async ({ params }) => {
    await delay(200);
    const { id } = params;
    const exists = contacts.some((c) => c.id === id);

    if (!exists) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    contacts = contacts.filter((c) => c.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),
];
