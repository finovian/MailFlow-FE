
export type TemplateStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'active' | 'draft' | 'archived'


export interface Template {
  id: string
  name: string
  slug: string
  description?: string
  subject: string
  bodyHtml: string
  htmlContent: string // For backward compatibility with UI components
  status: TemplateStatus
  variables: string[]
  createdAt: string
  updatedAt: string
}


export interface CreateTemplateDto {
  name: string
  subject: string
  htmlContent: string
  description?: string
  status?: TemplateStatus
}


export interface UpdateTemplateDto extends Partial<CreateTemplateDto> { }


export interface TemplateListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: TemplateStatus | 'all'
  sort?: string
  order?: 'asc' | 'desc'
}

export interface TestSendDto {
  recipientEmail: string
  mockPayload?: Record<string, unknown>
}
