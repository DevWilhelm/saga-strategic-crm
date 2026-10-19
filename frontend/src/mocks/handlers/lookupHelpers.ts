import { HttpResponse } from 'msw';
import { mockStore, MOCK_CATEGORIES, MOCK_SUB_CATEGORIES } from '../store';
import { ROLE_PRESET_PERMISSIONS } from '../../constants/users';
import type { FieldValidationError } from '../../types/account';
import type { RecordStatus } from '../../types/common';

export const RECORD_STATUSES: RecordStatus[] = ['ACTIVE', 'INACTIVE'];

// Writes to categories, sub-categories and services need lookup.manage.
export const requireLookupManage = (what: string) => {
  const current = mockStore.getCurrentMockUser();
  if (ROLE_PRESET_PERMISSIONS[current.role]?.includes('lookup.manage')) return null;
  return HttpResponse.json(
    { status: 403, error: 'Forbidden', message: `You do not have permission to manage ${what}.` },
    { status: 403 }
  );
};

export const validationError = (errors: FieldValidationError[]) =>
  HttpResponse.json({ status: 400, error: 'Bad Request', message: 'Validation failed', errors }, { status: 400 });

export const conflictError = (field: string, message: string) =>
  HttpResponse.json(
    { status: 409, error: 'Conflict', message, errors: [{ field, message }] },
    { status: 409 }
  );

export const notFoundError = (message: string) =>
  HttpResponse.json({ status: 404, error: 'Not Found', message }, { status: 404 });

export const businessRuleError = (message: string, errors?: FieldValidationError[]) =>
  HttpResponse.json(
    { status: 422, error: 'Unprocessable Entity', message, ...(errors ? { errors } : {}) },
    { status: 422 }
  );

// Spring-style page: `page` is 0-based.
export const paginate = <T,>(items: T[], url: URL) => {
  const page = Math.max(0, parseInt(url.searchParams.get('page') || '0', 10));
  const size = Math.min(100, Math.max(1, parseInt(url.searchParams.get('size') || '10', 10)));
  return {
    content: items.slice(page * size, page * size + size),
    page,
    size,
    totalElements: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
  };
};

export const parseSort = (url: URL, allowed: readonly string[], fallback: string) => {
  const [field = fallback, direction = 'asc'] = (url.searchParams.get('sort') || `${fallback},asc`).split(',');
  return {
    field: allowed.includes(field) ? field : fallback,
    desc: direction.toLowerCase() === 'desc',
  };
};

// Tests call this so each test starts from the seed categories and sub-categories.
export const resetLookupStore = () => {
  mockStore.categories = MOCK_CATEGORIES.map((c) => ({ ...c }));
  mockStore.subCategories = MOCK_SUB_CATEGORIES.map((s) => ({ ...s }));
};
