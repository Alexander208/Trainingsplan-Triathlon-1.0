import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'

export function PlansPage() {
  return (
    <>
      <PageHeader title="Pläne" />
      <Card>
        <p className="text-slate-600 dark:text-slate-300">Pläne verwalten – kommt in Schritt 6.</p>
      </Card>
    </>
  )
}
