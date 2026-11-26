import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // './' = relative Pfade, damit die App auch unter
  // https://<name>.github.io/Trainingsplan-Triathlon-1.0/ funktioniert
  base: './',
  plugins: [react(), tailwindcss()],
})
