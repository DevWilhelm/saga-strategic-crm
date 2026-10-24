import { http, HttpResponse, delay } from 'msw';
import { mockStore, INITIAL_CONTACTS, INITIAL_FOLLOW_UPS } from '../store';
import { businessRuleError, notFoundError, paginate, parseSort, validationError } from './lookupHelpers';
import { addDaysISO, isISODate, todayISO } from '../../utils/dates';
import type { AccountFollowUp } from '../../types/contact';
import type { FieldValidationError } from '../../types/account';
import type {
  ContactOption,
  FollowUpCounts,
  FollowUpInput,
  FollowUpRecord,
  FollowUpState,
  LogContactInput,
} from '../../types/followUp';
import { FOLLOW_UP_ACTION_MAX, FOLLOW_UP_PERIOD_MAX, FOLLOW_UP_REMARK_MAX } from '../../types/followUp';

// Follow-ups live in the shared mock store, so the Accounts pages (next
// follow-up date, "Next action" card) see every change made here.

const stateOf = (dueDate: string, today: string): FollowUpState => {
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  if (dueDate <= addDaysISO(today, 7)) return 'week';
  return 'upcoming';
};

const toRecord = (f: AccountFollowUp, today: string): FollowUpRecord => {
  const contact = mockStore.contacts.find((c) => c.id === f.contactId);
  const company = contact ? mockStore.accounts.find((a) => a.id === contact.companyId) : undefined;
  const owner = mockStore.users.find((u) => u.id === f.ownerId);
  return {
    id: f.id,
    contactId: f.contactId,
    contactName: contact?.name ?? 'Unknown contact',
    companyId: company?.id ?? null,
    companyName: company?.name ?? null,
    ownerId: f.ownerId,
    ownerName: owner?.name ?? 'Unassigned',
    action: f.action,
    dueDate: f.dueDate,
    lastContactedDate: f.lastContactedDate ?? null,
    period: f.period ?? null,
    descriptionRemark: f.descriptionRemark ?? null,
    state: stateOf(f.dueDate, today),
  };
};

const resolveOwnerFilter = (ownerId: string | null) =>
  ownerId === 'me' ? mockStore.getCurrentMockUser().id : ownerId;

// Members work on their own follow-ups; Admins and Super Admins on anyone's
// (same rule as account.edit for accounts).
const canWorkOn = (ownerId: string) => {
  const current = mockStore.getCurrentMockUser();
  return current.role === 'SUPER_ADMIN' || current.role === 'ADMIN' || current.id === ownerId;
};

const forbidden = () =>
  HttpResponse.json(
    { status: 403, error: 'Forbidden', message: 'You can only manage your own follow-ups.' },
    { status: 403 }
  );

const validate = (input: Partial<FollowUpInput>) => {
  const today = todayISO();
  const errors: FieldValidationError[] = [];
  if (!input.contactId) errors.push({ field: 'contactId', message: 'Contact is required' });
  else if (!mockStore.contacts.some((c) => c.id === input.contactId))
    errors.push({ field: 'contactId', message: 'Contact not found' });

  if (!input.ownerId) errors.push({ field: 'ownerId', message: 'Owner is required' });
  else if (!mockStore.users.some((u) => u.id === input.ownerId && u.status === 'ACTIVE'))
    errors.push({ field: 'ownerId', message: 'Owner must be an active user' });

  const action = input.action?.trim() ?? '';
  if (!action) errors.push({ field: 'action', message: 'Action is required' });
  else if (action.length > FOLLOW_UP_ACTION_MAX)
    errors.push({ field: 'action', message: `Action must not exceed ${FOLLOW_UP_ACTION_MAX} characters` });

  if (!isISODate(input.dueDate)) errors.push({ field: 'dueDate', message: 'Due date is required' });

  if (input.lastContactedDate) {
    if (!isISODate(input.lastContactedDate))
      errors.push({ field: 'lastContactedDate', message: 'Last contacted must be a valid date' });
    else if (input.lastContactedDate > today)
      errors.push({ field: 'lastContactedDate', message: 'Last contacted cannot be in the future' });
    else if (isISODate(input.dueDate) && input.dueDate < input.lastContactedDate)
      errors.push({ field: 'dueDate', message: 'Due date cannot be before the last contact' });
  }

  if (input.period !== null && input.period !== undefined) {
    if (!Number.isInteger(input.period) || input.period < 1 || input.period > FOLLOW_UP_PERIOD_MAX)
      errors.push({ field: 'period', message: `Repeat every must be a whole number from 1 to ${FOLLOW_UP_PERIOD_MAX}` });
  }

  if (input.descriptionRemark && input.descriptionRemark.length > FOLLOW_UP_REMARK_MAX)
    errors.push({ field: 'descriptionRemark', message: `Remark must not exceed ${FOLLOW_UP_REMARK_MAX} characters` });

  return errors.length ? validationError(errors) : null;
};

const fromInput = (id: string, input: Partial<FollowUpInput>): AccountFollowUp => ({
  id,
  contactId: input.contactId!,
  ownerId: input.ownerId!,
  action: input.action!.trim(),
  dueDate: input.dueDate!,
  lastContactedDate: input.lastContactedDate || null,
  period: input.period ?? null,
  descriptionRemark: input.descriptionRemark?.trim() || null,
});

// Keep the contact's "next follow-up date" (shown on Bside's account contacts
// tab) in step with its earliest follow-up.
const syncContactNextDate = (contactId: string) => {
  const next = mockStore.followUps
    .filter((f) => f.contactId === contactId)
    .map((f) => f.dueDate)
    .sort()[0] ?? null;
  mockStore.contacts = mockStore.contacts.map((c) => (c.id === contactId ? { ...c, nextFollowUpDate: next } : c));
};

const save = (next: AccountFollowUp, previousContactId?: string) => {
  const exists = mockStore.followUps.some((f) => f.id === next.id);
  mockStore.followUps = exists
    ? mockStore.followUps.map((f) => (f.id === next.id ? next : f))
    : [...mockStore.followUps, next];
  syncContactNextDate(next.contactId);
  if (previousContactId && previousContactId !== next.contactId) syncContactNextDate(previousContactId);
  return toRecord(next, todayISO());
};

// Tests call this so each test starts from the seed contacts and follow-ups.
export const resetFollowUpStore = () => {
  mockStore.contacts = INITIAL_CONTACTS.map((c) => ({ ...c }));
  mockStore.followUps = INITIAL_FOLLOW_UPS.map((f) => ({ ...f }));
};

export const followUpHandlers = [
  // GET /api/contacts/options (open contacts for the follow-up form)
  http.get('*/api/contacts/options', async () => {
    await delay(100);
    const options: ContactOption[] = mockStore.contacts
      .filter((c) => !c.isClosed)
      .map((c) => ({
        id: c.id,
        name: c.name,
        companyName: mockStore.accounts.find((a) => a.id === c.companyId)?.name ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return HttpResponse.json(options);
  }),

  // GET /api/follow-ups/counts?ownerId=
  http.get('*/api/follow-ups/counts', async ({ request }) => {
    await delay(100);
    const today = todayISO();
    const ownerId = resolveOwnerFilter(new URL(request.url).searchParams.get('ownerId'));
    const counts: FollowUpCounts = { overdue: 0, today: 0, week: 0, upcoming: 0, all: 0 };
    mockStore.followUps
      .filter((f) => !ownerId || f.ownerId === ownerId)
      .forEach((f) => {
        counts[stateOf(f.dueDate, today)] += 1;
        counts.all += 1;
      });
    return HttpResponse.json(counts);
  }),

  // GET /api/follow-ups?q=&state=&ownerId=&page=&size=&sort=dueDate,asc
  http.get('*/api/follow-ups', async ({ request }) => {
    await delay(250);
    const today = todayISO();
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const state = url.searchParams.get('state');
    const ownerId = resolveOwnerFilter(url.searchParams.get('ownerId'));
    const sort = parseSort(url, ['dueDate', 'contactName', 'ownerName'], 'dueDate');

    const items = mockStore.followUps
      .map((f) => toRecord(f, today))
      .filter((f) => !ownerId || f.ownerId === ownerId)
      .filter((f) => !state || f.state === state)
      .filter(
        (f) =>
          !q ||
          f.action.toLowerCase().includes(q) ||
          f.contactName.toLowerCase().includes(q) ||
          (f.companyName ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const key = sort.field as 'dueDate' | 'contactName' | 'ownerName';
        const result = a[key].localeCompare(b[key]) || a.dueDate.localeCompare(b.dueDate);
        return sort.desc ? -result : result;
      });

    return HttpResponse.json(paginate(items, url));
  }),

  // POST /api/follow-ups
  http.post('*/api/follow-ups', async ({ request }) => {
    await delay(350);
    const input = (await request.json().catch(() => ({}))) as Partial<FollowUpInput>;
    const invalid = validate(input);
    if (invalid) return invalid;
    if (!canWorkOn(input.ownerId!)) return forbidden();
    return HttpResponse.json(save(fromInput(`flw-${Date.now()}`, input)), { status: 201 });
  }),

  // PUT /api/follow-ups/:id
  http.put('*/api/follow-ups/:id', async ({ request, params }) => {
    await delay(350);
    const previous = mockStore.followUps.find((f) => f.id === params.id);
    if (!previous) return notFoundError('Follow-up not found');
    if (!canWorkOn(previous.ownerId)) return forbidden();

    const input = (await request.json().catch(() => ({}))) as Partial<FollowUpInput>;
    const invalid = validate(input);
    if (invalid) return invalid;
    if (!canWorkOn(input.ownerId!)) return forbidden();
    return HttpResponse.json(save(fromInput(previous.id, input), previous.contactId));
  }),

  // POST /api/follow-ups/:id/log-contact  { contactedDate, nextDueDate }
  http.post('*/api/follow-ups/:id/log-contact', async ({ request, params }) => {
    await delay(300);
    const previous = mockStore.followUps.find((f) => f.id === params.id);
    if (!previous) return notFoundError('Follow-up not found');
    if (!canWorkOn(previous.ownerId)) return forbidden();

    const today = todayISO();
    const input = (await request.json().catch(() => ({}))) as Partial<LogContactInput>;
    const errors: FieldValidationError[] = [];
    if (!isISODate(input.contactedDate)) errors.push({ field: 'contactedDate', message: 'Date contacted is required' });
    else if (input.contactedDate > today)
      errors.push({ field: 'contactedDate', message: 'Date contacted cannot be in the future' });
    if (!isISODate(input.nextDueDate)) errors.push({ field: 'nextDueDate', message: 'Next due date is required' });
    if (errors.length) return validationError(errors);
    if (input.nextDueDate! <= input.contactedDate!) {
      return businessRuleError('The next due date must be after the date contacted.', [
        { field: 'nextDueDate', message: 'Must be after the date contacted' },
      ]);
    }

    return HttpResponse.json(
      save({ ...previous, lastContactedDate: input.contactedDate!, dueDate: input.nextDueDate! })
    );
  }),
];
