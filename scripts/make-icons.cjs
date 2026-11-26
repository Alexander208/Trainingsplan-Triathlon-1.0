// Erzeugt die PNG-Icons in public/ aus scripts/icon.svg.
// Aufruf: node scripts/make-icons.cjs  (braucht Playwright – nur bei Icon-Änderungen nötig)
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const svg = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8')
const out = path.join(__dirname, '..', 'public')
const targets = [
  { file: 'pwa-192.png', size: 192, pad: 0 },
  { file: 'pwa-512.png', size: 512, pad: 0 },
  { file: 'maskable-512.png', size: 512, pad: 0.1 }, // Android schneidet die Ränder ab
  { file: 'apple-touch-icon.png', size: 180, pad: 0 },
]

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  for (const t of targets) {
    const inner = Math.round(t.size * (1 - 2 * t.pad))
    await page.setViewportSize({ width: t.size, height: t.size })
    await page.setContent(
      `<body style="margin:0;background:#0b0f17;display:grid;place-items:center;height:100vh">
         <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
       </body>`,
    )
    await page.screenshot({ path: path.join(out, t.file), omitBackground: false })
    console.log('✓', t.file)
  }
  await browser.close()
})()
