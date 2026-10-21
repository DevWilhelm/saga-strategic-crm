import { http, HttpResponse, delay } from 'msw';
import { mockStore } from '../store';
import type {
  Contact,
  ContactDetail,
  PaginatedContactsResponse,
  CreateContactDTO,
  UpdateContactDTO,
  FollowUp,
  CreateFollowUpDTO,
  UpdateFollowUpDTO,
  MarkFollowUpDoneDTO,
} from '../../types/contact';
import { can } from '../../lib/permissions';
import {
  calculateNextFollowUpDate,
  getTodayDateString,
} from '../../features/contacts/utils/followUpHelpers';

// Helper to compute end of current week (Sunday)
const getEndOfWeekDateStr = (): string => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day);
  const end = new Date(d.setDate(diff));
  const y = end.getFullYear();
  const m = String(end.getMonth() + 1).padStart(2, '0');
  const dayStr = String(end.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
};

// Ensure seed data meets requirement: at least two overdue, two due today, and some contacts with none
const ensureSeedFollowUps = () => {
  const todayStr = getTodayDateString();
  const todayFollowUps = mockStore.followUps.filter((f) => !f.isDone && f.dueDate === todayStr);
  if (todayFollowUps.length < 2) {
    const candidate = mockStore.followUps.find(
      (f) => !f.isDone && f.dueDate !== todayStr && f.id === 'flw-012'
    );
    if (candidate) {
      candidate.dueDate = todayStr;
    }
  }
};
ensureSeedFollowUps();

export const contactHandlers = [
  // 1. GET /api/contacts (Paginated List with Filters, Search, Sort)
  http.get('*/api/contacts', async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);

    const q = url.searchParams.get('q')?.trim().toLowerCase() || '';
    const companyId = url.searchParams.get('companyId');
    const tier = url.searchParams.get('tier');
    const relationshipStatus = url.searchParams.get('relationshipStatus');
    const status = url.searchParams.get('status');
    const ownerId = url.searchParams.get('ownerId');
    const closed = url.searchParams.get('closed');
    const followUp = url.searchParams.get('followUp');

    const page = Math.max(0, parseInt(url.searchParams.get('page') || '0', 10));
    const size = Math.min(100, Math.max(1, parseInt(url.searchParams.get('size') || '10', 10)));
    const sortParam = url.searchParams.get('sort') || 'updatedDate,desc';

    const todayStr = getTodayDateString();
    const endOfWeekStr = getEndOfWeekDateStr();

    // Map contacts with live computed nextFollowUpDate from mockStore.followUps
    let items = mockStore.contacts.map((contact) => {
      const relatedFollowUps = mockStore.followUps.filter((f) => f.contactId === contact.id);
      const computedNextFollowUp = calculateNextFollowUpDate(relatedFollowUps);
      const matchedAccount = mockStore.accounts.find((a) => a.id === contact.companyId);
      const matchedOwner = mockStore.users.find((u) => u.id === contact.ownerId);

      return {
        ...contact,
        companyName: contact.companyName || matchedAccount?.name || 'Unknown Account',
        ownerName: contact.ownerName || matchedOwner?.name || 'Unassigned',
        ownerCode: contact.ownerCode || matchedOwner?.code || '—',
        ownerManagerId: contact.ownerManagerId || matchedOwner?.managerId || null,
        nextFollowUpDate: computedNextFollowUp ?? contact.nextFollowUpDate,
        followUpCount: relatedFollowUps.filter((f) => !f.isDone).length,
      };
    });

    // 1. Text Search across name, email, companyName, and targetRole
    if (q) {
      items = items.filter((item) => {
        return (
          item.name.toLowerCase().includes(q) ||
          (item.email && item.email.toLowerCase().includes(q)) ||
          (item.companyName && item.companyName.toLowerCase().includes(q)) ||
          (item.targetRole && item.targetRole.toLowerCase().includes(q)) ||
          (item.roleKeyword && item.roleKeyword.toLowerCase().includes(q))
        );
      });
    }

    // 2. Company Filter
    if (companyId) {
      items = items.filter((item) => item.companyId === companyId);
    }

    // 3. Tier Filter
    if (tier) {
      items = items.filter((item) => item.tier === tier);
    }

    // 4. Relationship Status Filter
    if (relationshipStatus) {
      items = items.filter((item) => item.relationshipStatus === relationshipStatus);
    }

    // 5. Status Filter
    if (status) {
      items = items.filter((item) => item.status === status);
    }

    // 6. Owner Filter
    if (ownerId) {
      items = items.filter((item) => item.ownerId === ownerId);
    }

    // 7. Closed State Filter
    if (closed === 'OPEN') {
      items = items.filter((item) => !item.isClosed);
    } else if (closed === 'CLOSED') {
      items = items.filter((item) => item.isClosed);
    }

    // 8. Follow-up Schedule Filter
    if (followUp === 'OVERDUE') {
      items = items.filter((item) => item.nextFollowUpDate && item.nextFollowUpDate < todayStr);
    } else if (followUp === 'DUE_THIS_WEEK') {
      items = items.filter(
        (item) =>
          item.nextFollowUpDate &&
          item.nextFollowUpDate >= todayStr &&
          item.nextFollowUpDate <= endOfWeekStr
      );
    } else if (followUp === 'NONE_SCHEDULED') {
      items = items.filter((item) => !item.nextFollowUpDate);
    }

    // 9. Sorting
    const [sortField, sortDirRaw] = sortParam.split(',');
    const isAsc = (sortDirRaw || 'asc').toLowerCase() === 'asc';

    items.sort((a, b) => {
      if (sortField === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return isAsc ? cmp : -cmp;
      }
      if (sortField === 'tier') {
        const cmp = a.tier.localeCompare(b.tier);
        return isAsc ? cmp : -cmp;
      }
      if (sortField === 'nextFollowUpDate') {
        // Soonest first, nulls last
        if (!a.nextFollowUpDate && !b.nextFollowUpDate) return 0;
        if (!a.nextFollowUpDate) return 1;
        if (!b.nextFollowUpDate) return -1;
        const cmp = a.nextFollowUpDate.localeCompare(b.nextFollowUpDate);
        return isAsc ? cmp : -cmp;
      }
      // Default: updatedDate
      const dateA = a.updatedDate || '';
      const dateB = b.updatedDate || '';
      const cmp = dateA.localeCompare(dateB);
      return isAsc ? cmp : -cmp;
    });

    // 10. Pagination
    const totalElements = items.length;
    const totalPages = Math.ceil(totalElements / size);
    const content = items.slice(page * size, (page + 1) * size);

    const response: PaginatedContactsResponse = {
      content,
      totalElements,
      totalPages,
      size,
      number: page,
    };

    return HttpResponse.json(response);
  }),

  // 2. GET /api/contacts/:id (Contact Detail)
  http.get('*/api/contacts/:id', async ({ params }) => {
    await delay(120);
    const { id } = params;
    const contact = mockStore.contacts.find((c) => c.id === id);

    if (!contact) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    const matchedAccount = mockStore.accounts.find((a) => a.id === contact.companyId);
    const matchedOwner = mockStore.users.find((u) => u.id === contact.ownerId);
    const relatedFollowUps = mockStore.followUps
      .filter((f) => f.contactId === contact.id)
      .sort((a, b) => {
        if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
        return a.dueDate.localeCompare(b.dueDate);
      });

    const detail: ContactDetail = {
      ...contact,
      companyName: contact.companyName || matchedAccount?.name || 'Unknown Account',
      ownerName: contact.ownerName || matchedOwner?.name || 'Unassigned',
      ownerCode: contact.ownerCode || matchedOwner?.code || '—',
      ownerManagerId: contact.ownerManagerId || matchedOwner?.managerId || null,
      nextFollowUpDate: calculateNextFollowUpDate(relatedFollowUps) ?? contact.nextFollowUpDate,
      followUpCount: relatedFollowUps.filter((f) => !f.isDone).length,
      followUps: relatedFollowUps,
    };

    return HttpResponse.json(detail);
  }),

  // 3. POST /api/contacts (Create Contact)
  http.post('*/api/contacts', async ({ request }) => {
    await delay(150);
    const currentUser = mockStore.getCurrentMockUser();
    const body = (await request.json()) as CreateContactDTO;

    if (!body.name || !body.name.trim()) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Contact name is required',
            details: [{ field: 'name', message: 'Must provide contact name' }],
          },
        },
        { status: 400 }
      );
    }

    if (!body.companyId) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Company is required',
            details: [{ field: 'companyId', message: 'Must select an associated company' }],
          },
        },
        { status: 400 }
      );
    }

    // Role-based owner assignment check:
    // MEMBER can only assign themselves
    if (currentUser.role === 'MEMBER' && body.ownerId !== currentUser.id) {
      return HttpResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Members can only create contacts assigned to themselves',
          },
        },
        { status: 403 }
      );
    }

    // Conflict Check 1: Duplicate Email
    if (body.email && body.email.trim()) {
      const emailLower = body.email.trim().toLowerCase();
      const duplicateEmail = mockStore.contacts.some(
        (c) => c.email && c.email.toLowerCase() === emailLower
      );
      if (duplicateEmail) {
        return HttpResponse.json(
          {
            error: {
              code: 'CONFLICT',
              message: `Email '${body.email}' is already associated with another contact profile.`,
            },
          },
          { status: 409 }
        );
      }
    }

    // Conflict Check 2: Duplicate Name within same Company
    const nameLower = body.name.trim().toLowerCase();
    const duplicateInCompany = mockStore.contacts.some(
      (c) => c.companyId === body.companyId && c.name.toLowerCase() === nameLower
    );
    if (duplicateInCompany) {
      return HttpResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: `A contact named '${body.name.trim()}' already exists under this company.`,
          },
        },
        { status: 409 }
      );
    }

    const todayStr = getTodayDateString();
    const matchedAccount = mockStore.accounts.find((a) => a.id === body.companyId);
    const assignedOwner = mockStore.users.find((u) => u.id === body.ownerId) || currentUser;

    const newContact: Contact = {
      id: `cnt-${Date.now()}`,
      name: body.name.trim(),
      companyId: body.companyId,
      companyName: matchedAccount?.name || 'Company',
      targetRole: body.targetRole ?? null,
      personaCategory: body.personaCategory ?? null,
      roleKeyword: body.roleKeyword ?? null,
      tier: body.tier || 'TIER_2',
      linkedinSearchName: body.linkedinSearchName ?? null,
      linkedinProfileUrl: body.linkedinProfileUrl ?? null,
      email: body.email ? body.email.trim().toLowerCase() : null,
      phoneNo: body.phoneNo ?? null,
      targetAngle: body.targetAngle ?? null,
      status: body.status || 'ACTIVE',
      nextStep: body.nextStep ?? null,
      ownerId: body.ownerId,
      ownerName: assignedOwner.name,
      ownerCode: assignedOwner.code,
      ownerManagerId: assignedOwner.managerId,
      note: body.note ?? null,
      relationshipStatus: body.relationshipStatus || 'WARM',
      isClosed: Boolean(body.isClosed),
      remark: body.remark ?? null,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdDate: todayStr,
      updatedBy: currentUser.id,
      updatedByName: currentUser.name,
      updatedDate: todayStr,
      nextFollowUpDate: null,
      followUpCount: 0,
    };

    mockStore.contacts.unshift(newContact);
    return HttpResponse.json(newContact, { status: 201 });
  }),

  // 4. PUT /api/contacts/:id (Update Contact)
  http.put('*/api/contacts/:id', async ({ params, request }) => {
    await delay(150);
    const { id } = params;
    const currentUser = mockStore.getCurrentMockUser();
    const contactIndex = mockStore.contacts.findIndex((c) => c.id === id);

    if (contactIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    const existing = mockStore.contacts[contactIndex];

    // Resource-level permission evaluation
    const canEdit = can(
      'contact.edit',
      { ownerId: existing.ownerId, ownerManagerId: existing.ownerManagerId },
      currentUser
    );
    if (!canEdit) {
      return HttpResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit this contact.',
          },
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as UpdateContactDTO;

    // Conflict Check 1: Duplicate Email on edit
    if (body.email && body.email.trim()) {
      const emailLower = body.email.trim().toLowerCase();
      const duplicateEmail = mockStore.contacts.some(
        (c) => c.id !== id && c.email && c.email.toLowerCase() === emailLower
      );
      if (duplicateEmail) {
        return HttpResponse.json(
          {
            error: {
              code: 'CONFLICT',
              message: `Email '${body.email}' is already associated with another contact profile.`,
            },
          },
          { status: 409 }
        );
      }
    }

    // Conflict Check 2: Duplicate Name within company on edit
    if (body.name || body.companyId) {
      const targetName = (body.name || existing.name).trim().toLowerCase();
      const targetCompany = body.companyId || existing.companyId;
      const duplicateInCompany = mockStore.contacts.some(
        (c) => c.id !== id && c.companyId === targetCompany && c.name.toLowerCase() === targetName
      );
      if (duplicateInCompany) {
        return HttpResponse.json(
          {
            error: {
              code: 'CONFLICT',
              message: `A contact named '${body.name || existing.name}' already exists under this company.`,
            },
          },
          { status: 409 }
        );
      }
    }

    const todayStr = getTodayDateString();
    const matchedAccount = body.companyId
      ? mockStore.accounts.find((a) => a.id === body.companyId)
      : undefined;
    const assignedOwner = body.ownerId
      ? mockStore.users.find((u) => u.id === body.ownerId)
      : undefined;

    const updatedContact: Contact = {
      ...existing,
      ...body,
      name: body.name ? body.name.trim() : existing.name,
      companyId: body.companyId || existing.companyId,
      companyName: matchedAccount?.name || existing.companyName,
      ownerId: body.ownerId || existing.ownerId,
      ownerName: assignedOwner?.name || existing.ownerName,
      ownerCode: assignedOwner?.code || existing.ownerCode,
      ownerManagerId: assignedOwner ? assignedOwner.managerId : existing.ownerManagerId,
      email: body.email !== undefined ? (body.email ? body.email.trim().toLowerCase() : null) : existing.email,
      updatedBy: currentUser.id,
      updatedByName: currentUser.name,
      updatedDate: todayStr,
    };

    mockStore.contacts[contactIndex] = updatedContact;
    return HttpResponse.json(updatedContact);
  }),

  // 5. PATCH /api/contacts/:id/closed (Toggle Closed State)
  http.patch('*/api/contacts/:id/closed', async ({ params, request }) => {
    await delay(120);
    const { id } = params;
    const currentUser = mockStore.getCurrentMockUser();
    const contactIndex = mockStore.contacts.findIndex((c) => c.id === id);

    if (contactIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    const existing = mockStore.contacts[contactIndex];
    const canClose = can(
      'contact.close',
      { ownerId: existing.ownerId, ownerManagerId: existing.ownerManagerId },
      currentUser
    );
    if (!canClose) {
      return HttpResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to close or reopen this contact.',
          },
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { isClosed: boolean };
    const todayStr = getTodayDateString();

    const updatedContact: Contact = {
      ...existing,
      isClosed: Boolean(body.isClosed),
      updatedBy: currentUser.id,
      updatedByName: currentUser.name,
      updatedDate: todayStr,
    };

    mockStore.contacts[contactIndex] = updatedContact;
    return HttpResponse.json(updatedContact);
  }),

  // 6. DELETE /api/contacts/:id
  http.delete('*/api/contacts/:id', async ({ params }) => {
    await delay(150);
    const { id } = params;
    const currentUser = mockStore.getCurrentMockUser();
    const contactIndex = mockStore.contacts.findIndex((c) => c.id === id);

    if (contactIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    const existing = mockStore.contacts[contactIndex];
    const canDel = can(
      'contact.delete',
      { ownerId: existing.ownerId, ownerManagerId: existing.ownerManagerId },
      currentUser
    );
    if (!canDel) {
      return HttpResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this contact.',
          },
        },
        { status: 403 }
      );
    }

    mockStore.contacts.splice(contactIndex, 1);
    // Also remove associated follow-ups
    mockStore.followUps = mockStore.followUps.filter((f) => f.contactId !== id);

    return new HttpResponse(null, { status: 204 });
  }),

  // 7. GET /api/contacts/:id/follow-ups
  http.get('*/api/contacts/:id/follow-ups', async ({ params }) => {
    await delay(100);
    const { id } = params;
    const followUps = mockStore.followUps
      .filter((f) => f.contactId === id)
      .sort((a, b) => {
        if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
        return a.dueDate.localeCompare(b.dueDate);
      });

    return HttpResponse.json(followUps);
  }),

  // 8. POST /api/contacts/:id/follow-ups
  http.post('*/api/contacts/:id/follow-ups', async ({ params, request }) => {
    await delay(150);
    const { id: contactId } = params;
    const currentUser = mockStore.getCurrentMockUser();
    const contact = mockStore.contacts.find((c) => c.id === contactId);

    if (!contact) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    const canManage = can(
      'followup.manage',
      { ownerId: contact.ownerId, ownerManagerId: contact.ownerManagerId },
      currentUser
    );
    if (!canManage) {
      return HttpResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to schedule follow-ups on this contact.',
          },
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as CreateFollowUpDTO;
    if (!body.action || !body.action.trim()) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Action description is required',
          },
        },
        { status: 400 }
      );
    }
    if (!body.dueDate) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Due date is required',
          },
        },
        { status: 400 }
      );
    }

    const todayStr = getTodayDateString();
    const assignedOwner = mockStore.users.find((u) => u.id === body.ownerId) || currentUser;

    const newFollowUp: FollowUp = {
      id: `flw-${Date.now()}`,
      contactId: String(contactId),
      lastContactedDate: body.lastContactedDate || null,
      period: body.period || null,
      dueDate: body.dueDate,
      descriptionRemark: body.descriptionRemark || null,
      ownerId: body.ownerId || currentUser.id,
      ownerName: assignedOwner.name,
      action: body.action.trim(),
      isDone: false,
      doneDate: null,
      resultNote: null,
      createdDate: todayStr,
      updatedDate: todayStr,
    };

    mockStore.followUps.unshift(newFollowUp);
    return HttpResponse.json(newFollowUp, { status: 201 });
  }),

  // 9. PUT /api/follow-ups/:id
  http.put('*/api/follow-ups/:id', async ({ params, request }) => {
    await delay(120);
    const { id } = params;
    const currentUser = mockStore.getCurrentMockUser();
    const index = mockStore.followUps.findIndex((f) => f.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Follow-up not found' } },
        { status: 404 }
      );
    }

    const existing = mockStore.followUps[index];
    const canManage = can(
      'followup.manage',
      { ownerId: existing.ownerId },
      currentUser
    );
    if (!canManage) {
      return HttpResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to modify this follow-up.',
          },
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as UpdateFollowUpDTO;
    const todayStr = getTodayDateString();
    const assignedOwner = body.ownerId
      ? mockStore.users.find((u) => u.id === body.ownerId)
      : undefined;

    const updated: FollowUp = {
      ...existing,
      ...body,
      action: body.action ? body.action.trim() : existing.action,
      ownerName: assignedOwner?.name || existing.ownerName,
      updatedDate: todayStr,
    };

    mockStore.followUps[index] = updated;
    return HttpResponse.json(updated);
  }),

  // 10. DELETE /api/follow-ups/:id
  http.delete('*/api/follow-ups/:id', async ({ params }) => {
    await delay(120);
    const { id } = params;
    const currentUser = mockStore.getCurrentMockUser();
    const index = mockStore.followUps.findIndex((f) => f.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Follow-up not found' } },
        { status: 404 }
      );
    }

    const existing = mockStore.followUps[index];
    const canManage = can(
      'followup.manage',
      { ownerId: existing.ownerId },
      currentUser
    );
    if (!canManage) {
      return HttpResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this follow-up.',
          },
        },
        { status: 403 }
      );
    }

    mockStore.followUps.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // 11. PATCH /api/follow-ups/:id/done (Mark as Done with optional next follow-up)
  http.patch('*/api/follow-ups/:id/done', async ({ params, request }) => {
    await delay(150);
    const { id } = params;
    const currentUser = mockStore.getCurrentMockUser();
    const index = mockStore.followUps.findIndex((f) => f.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Follow-up not found' } },
        { status: 404 }
      );
    }

    const existing = mockStore.followUps[index];
    const body = (await request.json()) as MarkFollowUpDoneDTO;

    if (!body.resultNote || !body.resultNote.trim()) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Outcome result note is required when marking follow-up as done',
          },
        },
        { status: 400 }
      );
    }

    const todayStr = getTodayDateString();
    const updated: FollowUp = {
      ...existing,
      isDone: true,
      doneDate: todayStr,
      resultNote: body.resultNote.trim(),
      updatedDate: todayStr,
    };

    mockStore.followUps[index] = updated;

    // If user requested scheduling next follow-up, create it
    if (body.scheduleNext && body.scheduleNext.dueDate && body.scheduleNext.action) {
      const nextOwner = mockStore.users.find((u) => u.id === body.scheduleNext?.ownerId) || currentUser;
      const nextFollowUp: FollowUp = {
        id: `flw-${Date.now()}`,
        contactId: existing.contactId,
        lastContactedDate: todayStr,
        period: body.scheduleNext.period || null,
        dueDate: body.scheduleNext.dueDate,
        descriptionRemark: body.scheduleNext.descriptionRemark || null,
        ownerId: body.scheduleNext.ownerId || currentUser.id,
        ownerName: nextOwner.name,
        action: body.scheduleNext.action.trim(),
        isDone: false,
        doneDate: null,
        resultNote: null,
        createdDate: todayStr,
        updatedDate: todayStr,
      };
      mockStore.followUps.unshift(nextFollowUp);
    }

    return HttpResponse.json(updated);
  }),

  // 12. POST /api/contacts/import (Validate & Commit spreadsheet rows)
  http.post('*/api/contacts/import', async ({ request }) => {
    await delay(300);
    const currentUser = mockStore.getCurrentMockUser();
    const body = (await request.json()) as {
      mode: 'VALIDATE_ONLY' | 'COMMIT';
      contacts: Array<CreateContactDTO & { companyName?: string; ownerUsername?: string }>;
      duplicatePolicy?: 'SKIP' | 'ALLOW';
    };

    const duplicatePolicy = body.duplicatePolicy || 'SKIP';
    const isCommit = body.mode === 'COMMIT';
    const rows = body.contacts || [];

    const errors: Array<{ row: number; column?: string; message: string }> = [];
    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const todayStr = getTodayDateString();

    rows.forEach((row, index) => {
      const rowNum = index + 1;

      // 1. Required Name
      if (!row.name || !row.name.trim()) {
        errors.push({ row: rowNum, column: 'Name', message: 'Name is required' });
        failedCount++;
        return;
      }

      // 2. Resolve Company by exact case-insensitive name match
      let resolvedCompanyId = row.companyId;
      if (!resolvedCompanyId && row.companyName) {
        const found = mockStore.accounts.find(
          (a) => a.name.toLowerCase() === row.companyName!.trim().toLowerCase()
        );
        if (found) {
          resolvedCompanyId = found.id;
        }
      }

      if (!resolvedCompanyId) {
        errors.push({
          row: rowNum,
          column: 'Company',
          message: `Unknown company '${row.companyName || ''}'. Company must match an existing CRM Account.`,
        });
        failedCount++;
        return;
      }

      // 3. Resolve Owner by Username
      let resolvedOwnerId = row.ownerId;
      if (!resolvedOwnerId && row.ownerUsername) {
        const foundUser = mockStore.users.find(
          (u) => u.username.toLowerCase() === row.ownerUsername!.trim().toLowerCase()
        );
        if (foundUser) {
          resolvedOwnerId = foundUser.id;
        }
      }

      // Member security constraint: Member can only use own username
      if (currentUser.role === 'MEMBER') {
        resolvedOwnerId = currentUser.id;
      } else if (!resolvedOwnerId) {
        resolvedOwnerId = currentUser.id;
      }

      // 4. Duplicate checks
      // Rule: same email, or same name within same company
      const emailMatch = row.email
        ? mockStore.contacts.some((c) => c.email && c.email.toLowerCase() === row.email!.trim().toLowerCase())
        : false;
      const nameCompanyMatch = mockStore.contacts.some(
        (c) =>
          c.companyId === resolvedCompanyId &&
          c.name.toLowerCase() === row.name.trim().toLowerCase()
      );

      if (emailMatch || nameCompanyMatch) {
        if (duplicatePolicy === 'SKIP') {
          skippedCount++;
          return;
        }
      }

      // Row is valid!
      createdCount++;

      if (isCommit) {
        const account = mockStore.accounts.find((a) => a.id === resolvedCompanyId);
        const owner = mockStore.users.find((u) => u.id === resolvedOwnerId) || currentUser;

        const importedContact: Contact = {
          id: `cnt-${Date.now()}-${index}`,
          name: row.name.trim(),
          companyId: resolvedCompanyId,
          companyName: account?.name || 'Company',
          targetRole: row.targetRole || null,
          personaCategory: row.personaCategory || null,
          roleKeyword: row.roleKeyword || null,
          tier: row.tier || 'TIER_2',
          linkedinSearchName: row.linkedinSearchName || null,
          linkedinProfileUrl: row.linkedinProfileUrl || null,
          email: row.email ? row.email.trim().toLowerCase() : null,
          phoneNo: row.phoneNo || null,
          targetAngle: row.targetAngle || null,
          status: row.status || 'ACTIVE',
          nextStep: row.nextStep || null,
          ownerId: resolvedOwnerId,
          ownerName: owner.name,
          ownerCode: owner.code,
          ownerManagerId: owner.managerId,
          note: row.note || null,
          relationshipStatus: row.relationshipStatus || 'WARM',
          isClosed: Boolean(row.isClosed),
          remark: row.remark || null,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          createdDate: todayStr,
          updatedBy: currentUser.id,
          updatedByName: currentUser.name,
          updatedDate: todayStr,
          nextFollowUpDate: null,
          followUpCount: 0,
        };

        mockStore.contacts.push(importedContact);
      }
    });

    return HttpResponse.json({
      mode: body.mode,
      totalProcessed: rows.length,
      createdCount,
      skippedCount,
      failedCount,
      errors,
    });
  }),
];
