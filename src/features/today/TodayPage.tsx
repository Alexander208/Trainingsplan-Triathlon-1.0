import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'

export function TodayPage() {
  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <>
      <PageHeader title="Heute" subtitle={today} />
      <Card>
        <p className="text-slate-600 dark:text-slate-300">
          Hier erscheinen bald deine Einheiten für heute und die nächsten Tage.
        </p>
      </Card>
    </>
  )
}
