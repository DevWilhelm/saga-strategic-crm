import { apiClient } from './client';
import type {
  User,
  UserListItem,
  CurrentUser,
  UserOption,
  UserFilters,
  CreateUserDTO,
  UpdateUserDTO,
  UpdateMyProfileDTO,
  UserPhotoResponse,
  UpdateUserStatusDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  PaginatedUsersResponse,
} from '../types/user';
import type { UserStatus } from '../constants/users';

export const usersApi = {
  // 1. GET /api/me (Current Authenticated User Profile & Permissions)
  getMe: async (): Promise<CurrentUser> => {
    const response = await apiClient.get<CurrentUser>('/me');
    return response.data;
  },

  // NEW: PUT /api/me (Update Current User's Profile Name - All Roles)
  updateMyProfile: async (payload: UpdateMyProfileDTO): Promise<CurrentUser> => {
    const response = await apiClient.put<CurrentUser>('/me', payload);
    return response.data;
  },

  // 2. GET /api/users (Paginated Users List - ADMIN Only)
  getUsers: async (filters: UserFilters = {}): Promise<PaginatedUsersResponse> => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.role) params.set('role', filters.role);
    if (filters.status) params.set('status', filters.status);
    if (filters.page !== undefined) params.set('page', String(filters.page));
    if (filters.size !== undefined) params.set('size', String(filters.size));
    if (filters.sort) params.set('sort', filters.sort);

    const response = await apiClient.get<PaginatedUsersResponse>('/users', { params });
    return response.data;
  },

  // 3. GET /api/users/options (Active Users for Owner Dropdowns)
  getUserOptions: async (): Promise<UserOption[]> => {
    const response = await apiClient.get<UserOption[]>('/users/options');
    return response.data;
  },

  // 4. GET /api/users/:id (User Detail with Counts - ADMIN Only)
  getUserById: async (id: string): Promise<UserListItem> => {
    const response = await apiClient.get<UserListItem>(`/users/${id}`);
    return response.data;
  },

  // 5. POST /api/users (Create User - ADMIN Only)
  createUser: async (payload: CreateUserDTO): Promise<User> => {
    const response = await apiClient.post<User>('/users', payload);
    return response.data;
  },

  // 6. PUT /api/users/:id (Full User Update - ADMIN Only)
  updateUser: async (id: string, payload: UpdateUserDTO): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, payload);
    return response.data;
  },

  // 7. PATCH /api/users/:id/status (Quick Activate/Deactivate - ADMIN Only)
  updateUserStatus: async (id: string, status: UserStatus): Promise<User> => {
    const payload: UpdateUserStatusDTO = { status };
    const response = await apiClient.patch<User>(`/users/${id}/status`, payload);
    return response.data;
  },

  // 8. POST /api/users/:id/reset-password (ADMIN Only)
  resetPassword: async (id: string, payload: ResetPasswordDTO): Promise<void> => {
    await apiClient.post<void>(`/users/${id}/reset-password`, payload);
  },

  // 9. POST /api/me/change-password (All Authenticated Users)
  changePassword: async (payload: ChangePasswordDTO): Promise<void> => {
    await apiClient.post<void>('/me/change-password', payload);
  },

  // 10. POST /api/me/photo (Upload Profile Photo - All Authenticated Users)
  uploadPhoto: async (file: File): Promise<UserPhotoResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<UserPhotoResponse>('/me/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 11. DELETE /api/me/photo (Remove Profile Photo - All Authenticated Users)
  deletePhoto: async (): Promise<void> => {
    await apiClient.delete<void>('/me/photo');
  },
};
