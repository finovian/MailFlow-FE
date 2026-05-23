
export interface ApiError {
  message: string
  code: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}


export interface TableParams {
  page?: number
  pageSize?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, string | string[]>
}


export interface SortConfig {
  column: string
  order: 'asc' | 'desc'
}

export interface FilterConfig {
  key: string
  label: string
  options: { value: string; label: string }[]
}
