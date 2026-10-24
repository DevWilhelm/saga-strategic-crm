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
import type { Category } from '../../types/lookup';
import type { FieldValidationError } from '../../types/account';
import type { CategoryInput, CategoryRecord } from '../../types/category';
import { CATEGORY_DESCRIPTION_MAX, CATEGORY_NAME_MAX } from '../../types/category';
import type { RecordStatus } from '../../types/common';

// Categories live in the shared mock store, so changes here also show up in
// the Accounts form lookups (GET /api/accounts/lookups).
const toRecord = (c: Category): CategoryRecord => ({
  id: c.id,
  name: c.name,
  description: c.description ?? null,
  status: c.status ?? 'ACTIVE',
});

const validate = (input: Partial<CategoryInput>, ownId?: string) => {
  const errors: FieldValidationError[] = [];
  const name = input.name?.trim() ?? '';
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  else if (name.length > CATEGORY_NAME_MAX)
    errors.push({ field: 'name', message: `Name must not exceed ${CATEGORY_NAME_MAX} characters` });
  if (input.description && input.description.length > CATEGORY_DESCRIPTION_MAX)
    errors.push({ field: 'description', message: `Description must not exceed ${CATEGORY_DESCRIPTION_MAX} characters` });
  if (input.status !== undefined && !RECORD_STATUSES.includes(input.status))
    errors.push({ field: 'status', message: 'Status must be ACTIVE or INACTIVE' });
  if (errors.length) return validationError(errors);

  const lower = name.toLowerCase();
  if (mockStore.categories.some((c) => c.id !== ownId && c.name.toLowerCase() === lower)) {
    return conflictError('name', `A category named '${name}' already exists.`);
  }
  return null;
};

const replaceCategory = (id: string, changes: Partial<Category>) => {
  const index = mockStore.categories.findIndex((c) => c.id === id);
  const updated = { ...mockStore.categories[index], ...changes };
  mockStore.categories = mockStore.categories.map((c, i) => (i === index ? updated : c));
  return updated;
};

export const categoryHandlers = [
  // GET /api/categories/options (active only, for dropdowns)
  http.get('*/api/categories/options', async () => {
    await delay(100);
    const options = mockStore.categories
      .map(toRecord)
      .filter((c) => c.status === 'ACTIVE')
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return HttpResponse.json(options);
  }),

  // GET /api/categories?q=&status=&page=&size=&sort=name,asc
  http.get('*/api/categories', async ({ request }) => {
    await delay(250);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const status = url.searchParams.get('status');
    const sort = parseSort(url, ['name', 'status'], 'name');

    const items = mockStore.categories
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

  // POST /api/categories
  http.post('*/api/categories', async ({ request }) => {
    await delay(350);
    const denied = requireLookupManage('categories');
    if (denied) return denied;

    const input = (await request.json().catch(() => ({}))) as Partial<CategoryInput>;
    const invalid = validate(input);
    if (invalid) return invalid;

    const category: Category = {
      id: `cat-${Date.now()}`,
      name: input.name!.trim(),
      description: input.description?.trim() || null,
      status: input.status ?? 'ACTIVE',
    };
    mockStore.categories = [...mockStore.categories, category];
    return HttpResponse.json(toRecord(category), { status: 201 });
  }),

  // PUT /api/categories/:id
  http.put('*/api/categories/:id', async ({ request, params }) => {
    await delay(350);
    const denied = requireLookupManage('categories');
    if (denied) return denied;

    const id = String(params.id);
    if (!mockStore.categories.some((c) => c.id === id)) return notFoundError('Category not found');

    const input = (await request.json().catch(() => ({}))) as Partial<CategoryInput>;
    const invalid = validate(input, id);
    if (invalid) return invalid;

    const updated = replaceCategory(id, {
      name: input.name!.trim(),
      description: input.description?.trim() || null,
      status: input.status ?? 'ACTIVE',
    });
    return HttpResponse.json(toRecord(updated));
  }),

  // PATCH /api/categories/:id/status
  http.patch('*/api/categories/:id/status', async ({ request, params }) => {
    await delay(300);
    const denied = requireLookupManage('categories');
    if (denied) return denied;

    const id = String(params.id);
    if (!mockStore.categories.some((c) => c.id === id)) return notFoundError('Category not found');

    const { status } = (await request.json().catch(() => ({}))) as { status?: RecordStatus };
    if (!status || !RECORD_STATUSES.includes(status)) {
      return validationError([{ field: 'status', message: 'Status must be ACTIVE or INACTIVE' }]);
    }
    return HttpResponse.json(toRecord(replaceCategory(id, { status })));
  }),
];
