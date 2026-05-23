
export type LogStatus = 'sent' | 'failed' | 'pending' | 'retrying'


export interface SendLog {
  id: string
  recipient: string
  templateId: string
  templateName: string
  triggerId: string
  triggerName: string
  eventType: string
  status: LogStatus
  errorReason?: string
  sentAt: string
  createdAt: string
}


export interface LogListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: LogStatus | 'all'
  dateFrom?: string
  dateTo?: string
  sort?: string
  order?: 'asc' | 'desc'
}
