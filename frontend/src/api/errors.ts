import type { FieldValidationError } from '../types/account';

export interface ApiErrorInfo {
  message: string;
  status?: number;
  fieldErrors: FieldValidationError[];
}

// Reads the error that apiClient rejects with: Spring's { status, error, message }
// body plus an optional `errors` list of field problems.
export const getApiErrorInfo = (error: unknown): ApiErrorInfo => {
  const err = error as {
    message?: string;
    code?: string;
    response?: { status?: number };
    errors?: FieldValidationError[];
  };
  if (!err?.response) {
    return {
      message:
        err?.code === 'ECONNABORTED'
          ? 'The CRM server took too long to respond. Try again.'
          : "Can't reach the CRM server. Check your connection and try again.",
      fieldErrors: [],
    };
  }
  return {
    message: err.message || 'Request failed',
    status: err.response.status,
    fieldErrors: err.errors ?? [],
  };
};
