import { TriggerForm } from '@/features/triggers/components/TriggerForm'

export const metadata = {
  title: 'New Trigger | MailFlow',
  description: 'Create a new automated email trigger',
}

export default function NewTriggerPage() {
  return <TriggerForm />
}
