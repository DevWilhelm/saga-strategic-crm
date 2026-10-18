import { http, HttpResponse, delay } from 'msw';
import { mockStore } from '../store';
import type {
  User,
  UserListItem,
  CurrentUser,
  UserOption,
  CreateUserDTO,
  UpdateUserDTO,
  UpdateMyProfileDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  PaginatedUsersResponse,
} from '../../types/user';
import { ROLE_PRESET_PERMISSIONS, type UserStatus } from '../../constants/users';
import type { FieldValidationError } from '../../types/account';

const getTodayDateStr = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const validatePasswordComplexity = (password: string): string | null => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must contain at least one letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};

const validateEmailFormat = (email?: string | null): string | null => {
  if (!email || !email.trim()) return null;
  const trimmed = email.trim();
  if (trimmed.length > 254) return 'Email must not exceed 254 characters';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address';
  return null;
};

const validatePhoneFormat = (phone?: string | null): string | null => {
  if (!phone || !phone.trim()) return null;
  const trimmed = phone.trim();
  if (trimmed.length > 20) return 'Phone must not exceed 20 characters';
  if (!/^[0-9+\-() ]+$/.test(trimmed)) return 'Phone contains invalid characters (allowed: digits, spaces, +, -, (, ))';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7) return 'Phone must contain at least 7 digits';
  return null;
};

export const userHandlers = [
  // 1. GET /api/me (Current Authenticated User)
  http.get('*/api/me', async () => {
    await delay(100);
    const current = mockStore.getCurrentMockUser();
    const me: CurrentUser = {
      id: current.id,
      name: current.name,
      code: current.code,
      username: current.username,
      role: current.role,
      status: current.status,
      email: current.email ?? null,
      phone: current.phone ?? null,
      photoUrl: current.photoUrl ?? null,
      permissions: current.permissions,
    };
    return HttpResponse.json(me);
  }),

  // NEW: PUT /api/me (Update Current User's Profile - Name, Email, Phone ONLY)
  http.put('*/api/me', async ({ request }) => {
    await delay(150);
    const currentUser = mockStore.getCurrentMockUser();
    const body = (await request.json()) as UpdateMyProfileDTO & Record<string, unknown>;

    // SECURITY & BUSINESS RULE:
    // /api/me is self-service and allowed for all roles (ADMIN, MEMBER, VIEWER).
    // The request body must contain ONLY the user's name, email, and phone.
    // The server and mock must strictly ignore or reject username, code, role, and status:
    // a user can NEVER change their own role (preventing privilege escalation, e.g. promoting self to ADMIN)
    // or status (preventing self-reactivation or bypassing deactivation rules) through this endpoint.
    // Privileged mutations must be performed exclusively by authorized administrators via /api/users endpoints.

    const errors: FieldValidationError[] = [];
    if (!body.name || !body.name.trim()) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (body.name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
    }

    const emailErr = validateEmailFormat(body.email);
    if (emailErr) {
      errors.push({ field: 'email', message: emailErr });
    }

    const phoneErr = validatePhoneFormat(body.phone);
    if (phoneErr) {
      errors.push({ field: 'phone', message: phoneErr });
    }

    if (errors.length > 0) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Validation failed for profile payload',
          errors,
        },
        { status: 400 }
      );
    }

    const todayStr = getTodayDateStr();
    currentUser.name = body.name.trim();
    currentUser.email = body.email && body.email.trim() ? body.email.trim().toLowerCase() : null;
    currentUser.phone = body.phone && body.phone.trim() ? body.phone.trim() : null;
    currentUser.updatedDate = todayStr;

    // Return the updated CurrentUser object
    const me: CurrentUser = {
      id: currentUser.id,
      name: currentUser.name,
      code: currentUser.code,
      username: currentUser.username,
      role: currentUser.role,
      status: currentUser.status,
      email: currentUser.email,
      phone: currentUser.phone,
      photoUrl: currentUser.photoUrl ?? null,
      permissions: currentUser.permissions,
    };
    return HttpResponse.json(me);
  }),

  // POST /api/me/photo (Upload Profile Photo - multipart/form-data)
  http.post('*/api/me/photo', async ({ request }) => {
    await delay(200);
    const currentUser = mockStore.getCurrentMockUser();

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Expected multipart/form-data with file field',
          errors: [{ field: 'file', message: 'Valid multipart/form-data required' }],
        },
        { status: 400 }
      );
    }

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Profile photo file is required',
          errors: [{ field: 'file', message: 'Profile photo file is required' }],
        },
        { status: 400 }
      );
    }

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Invalid file format',
          errors: [{ field: 'file', message: 'Choose a JPG, PNG or WebP image' }],
        },
        { status: 400 }
      );
    }

    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_SIZE_BYTES) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'File size exceeds limit',
          errors: [{ field: 'file', message: 'Image must be 2 MB or smaller' }],
        },
        { status: 400 }
      );
    }

    // Verify image square aspect ratio (width === height)
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        if (bitmap.width !== bitmap.height) {
          bitmap.close();
          return HttpResponse.json(
            {
              status: 400,
              error: 'Bad Request',
              message: 'Image must be square',
              errors: [{ field: 'file', message: 'Image must be square (width equals height)' }],
            },
            { status: 400 }
          );
        }
        bitmap.close();
      } catch {
        // Continue if decode unavailable in test environment
      }
    }

    // In browser / DOM environment, create an object URL or data URL to inspect dimensions and store
    let photoUrl: string;
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      photoUrl = URL.createObjectURL(file);
    } else {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      photoUrl = `data:${file.type};base64,${btoa(binary)}`;
    }

    currentUser.photoUrl = photoUrl;
    currentUser.updatedDate = getTodayDateStr();

    return HttpResponse.json({ photoUrl });
  }),

  // DELETE /api/me/photo (Remove Profile Photo)
  http.delete('*/api/me/photo', async () => {
    await delay(150);
    const currentUser = mockStore.getCurrentMockUser();
    currentUser.photoUrl = null;
    currentUser.updatedDate = getTodayDateStr();
    return new HttpResponse(null, { status: 204 });
  }),

  // 3. GET /api/users/options (Active Users for Dropdowns / Lookups - id, name, code, photoUrl ONLY)
  // Must be placed before /api/users/:id to avoid route collision
  http.get('*/api/users/options', async () => {
    await delay(80);
    const options: UserOption[] = mockStore.users
      .filter((u) => u.status === 'ACTIVE')
      .map((u) => ({
        id: u.id,
        name: u.name,
        code: u.code,
        photoUrl: u.photoUrl ?? null,
      }));
    return HttpResponse.json(options);
  }),

  // 2. GET /api/users (Paginated User List with Counts - ADMIN Only)
  http.get('*/api/users', async ({ request }) => {
    await delay(150);
    const currentUser = mockStore.getCurrentMockUser();

    // Permission check: requires user.manage
    if (!currentUser.permissions.includes('user.manage') && currentUser.role !== 'ADMIN') {
      return HttpResponse.json(
        {
          status: 403,
          error: 'Forbidden',
          message: 'Access denied. You do not have permission to manage users.',
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim().toLowerCase() || '';
    const role = url.searchParams.get('role');
    const status = url.searchParams.get('status');
    const page = Math.max(0, parseInt(url.searchParams.get('page') || '0', 10));
    const size = Math.min(100, Math.max(1, parseInt(url.searchParams.get('size') || '10', 10)));
    const sortParam = url.searchParams.get('sort') || 'name,asc';

    // Sort validation: only name and updatedDate allowed
    const ALLOWED_SORT_FIELDS = ['name', 'updatedDate'];
    const [sortField = 'name', sortDirection = 'asc'] = sortParam.split(',');
    const normalizedDir = sortDirection.toLowerCase();

    if (!ALLOWED_SORT_FIELDS.includes(sortField) || !['asc', 'desc'].includes(normalizedDir)) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: `Invalid sort parameter '${sortParam}'. Allowed fields: name, updatedDate (format: field,asc|desc)`,
          errors: [
            {
              field: 'sort',
              message: `Invalid sort field '${sortField}'. Allowed fields: name, updatedDate`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Filter users
    const filtered = mockStore.users.filter((user) => {
      if (q) {
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesUsername = user.username.toLowerCase().includes(q);
        const matchesCode = user.code.toLowerCase().includes(q);
        if (!matchesName && !matchesUsername && !matchesCode) return false;
      }
      if (role && user.role !== role) return false;
      if (status && user.status !== status) return false;
      return true;
    });

    // Enrich with dynamic accountCount and contactCount from shared store
    const enriched: UserListItem[] = filtered.map((u) => {
      const accountCount = mockStore.accounts.filter((a) => a.ownerId === u.id).length;
      // Contacts belonging to accounts owned by this user
      const ownedAccountIds = mockStore.accounts
        .filter((a) => a.ownerId === u.id)
        .map((a) => a.id);
      const contactCount = mockStore.contacts.filter((c) => ownedAccountIds.includes(c.companyId)).length;

      return {
        ...u,
        accountCount,
        contactCount,
      };
    });

    // Sort users
    const isDesc = normalizedDir === 'desc';
    enriched.sort((a, b) => {
      const valA = sortField === 'updatedDate' ? a.updatedDate : a.name;
      const valB = sortField === 'updatedDate' ? b.updatedDate : b.name;
      const cmp = valA.localeCompare(valB);
      return isDesc ? -cmp : cmp;
    });

    // Pagination
    const totalElements = enriched.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = enriched.slice(start, start + size);

    const response: PaginatedUsersResponse = {
      content,
      page,
      size,
      totalElements,
      totalPages,
    };

    return HttpResponse.json(response);
  }),

  // 4. GET /api/users/:id (User Detail with Counts - ADMIN Only)
  http.get('*/api/users/:id', async ({ params }) => {
    await delay(120);
    const currentUser = mockStore.getCurrentMockUser();

    if (!currentUser.permissions.includes('user.manage') && currentUser.role !== 'ADMIN') {
      return HttpResponse.json(
        { status: 403, error: 'Forbidden', message: 'Access denied.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const user = mockStore.users.find((u) => u.id === id);

    if (!user) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: `User with id '${id}' not found.` },
        { status: 404 }
      );
    }

    const accountCount = mockStore.accounts.filter((a) => a.ownerId === user.id).length;
    const ownedAccountIds = mockStore.accounts.filter((a) => a.ownerId === user.id).map((a) => a.id);
    const contactCount = mockStore.contacts.filter((c) => ownedAccountIds.includes(c.companyId)).length;

    const detail: UserListItem = {
      ...user,
      accountCount,
      contactCount,
    };

    return HttpResponse.json(detail);
  }),

  // 5. POST /api/users (Create User - ADMIN Only)
  http.post('*/api/users', async ({ request }) => {
    await delay(200);
    const currentUser = mockStore.getCurrentMockUser();

    if (!currentUser.permissions.includes('user.manage') && currentUser.role !== 'ADMIN') {
      return HttpResponse.json(
        { status: 403, error: 'Forbidden', message: 'Access denied. You cannot create users.' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as CreateUserDTO;
    const errors: FieldValidationError[] = [];

    // Validations
    if (!body.name || !body.name.trim()) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (body.name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
    }

    if (body.code && body.code.trim()) {
      if (body.code.trim().length > 20) {
        errors.push({ field: 'code', message: 'Code must not exceed 20 characters' });
      }
      const duplicateCode = mockStore.users.some(
        (u) => u.code.toLowerCase() === body.code!.trim().toLowerCase()
      );
      if (duplicateCode) {
        errors.push({ field: 'code', message: `Code '${body.code}' is already taken` });
      }
    }

    if (!body.username || !body.username.trim()) {
      errors.push({ field: 'username', message: 'Username is required' });
    } else {
      const username = body.username.trim();
      if (username.length < 3 || username.length > 50) {
        errors.push({ field: 'username', message: 'Username must be between 3 and 50 characters' });
      } else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
        errors.push({
          field: 'username',
          message: 'Username may only contain letters, numbers, dots, and underscores',
        });
      } else {
        const duplicateUsername = mockStore.users.some(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );
        if (duplicateUsername) {
          errors.push({ field: 'username', message: `Username '${username}' is already in use` });
        }
      }
    }

    const passwordError = validatePasswordComplexity(body.password);
    if (passwordError) {
      errors.push({ field: 'password', message: passwordError });
    }

    if (!body.role) {
      errors.push({ field: 'role', message: 'Role is required' });
    }

    const emailErr = validateEmailFormat(body.email);
    if (emailErr) {
      errors.push({ field: 'email', message: emailErr });
    }

    const phoneErr = validatePhoneFormat(body.phone);
    if (phoneErr) {
      errors.push({ field: 'phone', message: phoneErr });
    }

    if (errors.length > 0) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Validation failed for user payload',
          errors,
        },
        { status: 400 }
      );
    }

    const todayStr = getTodayDateStr();
    const newUserId = `usr-${Date.now()}`;
    const permissions = body.permissions && body.permissions.length > 0
      ? body.permissions
      : ROLE_PRESET_PERMISSIONS[body.role] || [];

    const newUser: User = {
      id: newUserId,
      name: body.name.trim(),
      code: body.code ? body.code.trim().toUpperCase() : body.name.slice(0, 2).toUpperCase(),
      username: body.username.trim(),
      role: body.role,
      status: body.status || 'ACTIVE',
      email: body.email && body.email.trim() ? body.email.trim().toLowerCase() : null,
      phone: body.phone && body.phone.trim() ? body.phone.trim() : null,
      photoUrl: null, // Admin cannot upload or set someone else's photo
      permissions,
      createdDate: todayStr,
      updatedDate: todayStr,
    };

    // Simulate password storage in private store
    mockStore.setPassword(newUserId, body.password);
    mockStore.users.unshift(newUser);

    // Return created user WITHOUT password
    return HttpResponse.json(newUser, { status: 201 });
  }),

  // 6. PUT /api/users/:id (Update User - ADMIN Only)
  http.put('*/api/users/:id', async ({ params, request }) => {
    await delay(200);
    const currentUser = mockStore.getCurrentMockUser();

    if (!currentUser.permissions.includes('user.manage') && currentUser.role !== 'ADMIN') {
      return HttpResponse.json(
        { status: 403, error: 'Forbidden', message: 'Access denied.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const index = mockStore.users.findIndex((u) => u.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: `User with id '${id}' not found.` },
        { status: 404 }
      );
    }

    const body = (await request.json()) as UpdateUserDTO;
    const existing = mockStore.users[index];

    // Business Rule 1: Self-deactivation forbidden (409 Conflict)
    if (currentUser.id === id && body.status === 'INACTIVE') {
      return HttpResponse.json(
        {
          status: 409,
          error: 'Conflict',
          message: 'You cannot deactivate your own active account.',
        },
        { status: 409 }
      );
    }

    // Business Rule 2: Last active Admin protection (409 Conflict)
    const activeAdmins = mockStore.users.filter(
      (u) => u.status === 'ACTIVE' && u.role === 'ADMIN'
    );
    const isTargetOnlyAdmin = activeAdmins.length === 1 && activeAdmins[0].id === id;

    if (isTargetOnlyAdmin) {
      const isDemotingOrDeactivating =
        body.status === 'INACTIVE' || body.role !== 'ADMIN';

      if (isDemotingOrDeactivating) {
        return HttpResponse.json(
          {
            status: 409,
            error: 'Conflict',
            message: 'Cannot deactivate or demote the only active Administrator in the system.',
          },
          { status: 409 }
        );
      }
    }

    const errors: FieldValidationError[] = [];

    if (!body.name || !body.name.trim()) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (body.name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
    }

    if (body.code && body.code.trim()) {
      if (body.code.trim().length > 20) {
        errors.push({ field: 'code', message: 'Code must not exceed 20 characters' });
      }
      const duplicateCode = mockStore.users.some(
        (u) => u.id !== id && u.code && u.code.toLowerCase() === body.code!.trim().toLowerCase()
      );
      if (duplicateCode) {
        errors.push({ field: 'code', message: `Code '${body.code}' is already taken` });
      }
    }

    if (!body.username || !body.username.trim()) {
      errors.push({ field: 'username', message: 'Username is required' });
    } else {
      const username = body.username.trim();
      const duplicateUsername = mockStore.users.some(
        (u) => u.id !== id && u.username.toLowerCase() === username.toLowerCase()
      );
      if (duplicateUsername) {
        errors.push({ field: 'username', message: `Username '${username}' is already in use` });
      }
    }

    if (!body.role || !['ADMIN', 'MEMBER', 'VIEWER'].includes(body.role)) {
      errors.push({ field: 'role', message: 'Valid role is required (ADMIN, MEMBER, VIEWER)' });
    }

    if (!body.status || !['ACTIVE', 'INACTIVE'].includes(body.status)) {
      errors.push({ field: 'status', message: 'Valid status is required (ACTIVE, INACTIVE)' });
    }

    const emailErr = validateEmailFormat(body.email);
    if (emailErr) {
      errors.push({ field: 'email', message: emailErr });
    }

    const phoneErr = validatePhoneFormat(body.phone);
    if (phoneErr) {
      errors.push({ field: 'phone', message: phoneErr });
    }

    if (errors.length > 0) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Validation failed for user payload',
          errors,
        },
        { status: 400 }
      );
    }

    const todayStr = getTodayDateStr();
    const updatedUser: User = {
      ...existing,
      name: body.name.trim(),
      code: body.code ? body.code.trim().toUpperCase() : '',
      username: body.username.trim().toLowerCase(),
      role: body.role,
      status: body.status,
      email: body.email && body.email.trim() ? body.email.trim().toLowerCase() : null,
      phone: body.phone && body.phone.trim() ? body.phone.trim() : null,
      // Admin cannot upload or change another person's photo; preserve existing photoUrl
      photoUrl: existing.photoUrl ?? null,
      permissions: [...ROLE_PRESET_PERMISSIONS[body.role]],
      updatedDate: todayStr,
    };

    mockStore.users[index] = updatedUser;
    return HttpResponse.json(updatedUser, { status: 200 });
  }),

  // 7. PATCH /api/users/:id/status (Quick Activate/Deactivate - ADMIN Only)
  http.patch('*/api/users/:id/status', async ({ params, request }) => {
    await delay(150);
    const currentUser = mockStore.getCurrentMockUser();

    if (!currentUser.permissions.includes('user.manage') && currentUser.role !== 'ADMIN') {
      return HttpResponse.json(
        { status: 403, error: 'Forbidden', message: 'Access denied.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const index = mockStore.users.findIndex((u) => u.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: `User with id '${id}' not found.` },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { status: UserStatus };
    const existing = mockStore.users[index];

    // Business Rule 1: Self-deactivation forbidden (409 Conflict)
    if (currentUser.id === id && body.status === 'INACTIVE') {
      return HttpResponse.json(
        {
          status: 409,
          error: 'Conflict',
          message: 'You cannot deactivate your own active account.',
        },
        { status: 409 }
      );
    }

    // Business Rule 2: Last active Admin protection (409 Conflict)
    const activeAdmins = mockStore.users.filter(
      (u) => u.status === 'ACTIVE' && u.role === 'ADMIN'
    );
    const isTargetOnlyAdmin = activeAdmins.length === 1 && activeAdmins[0].id === id;

    if (isTargetOnlyAdmin && body.status === 'INACTIVE') {
      return HttpResponse.json(
        {
          status: 409,
          error: 'Conflict',
          message: 'Cannot deactivate or demote the only active Administrator in the system.',
        },
        { status: 409 }
      );
    }

    if (!body.status || !['ACTIVE', 'INACTIVE'].includes(body.status)) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Valid status is required (ACTIVE, INACTIVE)',
        },
        { status: 400 }
      );
    }

    const todayStr = getTodayDateStr();
    const updatedUser: User = {
      ...existing,
      status: body.status,
      updatedDate: todayStr,
    };

    mockStore.users[index] = updatedUser;
    return HttpResponse.json(updatedUser, { status: 200 });
  }),

  // 7. POST /api/users/:id/reset-password (ADMIN Only)
  http.post('*/api/users/:id/reset-password', async ({ params, request }) => {
    await delay(150);
    const currentUser = mockStore.getCurrentMockUser();

    if (!currentUser.permissions.includes('user.manage') && currentUser.role !== 'ADMIN') {
      return HttpResponse.json(
        { status: 403, error: 'Forbidden', message: 'Access denied.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const user = mockStore.users.find((u) => u.id === id);

    if (!user) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: `User with id '${id}' not found.` },
        { status: 404 }
      );
    }

    const body = (await request.json()) as ResetPasswordDTO;
    const passwordError = validatePasswordComplexity(body.newPassword);

    if (passwordError) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: passwordError,
          errors: [{ field: 'newPassword', message: passwordError }],
        },
        { status: 400 }
      );
    }

    mockStore.setPassword(String(id), body.newPassword);
    return new HttpResponse(null, { status: 204 });
  }),

  // 8. POST /api/me/change-password (All Authenticated Users)
  http.post('*/api/me/change-password', async ({ request }) => {
    await delay(150);
    const currentUser = mockStore.getCurrentMockUser();
    const body = (await request.json()) as ChangePasswordDTO;
    const errors: FieldValidationError[] = [];

    // Verify current password against simulated storage
    const isValidCurrent = mockStore.verifyPassword(currentUser.id, body.currentPassword);
    if (!isValidCurrent) {
      errors.push({
        field: 'currentPassword',
        message: 'Current password does not match our records',
      });
    }

    const passwordError = validatePasswordComplexity(body.newPassword);
    if (passwordError) {
      errors.push({ field: 'newPassword', message: passwordError });
    }

    if (errors.length > 0) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Password change validation failed',
          errors,
        },
        { status: 400 }
      );
    }

    mockStore.setPassword(currentUser.id, body.newPassword);
    return new HttpResponse(null, { status: 204 });
  }),
];
