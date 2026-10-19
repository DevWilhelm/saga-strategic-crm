import { http, HttpResponse, delay } from 'msw';
import { mockStore } from '../store';
import {
  RECORD_STATUSES,
  businessRuleError,
  conflictError,
  notFoundError,
  paginate,
  parseSort,
  requireLookupManage,
  validationError,
} from './lookupHelpers';
import type { SubCategory } from '../../types/lookup';
import type { FieldValidationError } from '../../types/account';
import type { RecordStatus } from '../../types/common';
import type { SubCategoryInput, SubCategoryRecord } from '../../types/subCategory';
import { SUB_CATEGORY_DESCRIPTION_MAX, SUB_CATEGORY_NAME_MAX } from '../../types/subCategory';

// Sub-categories live in the shared mock store, so changes here also show up
// in the Accounts form lookups (GET /api/accounts/lookups).
const findCategory = (id: string) => mockStore.categories.find((c) => c.id === id);
const isActive = (record?: { status?: RecordStatus }) => (record?.status ?? 'ACTIVE') === 'ACTIVE';

const toRecord = (s: SubCategory): SubCategoryRecord => ({
  id: s.id,
  name: s.name,
  categoryId: s.categoryId,
  categoryName: findCategory(s.categoryId)?.name ?? 'Unknown category',
  description: s.description ?? null,
  status: s.status ?? 'ACTIVE',
});

// Rules from docs/development-plan.md §7 and §10.3.
const validate = (next: SubCategory, previous?: SubCategory) => {
  const errors: FieldValidationError[] = [];
  const name = next.name.trim();
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  else if (name.length > SUB_CATEGORY_NAME_MAX)
    errors.push({ field: 'name', message: `Name must not exceed ${SUB_CATEGORY_NAME_MAX} characters` });
  if (next.description && next.description.length > SUB_CATEGORY_DESCRIPTION_MAX)
    errors.push({ field: 'description', message: `Description must not exceed ${SUB_CATEGORY_DESCRIPTION_MAX} characters` });
  if (next.status && !RECORD_STATUSES.includes(next.status))
    errors.push({ field: 'status', message: 'Status must be ACTIVE or INACTIVE' });

  const parent = next.categoryId ? findCategory(next.categoryId) : undefined;
  if (!next.categoryId) errors.push({ field: 'categoryId', message: 'Parent category is required' });
  else if (!parent) errors.push({ field: 'categoryId', message: 'Category not found' });
  if (errors.length) return validationError(errors);

  // Only create, move or activate under an active category.
  const parentChanged = !previous || previous.categoryId !== next.categoryId;
  const activating = isActive(next) && !isActive(previous ?? { status: 'INACTIVE' });
  if (!isActive(parent) && (parentChanged || activating)) {
    return businessRuleError(
      `${parent!.name} is inactive. Activate the category first, or choose an active one.`,
      parentChanged ? [{ field: 'categoryId', message: 'Choose an active category.' }] : undefined
    );
  }

  const lower = name.toLowerCase();
  if (
    mockStore.subCategories.some(
      (s) => s.id !== next.id && s.categoryId === next.categoryId && s.name.toLowerCase() === lower
    )
  ) {
    return conflictError('name', `${parent!.name} already has a sub-category named '${name}'.`);
  }
  return null;
};

const save = (next: SubCategory) => {
  const exists = mockStore.subCategories.some((s) => s.id === next.id);
  mockStore.subCategories = exists
    ? mockStore.subCategories.map((s) => (s.id === next.id ? next : s))
    : [...mockStore.subCategories, next];
  return toRecord(next);
};

export const subCategoryHandlers = [
  // GET /api/sub-categories/options?categoryId= (active only, for dependent dropdowns)
  http.get('*/api/sub-categories/options', async ({ request }) => {
    await delay(100);
    const categoryId = new URL(request.url).searchParams.get('categoryId');
    const options = mockStore.subCategories
      .filter((s) => isActive(s) && (!categoryId || s.categoryId === categoryId))
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return HttpResponse.json(options);
  }),

  // GET /api/sub-categories?q=&categoryId=&status=&page=&size=&sort=categoryName,asc
  http.get('*/api/sub-categories', async ({ request }) => {
    await delay(250);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const categoryId = url.searchParams.get('categoryId');
    const status = url.searchParams.get('status');
    const sort = parseSort(url, ['name', 'categoryName', 'status'], 'categoryName');

    const items = mockStore.subCategories
      .map(toRecord)
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .filter((s) => !categoryId || s.categoryId === categoryId)
      .filter((s) => !status || s.status === status)
      .sort((a, b) => {
        const key = sort.field as 'name' | 'categoryName' | 'status';
        // Ties (e.g. same parent) fall back to the sub-category name.
        const result = a[key].localeCompare(b[key]) || a.name.localeCompare(b.name);
        return sort.desc ? -result : result;
      });

    return HttpResponse.json(paginate(items, url));
  }),

  // POST /api/sub-categories
  http.post('*/api/sub-categories', async ({ request }) => {
    await delay(350);
    const denied = requireLookupManage('sub-categories');
    if (denied) return denied;

    const input = (await request.json().catch(() => ({}))) as Partial<SubCategoryInput>;
    const next: SubCategory = {
      id: `sub-${Date.now()}`,
      name: input.name?.trim() ?? '',
      categoryId: input.categoryId ?? '',
      description: input.description?.trim() || null,
      status: input.status ?? 'ACTIVE',
    };
    const invalid = validate(next);
    if (invalid) return invalid;
    return HttpResponse.json(save(next), { status: 201 });
  }),

  // PUT /api/sub-categories/:id
  http.put('*/api/sub-categories/:id', async ({ request, params }) => {
    await delay(350);
    const denied = requireLookupManage('sub-categories');
    if (denied) return denied;

    const previous = mockStore.subCategories.find((s) => s.id === params.id);
    if (!previous) return notFoundError('Sub-category not found');

    const input = (await request.json().catch(() => ({}))) as Partial<SubCategoryInput>;
    const next: SubCategory = {
      ...previous,
      name: input.name?.trim() ?? '',
      categoryId: input.categoryId ?? '',
      description: input.description?.trim() || null,
      status: input.status ?? 'ACTIVE',
    };
    const invalid = validate(next, previous);
    if (invalid) return invalid;
    return HttpResponse.json(save(next));
  }),

  // PATCH /api/sub-categories/:id/status
  http.patch('*/api/sub-categories/:id/status', async ({ request, params }) => {
    await delay(300);
    const denied = requireLookupManage('sub-categories');
    if (denied) return denied;

    const previous = mockStore.subCategories.find((s) => s.id === params.id);
    if (!previous) return notFoundError('Sub-category not found');

    const { status } = (await request.json().catch(() => ({}))) as { status?: RecordStatus };
    if (!status || !RECORD_STATUSES.includes(status)) {
      return validationError([{ field: 'status', message: 'Status must be ACTIVE or INACTIVE' }]);
    }
    const next: SubCategory = { ...previous, status };
    const invalid = validate(next, previous);
    if (invalid) return invalid;
    return HttpResponse.json(save(next));
  }),
];
