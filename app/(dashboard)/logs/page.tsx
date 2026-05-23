import { LogList } from '@/features/logs/components/LogList'

export const metadata = {
  title: 'Logs | MailFlow',
  description: 'View email automation run logs',
}

export default function LogsPage() {
  return <LogList />
}
