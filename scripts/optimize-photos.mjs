/*
 * Turns the raw photo dump in src/assets/Cameo/ into web-sized JPEGs in
 * src/assets/photos/.
 *
 * WHY THIS EXISTS
 *   The originals are phone screenshots — 2.5-7 MB each, ~30 MB total. Shipping
 *   those would dwarf the rest of the site. They're only ever shown behind a
 *   dark scrim in the hero band, so 1400px at quality 60 is indistinguishable
 *   from the source while being ~30x smaller.
 *
 *   The originals stay OUT of git (see .gitignore) — keep your own backup of
 *   src/assets/Cameo/. Only the optimized output is committed.
 *
 * RUN
 *   node scripts/optimize-photos.mjs
 *
 * Uses macOS `sips`, so there's no image-library dependency to install.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC_DIR = 'src/assets/Cameo'
const OUT_DIR = 'src/assets/photos'

const MAX_WIDTH = 1400
const QUALITY = 60

/**
 * Each entry maps a source photo to its published name.
 *  match    - substring identifying the source file
 *  name     - output basename
 *  cropTop  - pixels to shave off the top (removes app UI chrome)
 */
const PHOTOS = [
  { match: '6.40.07', name: 'van-branding' },
  { match: '6.37.04', name: 'porsche-gt3', cropTop: 60 },
  { match: '6.38.15', name: 'bmw-m5' },
  { match: '6.39.06', name: 'van-bmw-m3' },
  { match: '6.39.29', name: 'kia-service' },
  { match: '2AED8509', name: 'mounting-wheel' },
  { match: '6.39.49', name: 'van-loaded' },
  { match: '6.38.41', name: 'classic-truck' },
]

const sips = (args) => execFileSync('sips', args, { stdio: 'pipe' })
const kb = (path) => Math.round(statSync(path).size / 1024)

mkdirSync(OUT_DIR, { recursive: true })
const sources = readdirSync(SRC_DIR).filter((f) => !f.startsWith('.'))

let totalBefore = 0
let totalAfter = 0

for (const photo of PHOTOS) {
  const file = sources.find((f) => f.includes(photo.match))
  if (!file) {
    console.warn(`  ! no source matching "${photo.match}" — skipped`)
    continue
  }

  const src = join(SRC_DIR, file)
  const out = join(OUT_DIR, `${photo.name}.jpg`)
  totalBefore += statSync(src).size

  // Optional pre-crop to remove screenshot chrome, then resize + re-encode.
  let input = src
  if (photo.cropTop) {
    const info = sips(['-g', 'pixelWidth', '-g', 'pixelHeight', src]).toString()
    const [w, h] = [...info.matchAll(/pixel(?:Width|Height):\s*(\d+)/g)].map((m) => Number(m[1]))
    // sips crops in place, so work on a copy rather than the original.
    // Quirk: it silently no-ops unless BOTH dimensions shrink, so the width
    // is trimmed by a token 2px (invisible) to make the crop take effect.
    const tmp = join(OUT_DIR, `.tmp-${photo.name}.png`)
    copyFileSync(src, tmp)
    sips([
      '-c', String(h - photo.cropTop), String(w - 2),
      '--cropOffset', String(photo.cropTop), '1',
      tmp,
    ])
    input = tmp
  }

  sips(['-Z', String(MAX_WIDTH), '-s', 'format', 'jpeg', '-s', 'formatOptions', String(QUALITY), input, '--out', out])

  if (input !== src) rmSync(input, { force: true })
  totalAfter += statSync(out).size
  console.log(`  ${photo.name.padEnd(16)} ${String(kb(src)).padStart(5)}KB -> ${String(kb(out)).padStart(4)}KB`)
}

console.log(
  `\n  total ${Math.round(totalBefore / 1024 / 1024)}MB -> ${Math.round(totalAfter / 1024)}KB\n`,
)
