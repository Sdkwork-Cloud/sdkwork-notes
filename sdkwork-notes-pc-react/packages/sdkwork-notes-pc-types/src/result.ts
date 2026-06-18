export interface PageRequest {
  page?: number;
  size?: number;
  keyword?: string;
}

export interface SortState {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

export interface PageableState {
  pageNumber: number;
  pageSize: number;
  offset: number;
  paged: boolean;
  unpaged: boolean;
  sort: SortState;
}

export interface Page<T> {
  content: T[];
  pageable: PageableState;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: SortState;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface IBaseService<T> {
  findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<T>>>;
  findAllById(ids: string[]): Promise<ServiceResult<T[]>>;
  saveAll(entities: Partial<T>[]): Promise<ServiceResult<T[]>>;
  deleteAll(ids: string[]): Promise<ServiceResult<void>>;
  count(): Promise<number>;
}
