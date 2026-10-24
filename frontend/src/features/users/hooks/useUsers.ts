import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../../api/usersApi';
import type {
  User,
  UserListItem,
  CurrentUser,
  UserOption,
  UserFilters,
  CreateUserDTO,
  UpdateUserDTO,
  UpdateMyProfileDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  PaginatedUsersResponse,
} from '../../../types/user';

export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  // Explicitly embed all search, filter, and pagination parameters in the query key
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  options: () => [...userKeys.all, 'options'] as const,
};

export const useCurrentUser = () => {
  return useQuery<CurrentUser, Error>({
    queryKey: userKeys.me(),
    queryFn: () => usersApi.getMe(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation<CurrentUser, Error, UpdateMyProfileDTO>({
    mutationFn: (payload) => usersApi.updateMyProfile(payload),
    onSuccess: (updatedMe) => {
      queryClient.setQueryData(userKeys.me(), updatedMe);
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.options() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(updatedMe.id) });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useUsers = (filters: UserFilters) => {
  return useQuery<PaginatedUsersResponse, Error>({
    queryKey: userKeys.list(filters),
    queryFn: () => usersApi.getUsers(filters),
  });
};

export const useUserDetail = (id: string) => {
  return useQuery<UserListItem, Error>({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getUserById(id),
    enabled: Boolean(id),
  });
};

export const useUserOptions = () => {
  return useQuery<UserOption[], Error>({
    queryKey: userKeys.options(),
    queryFn: () => usersApi.getUserOptions(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveUser = () => {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { id?: string; data: CreateUserDTO | UpdateUserDTO }>({
    mutationFn: ({ id, data }) => {
      if (id) {
        return usersApi.updateUser(id, data as UpdateUserDTO);
      }
      return usersApi.createUser(data as CreateUserDTO);
    },
    onSuccess: (savedUser, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.options() });
      if (id) {
        queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      }
      queryClient.invalidateQueries({ queryKey: userKeys.detail(savedUser.id) });
    },
  });
};

export const useResetPassword = () => {
  return useMutation<void, Error, { id: string; payload: ResetPasswordDTO }>({
    mutationFn: ({ id, payload }) => usersApi.resetPassword(id, payload),
  });
};

export const useChangePassword = () => {
  return useMutation<void, Error, ChangePasswordDTO>({
    mutationFn: (payload) => usersApi.changePassword(payload),
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { id: string; status: 'ACTIVE' | 'INACTIVE' }>({
    mutationFn: ({ id, status }) => usersApi.updateUserStatus(id, status),
    onSuccess: (_updatedUser, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.options() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
};

export const useUploadPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation<{ photoUrl: string }, Error, File>({
    mutationFn: (file) => usersApi.uploadPhoto(file),
    onSuccess: (res) => {
      queryClient.setQueryData<CurrentUser | undefined>(userKeys.me(), (old) => {
        if (!old) return old;
        return { ...old, photoUrl: res.photoUrl };
      });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.options() });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => usersApi.deletePhoto(),
    onSuccess: () => {
      queryClient.setQueryData<CurrentUser | undefined>(userKeys.me(), (old) => {
        if (!old) return old;
        return { ...old, photoUrl: null };
      });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.options() });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};
