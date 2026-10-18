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
      email: current.email,
      phone: current.phone ?? null,
      photoUrl: current.photoUrl ?? null,
      managerId: current.managerId ?? null,
      managerName: current.managerName ?? null,
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
    // /api/me is self-service and allowed for all roles (SUPER_ADMIN, ADMIN, MEMBER).
    // The request body must contain ONLY the user's name, email, and phone.
    // The server and mock must strictly ignore or reject username, code, role, and status.

    const errors: FieldValidationError[] = [];
    if (!body.name || !body.name.trim()) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (body.name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
    }

    if (!body.email || !body.email.trim()) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else {
      const emailErr = validateEmailFormat(body.email);
      if (emailErr) {
        errors.push({ field: 'email', message: emailErr });
      } else {
        const duplicate = mockStore.users.some(
          (u) =>
            u.id !== currentUser.id &&
            u.email &&
            u.email.toLowerCase() === body.email.trim().toLowerCase()
        );
        if (duplicate) {
          return HttpResponse.json(
            {
              status: 409,
              error: 'Conflict',
              message: `Email '${body.email.trim()}' is already in use by another user.`,
            },
            { status: 409 }
          );
        }
      }
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
    currentUser.email = body.email.trim().toLowerCase();
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
      managerId: currentUser.managerId ?? null,
      managerName: currentUser.managerName ?? null,
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

  // 2. GET /api/users (Paginated User List with Counts - SUPER_ADMIN & ADMIN Only)
  http.get('*/api/users', async ({ request }) => {
    await delay(150);
    const currentUser = mockStore.getCurrentMockUser();

    // Permission check: MEMBER accounts cannot access user directory (403 Forbidden)
    if (currentUser.role === 'MEMBER' || !currentUser.permissions.includes('user.manage')) {
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
    const managerIdParam = url.searchParams.get('managerId');
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

    // Filter users with hierarchical scoping
    const filtered = mockStore.users.filter((user) => {
      // Role Scoping: ADMIN sees ONLY self + own assigned members
      if (currentUser.role === 'ADMIN') {
        const isSelf = user.id === currentUser.id;
        const isOwnMember = user.role === 'MEMBER' && user.managerId === currentUser.id;
        if (!isSelf && !isOwnMember) return false;
      }

      // SUPER_ADMIN filtering by managerId
      if (currentUser.role === 'SUPER_ADMIN' && managerIdParam) {
        if (user.managerId !== managerIdParam) return false;
      }

      if (q) {
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesUsername = user.username.toLowerCase().includes(q);
        const matchesCode = user.code ? user.code.toLowerCase().includes(q) : false;
        const matchesEmail = user.email ? user.email.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesUsername && !matchesCode && !matchesEmail) return false;
      }
      if (role && user.role !== role) return false;
      if (status && user.status !== status) return false;
      return true;
    });

    // Enrich with dynamic accountCount, contactCount, and managerName from shared store
    const enriched: UserListItem[] = filtered.map((u) => {
      const accountCount = mockStore.accounts.filter((a) => a.ownerId === u.id).length;
      // Contacts belonging to accounts owned by this user
      const ownedAccountIds = mockStore.accounts
        .filter((a) => a.ownerId === u.id)
        .map((a) => a.id);
      const contactCount = mockStore.contacts.filter((c) => ownedAccountIds.includes(c.companyId)).length;

      const manager = u.managerId ? mockStore.users.find((m) => m.id === u.managerId) : null;
      const managerName = manager ? manager.name : (u.managerName ?? null);

      return {
        ...u,
        managerName,
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

  // 5. POST /api/users (Create User - SUPER_ADMIN & ADMIN Only)
  http.post('*/api/users', async ({ request }) => {
    await delay(200);
    const currentUser = mockStore.getCurrentMockUser();

    // Permission check
    if (currentUser.role === 'MEMBER' || !currentUser.permissions.includes('user.manage')) {
      return HttpResponse.json(
        { status: 403, error: 'Forbidden', message: 'Access denied. You cannot create users.' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as CreateUserDTO;
    const errors: FieldValidationError[] = [];

    // Role creation rules:
    // Super Admin cannot be created via API
    if (body.role === 'SUPER_ADMIN') {
      return HttpResponse.json(
        {
          status: 409,
          error: 'Conflict',
          message: 'The Super Admin account cannot be created or duplicated.',
        },
        { status: 409 }
      );
    }

    // Admins can create ONLY Member accounts
    if (currentUser.role === 'ADMIN' && body.role !== 'MEMBER') {
      return HttpResponse.json(
        {
          status: 403,
          error: 'Forbidden',
          message: 'Administrators can only create Member accounts.',
        },
        { status: 403 }
      );
    }

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
      const username = body.username.trim().toLowerCase();
      if (username.length < 3 || username.length > 50) {
        errors.push({ field: 'username', message: 'Username must be between 3 and 50 characters' });
      } else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
        errors.push({
          field: 'username',
          message: 'Username may only contain letters, numbers, dots, and underscores',
        });
      } else {
        const duplicateUsername = mockStore.users.some(
          (u) => u.username.toLowerCase() === username
        );
        if (duplicateUsername) {
          return HttpResponse.json(
            {
              status: 409,
              error: 'Conflict',
              message: `Username '${username}' is already in use by another account.`,
            },
            { status: 409 }
          );
        }
      }
    }

    // Required Email validation & Uniqueness check
    if (!body.email || !body.email.trim()) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else {
      const emailErr = validateEmailFormat(body.email);
      if (emailErr) {
        errors.push({ field: 'email', message: emailErr });
      } else {
        const emailTrimmed = body.email.trim().toLowerCase();
        const duplicateEmail = mockStore.users.some(
          (u) => u.email && u.email.toLowerCase() === emailTrimmed
        );
        if (duplicateEmail) {
          return HttpResponse.json(
            {
              status: 409,
              error: 'Conflict',
              message: `Email '${emailTrimmed}' is already in use by another account.`,
            },
            { status: 409 }
          );
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

    const phoneErr = validatePhoneFormat(body.phone);
    if (phoneErr) {
      errors.push({ field: 'phone', message: phoneErr });
    }

    // Manager assignment
    let assignedManagerId: string | null = null;
    let assignedManagerName: string | null = null;
    if (body.role === 'MEMBER') {
      if (currentUser.role === 'ADMIN') {
        assignedManagerId = currentUser.id;
        assignedManagerName = currentUser.name;
      } else if (currentUser.role === 'SUPER_ADMIN') {
        assignedManagerId = body.managerId || null;
        if (!assignedManagerId) {
          errors.push({ field: 'managerId', message: 'Please assign an Admin / Manager for this member' });
        } else {
          const mgr = mockStore.users.find((u) => u.id === assignedManagerId);
          assignedManagerName = mgr ? mgr.name : null;
        }
      }
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
      username: body.username.trim().toLowerCase(),
      role: body.role,
      status: body.status || 'ACTIVE',
      email: body.email.trim().toLowerCase(),
      phone: body.phone && body.phone.trim() ? body.phone.trim() : null,
      photoUrl: null,
      managerId: assignedManagerId,
      managerName: assignedManagerName,
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

  // 6. PUT /api/users/:id (Update User - SUPER_ADMIN & ADMIN Only)
  http.put('*/api/users/:id', async ({ params, request }) => {
    await delay(200);
    const currentUser = mockStore.getCurrentMockUser();

    if (currentUser.role === 'MEMBER' || !currentUser.permissions.includes('user.manage')) {
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

    // Security Rule: Super Admin account cannot be deactivated or changed
    if (existing.role === 'SUPER_ADMIN') {
      return HttpResponse.json(
        {
          status: 409,
          error: 'Conflict',
          message: 'The Super Admin account cannot be deactivated or changed.',
        },
        { status: 409 }
      );
    }

    // Security Rule: Super Admin role cannot be assigned to another user
    if (body.role === 'SUPER_ADMIN') {
      return HttpResponse.json(
        {
          status: 409,
          error: 'Conflict',
          message: 'The Super Admin account cannot be assigned or changed.',
        },
        { status: 409 }
      );
    }

    // Role Scoping: ADMIN can edit ONLY members assigned to them
    if (currentUser.role === 'ADMIN') {
      if (existing.role !== 'MEMBER' || existing.managerId !== currentUser.id) {
        return HttpResponse.json(
          {
            status: 403,
            error: 'Forbidden',
            message: 'You can only edit members assigned to you.',
          },
          { status: 403 }
        );
      }
    }

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
      const username = body.username.trim().toLowerCase();
      const duplicateUsername = mockStore.users.some(
        (u) => u.id !== id && u.username.toLowerCase() === username
      );
      if (duplicateUsername) {
        return HttpResponse.json(
          {
            status: 409,
            error: 'Conflict',
            message: `Username '${username}' is already in use by another account.`,
          },
          { status: 409 }
        );
      }
    }

    if (!body.role || !['ADMIN', 'MEMBER'].includes(body.role)) {
      errors.push({ field: 'role', message: 'Valid role is required (ADMIN, MEMBER)' });
    }

    if (!body.status || !['ACTIVE', 'INACTIVE'].includes(body.status)) {
      errors.push({ field: 'status', message: 'Valid status is required (ACTIVE, INACTIVE)' });
    }

    if (!body.email || !body.email.trim()) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else {
      const emailErr = validateEmailFormat(body.email);
      if (emailErr) {
        errors.push({ field: 'email', message: emailErr });
      } else {
        const emailTrimmed = body.email.trim().toLowerCase();
        const duplicateEmail = mockStore.users.some(
          (u) => u.id !== id && u.email && u.email.toLowerCase() === emailTrimmed
        );
        if (duplicateEmail) {
          return HttpResponse.json(
            {
              status: 409,
              error: 'Conflict',
              message: `Email '${emailTrimmed}' is already in use by another account.`,
            },
            { status: 409 }
          );
        }
      }
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

    let assignedManagerId = existing.managerId;
    let assignedManagerName = existing.managerName;
    if (body.role === 'ADMIN') {
      assignedManagerId = null;
      assignedManagerName = null;
    } else if (body.role === 'MEMBER' && currentUser.role === 'SUPER_ADMIN' && body.managerId !== undefined) {
      assignedManagerId = body.managerId;
      const mgr = assignedManagerId ? mockStore.users.find((u) => u.id === assignedManagerId) : null;
      assignedManagerName = mgr ? mgr.name : null;
    }

    const todayStr = getTodayDateStr();
    const updatedUser: User = {
      ...existing,
      name: body.name.trim(),
      code: body.code ? body.code.trim().toUpperCase() : '',
      username: body.username.trim().toLowerCase(),
      role: body.role,
      status: body.status,
      email: body.email.trim().toLowerCase(),
      phone: body.phone && body.phone.trim() ? body.phone.trim() : null,
      photoUrl: existing.photoUrl ?? null,
      managerId: assignedManagerId,
      managerName: assignedManagerName,
      permissions: [...ROLE_PRESET_PERMISSIONS[body.role]],
      updatedDate: todayStr,
    };

    mockStore.users[index] = updatedUser;
    return HttpResponse.json(updatedUser, { status: 200 });
  }),

  // 7. PATCH /api/users/:id/status (Quick Activate/Deactivate - SUPER_ADMIN & ADMIN Only)
  http.patch('*/api/users/:id/status', async ({ params, request }) => {
    await delay(150);
    const currentUser = mockStore.getCurrentMockUser();

    if (currentUser.role === 'MEMBER' || !currentUser.permissions.includes('user.manage')) {
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

    // Security Rule: Super Admin account cannot be deactivated or changed
    if (existing.role === 'SUPER_ADMIN') {
      return HttpResponse.json(
        {
          status: 409,
          error: 'Conflict',
          message: 'The Super Admin account cannot be deactivated or changed.',
        },
        { status: 409 }
      );
    }

    // Role Scoping: ADMIN can change status ONLY for members assigned to them
    if (currentUser.role === 'ADMIN') {
      if (existing.role !== 'MEMBER' || existing.managerId !== currentUser.id) {
        return HttpResponse.json(
          {
            status: 403,
            error: 'Forbidden',
            message: 'You can only change status of members assigned to you.',
          },
          { status: 403 }
        );
      }
    }

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

  // 8. POST /api/users/:id/reset-password (SUPER_ADMIN & ADMIN Only)
  http.post('*/api/users/:id/reset-password', async ({ params, request }) => {
    await delay(150);
    const currentUser = mockStore.getCurrentMockUser();

    if (currentUser.role === 'MEMBER' || !currentUser.permissions.includes('user.manage')) {
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

    // Security Rule: Super Admin password cannot be reset by other users
    if (user.role === 'SUPER_ADMIN' && currentUser.id !== user.id) {
      return HttpResponse.json(
        {
          status: 409,
          error: 'Conflict',
          message: 'The Super Admin account cannot be deactivated or changed.',
        },
        { status: 409 }
      );
    }

    // Role Scoping: ADMIN can reset password ONLY for members assigned to them
    if (currentUser.role === 'ADMIN' && (user.role !== 'MEMBER' || user.managerId !== currentUser.id)) {
      return HttpResponse.json(
        {
          status: 403,
          error: 'Forbidden',
          message: 'You can only reset passwords for members assigned to you.',
        },
        { status: 403 }
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
