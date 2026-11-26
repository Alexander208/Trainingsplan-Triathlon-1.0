import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TodayPage } from './features/today/TodayPage'
import { WeekPage } from './features/calendar/WeekPage'
import { PlansPage } from './features/plans/PlansPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { SettingsPage } from './features/settings/SettingsPage'

// HashRouter (#/woche) statt normaler URLs, weil GitHub Pages
// sonst beim Neuladen einer Unterseite einen 404-Fehler zeigt.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="woche" element={<WeekPage />} />
          <Route path="plaene" element={<PlansPage />} />
          <Route path="statistik" element={<DashboardPage />} />
          <Route path="einstellungen" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
