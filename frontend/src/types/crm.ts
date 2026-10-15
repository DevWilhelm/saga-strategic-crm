export interface Account {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDTO {
  name: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  ownerId?: string | null;
}

export type UpdateAccountDTO = Partial<CreateAccountDTO>;

export interface Contact {
  id: string;
  accountId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactDTO {
  accountId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  title?: string | null;
}

export type UpdateContactDTO = Partial<CreateContactDTO>;

export interface PaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
