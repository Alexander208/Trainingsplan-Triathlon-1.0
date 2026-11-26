# TriPlan – Trainings-App für Triathlon, Kraft & Hyrox

Eine Web-App (PWA), die Trainingspläne organisiert, zeigt, welche Einheit heute dran ist,
und einen Überblick über die Leistung gibt. Läuft im Browser und lässt sich aufs iPhone installieren.
Alle Daten bleiben **lokal auf dem Gerät** – es gibt keinen Server.

**Technik:** React + TypeScript + Vite · Tailwind CSS · React Router · lucide-react (Icons)
– später Dexie.js (Datenbank im Browser), Recharts (Diagramme), dnd-kit (Drag & Drop)

---

## Auf dem Mac starten

### 1. Einmalig: Werkzeuge installieren
1. **Node.js** prüfen: Terminal öffnen (`Cmd + Leertaste` → „Terminal“) und eingeben:
   ```bash
   node -v
   ```
   Erscheint eine Versionsnummer ab `v20`, ist alles gut. Sonst die **LTS-Version** von
   [nodejs.org](https://nodejs.org) herunterladen und installieren, danach das Terminal neu öffnen.
2. **Git** prüfen: `git --version`. Falls macOS fragt, ob die „Command Line Developer Tools“
   installiert werden sollen → „Installieren“ klicken.

### 2. Einmalig: Projekt herunterladen
```bash
cd ~/Documents
git clone https://github.com/Alexander208/Trainingsplan-Triathlon-1.0.git
cd Trainingsplan-Triathlon-1.0
git checkout claude/triathlon-training-app-dktej9
npm install
```
`npm install` lädt alle benötigten Bibliotheken in den Ordner `node_modules` (dauert ca. 1 Minute).

### 3. App starten
```bash
npm run dev
```
Dann im Browser **http://localhost:5173** öffnen. Änderungen am Code erscheinen sofort.
Beenden mit `Ctrl + C` im Terminal.

### Neueste Version holen
```bash
git pull
npm install
npm run dev
```

### Auf dem iPhone im gleichen WLAN testen (optional)
```bash
npm run dev -- --host
```
Das Terminal zeigt eine Adresse wie `http://192.168.x.x:5173` – diese in Safari auf dem iPhone öffnen.

---

## Befehle

| Befehl            | Was passiert                                              |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | Entwicklungsserver starten                                |
| `npm run build`   | Fertige Version in den Ordner `dist/` bauen (mit Typprüfung) |
| `npm run preview` | Die gebaute Version lokal ansehen                         |
| `npm run lint`    | Code auf typische Fehler prüfen                           |

## Ordnerstruktur

```
src/
  components/   wiederverwendbare Bausteine (Karte, Navigation, Layout …)
  features/     eine Ordner pro Bereich der App
    today/        „Heute“-Ansicht
    calendar/     Wochenansicht
    plans/        Pläne verwalten
    dashboard/    Statistik
    settings/     Einstellungen
  lib/          Hilfsfunktionen (z. B. Dark Mode)
  App.tsx       Seiten/Routen
  index.css     Design-Grundlagen (Tailwind, Farben pro Sportart)
```

## Datenschutz
Das Repository ist öffentlich. Persönliche Trainingsdaten (z. B. `mein-plan.json`) sind in
`.gitignore` eingetragen und werden **nie** hochgeladen. Sie werden in der App importiert und
bleiben nur auf dem Gerät.

## Fortschritt
- [x] 1. Grundgerüst: Navigation, Dark Mode, README
- [ ] 2. Datenbank, Import/Export (JSON), eigener Plan als Importdatei
- [ ] 3. „Heute“-Ansicht mit Wettkampf-Countdown
- [ ] 4. Veröffentlichung (GitHub Pages) + PWA → aufs iPhone
- [ ] 5. Einheit abschließen
- [ ] 6. Pläne verwalten
- [ ] 7. Einheit-Editor mit Abschnitten und Kraftübungen
- [ ] 8. Wochenansicht mit Drag & Drop
- [ ] 9. Einstellungen & HF-Zonen
- [ ] 10. Dashboard
