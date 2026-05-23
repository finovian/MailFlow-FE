import { TriggerList } from '@/features/triggers/components/TriggerList'

export const metadata = {
  title: 'Triggers | MailFlow',
  description: 'Manage automated email triggers and conditions',
}

export default function TriggersPage() {
  return <TriggerList />
}
