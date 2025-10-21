export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiError = {
  success: false;
  error: {
    message: string;
    details?: any;
  };
};

export const success = <T>(data: T, message?: string): ApiSuccess<T> => ({
  success: true,
  data,
  message,
});

export type PaginatedMeta = { [key: string]: any };

export const successPaginated = <T>(
  items: T,
  meta: PaginatedMeta,
  message?: string
): ApiSuccess<{ items: T; meta: PaginatedMeta }> => ({
  success: true,
  data: { items, meta },
  message,
});

export const fail = (message: string, details?: any): ApiError => ({
  success: false,
  error: { message, details },
});

export default { success, successPaginated, fail };
