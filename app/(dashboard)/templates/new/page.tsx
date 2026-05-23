import { TemplateEditor } from '@/features/templates/components/TemplateEditor'

export const metadata = {
  title: 'New Template | MailFlow',
  description: 'Create a new email template',
}

export default function NewTemplatePage() {
  return <TemplateEditor />
}
