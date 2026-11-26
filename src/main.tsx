import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { requestPersistentStorage } from './db/db'
import { startStravaAutoSync } from './integrations/stravaSync'

// Browser bitten, die Trainingsdaten nicht automatisch zu löschen
void requestPersistentStorage()

// Strava: Anmeldung abschließen (falls gerade von Strava zurück) und automatisch abgleichen.
// Muss vor dem ersten Rendern laufen, damit die Adresse schon aufgeräumt ist.
startStravaAutoSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
