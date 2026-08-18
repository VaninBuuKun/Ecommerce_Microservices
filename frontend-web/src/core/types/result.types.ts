export interface Result<T = any> {
  isSuccess: boolean;
  message?: string;
  errorCode?: string;
  error?: {
    code?: string;
    message?: string;
  };
  value?: T;
}

export interface PaginationParams {
  pageIndex: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}
