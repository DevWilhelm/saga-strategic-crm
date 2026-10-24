import { http, HttpResponse, delay } from 'msw';
import { mockStore } from '../store';
import {
  RECORD_STATUSES,
  conflictError,
  notFoundError,
  paginate,
  parseSort,
  requireLookupManage,
  validationError,
} from './lookupHelpers';
import type { Service } from '../../types/lookup';
import type { FieldValidationError } from '../../types/account';
import type { ServiceInput, ServiceRecord } from '../../types/service';
import { SERVICE_DESCRIPTION_MAX, SERVICE_NAME_MAX } from '../../types/service';
import type { RecordStatus } from '../../types/common';

// Services live in the shared mock store, so changes here also show up in
// the Accounts form lookups (GET /api/accounts/lookups).
const toRecord = (c: Service): ServiceRecord => ({
  id: c.id,
  name: c.name,
  description: c.description ?? null,
  status: c.status ?? 'ACTIVE',
});

const validate = (input: Partial<ServiceInput>, ownId?: string) => {
  const errors: FieldValidationError[] = [];
  const name = input.name?.trim() ?? '';
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  else if (name.length > SERVICE_NAME_MAX)
    errors.push({ field: 'name', message: `Name must not exceed ${SERVICE_NAME_MAX} characters` });
  if (input.description && input.description.length > SERVICE_DESCRIPTION_MAX)
    errors.push({ field: 'description', message: `Description must not exceed ${SERVICE_DESCRIPTION_MAX} characters` });
  if (input.status !== undefined && !RECORD_STATUSES.includes(input.status))
    errors.push({ field: 'status', message: 'Status must be ACTIVE or INACTIVE' });
  if (errors.length) return validationError(errors);

  const lower = name.toLowerCase();
  if (mockStore.services.some((c) => c.id !== ownId && c.name.toLowerCase() === lower)) {
    return conflictError('name', `A service named '${name}' already exists.`);
  }
  return null;
};

const replaceService = (id: string, changes: Partial<Service>) => {
  const index = mockStore.services.findIndex((c) => c.id === id);
  const updated = { ...mockStore.services[index], ...changes };
  mockStore.services = mockStore.services.map((c, i) => (i === index ? updated : c));
  return updated;
};

export const serviceHandlers = [
  // GET /api/services/options (active only, for dropdowns)
  http.get('*/api/services/options', async () => {
    await delay(100);
    const options = mockStore.services
      .map(toRecord)
      .filter((c) => c.status === 'ACTIVE')
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return HttpResponse.json(options);
  }),

  // GET /api/services?q=&status=&page=&size=&sort=name,asc
  http.get('*/api/services', async ({ request }) => {
    await delay(250);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const status = url.searchParams.get('status');
    const sort = parseSort(url, ['name', 'status'], 'name');

    const items = mockStore.services
      .map(toRecord)
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .filter((c) => !status || c.status === status)
      .sort((a, b) => {
        const key = sort.field as 'name' | 'status';
        const result = a[key].localeCompare(b[key]) || a.name.localeCompare(b.name);
        return sort.desc ? -result : result;
      });

    return HttpResponse.json(paginate(items, url));
  }),

  // POST /api/services
  http.post('*/api/services', async ({ request }) => {
    await delay(350);
    const denied = requireLookupManage('services');
    if (denied) return denied;

    const input = (await request.json().catch(() => ({}))) as Partial<ServiceInput>;
    const invalid = validate(input);
    if (invalid) return invalid;

    const service: Service = {
      id: `srv-${Date.now()}`,
      name: input.name!.trim(),
      description: input.description?.trim() || null,
      status: input.status ?? 'ACTIVE',
    };
    mockStore.services = [...mockStore.services, service];
    return HttpResponse.json(toRecord(service), { status: 201 });
  }),

  // PUT /api/services/:id
  http.put('*/api/services/:id', async ({ request, params }) => {
    await delay(350);
    const denied = requireLookupManage('services');
    if (denied) return denied;

    const id = String(params.id);
    if (!mockStore.services.some((c) => c.id === id)) return notFoundError('Service not found');

    const input = (await request.json().catch(() => ({}))) as Partial<ServiceInput>;
    const invalid = validate(input, id);
    if (invalid) return invalid;

    const updated = replaceService(id, {
      name: input.name!.trim(),
      description: input.description?.trim() || null,
      status: input.status ?? 'ACTIVE',
    });
    return HttpResponse.json(toRecord(updated));
  }),

  // PATCH /api/services/:id/status
  http.patch('*/api/services/:id/status', async ({ request, params }) => {
    await delay(300);
    const denied = requireLookupManage('services');
    if (denied) return denied;

    const id = String(params.id);
    if (!mockStore.services.some((c) => c.id === id)) return notFoundError('Service not found');

    const { status } = (await request.json().catch(() => ({}))) as { status?: RecordStatus };
    if (!status || !RECORD_STATUSES.includes(status)) {
      return validationError([{ field: 'status', message: 'Status must be ACTIVE or INACTIVE' }]);
    }
    return HttpResponse.json(toRecord(replaceService(id, { status })));
  }),
];
