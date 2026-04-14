/**
 * WHY: This script runs before next build to diagnose PostCSS loading failures.
 * It intentionally logs the full error with stack trace so Vercel shows the root cause.
 */
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

console.log('=== POSTCSS DEBUG ===')
console.log('Node version:', process.version)
console.log('Platform:', process.platform, process.arch)
console.log('CWD:', process.cwd())
console.log('__dirname:', __dirname)

// Test 1: Can we load @tailwindcss/postcss?
try {
  const tailwindPostcss = require('@tailwindcss/postcss')
  console.log('[OK] @tailwindcss/postcss loaded:', typeof tailwindPostcss)
} catch (e) {
  console.error('[FAIL] @tailwindcss/postcss:', e.message)
  console.error(e.stack)
}

// Test 2: Can we load lightningcss?
try {
  const lightningcss = require('lightningcss')
  console.log('[OK] lightningcss loaded:', Object.keys(lightningcss).length, 'exports')
} catch (e) {
  console.error('[FAIL] lightningcss:', e.message)
  console.error(e.stack)
}

// Test 3: Can we load tailwindcss?
try {
  const tw = require('tailwindcss')
  console.log('[OK] tailwindcss loaded:', typeof tw)
} catch (e) {
  console.error('[FAIL] tailwindcss:', e.message)
  console.error(e.stack)
}

// Test 4: Find where the modules resolve to
try {
  const p = require.resolve('@tailwindcss/postcss')
  console.log('[OK] @tailwindcss/postcss resolves to:', p)
} catch (e) {
  console.error('[FAIL] @tailwindcss/postcss not found:', e.message)
}

console.log('=== END POSTCSS DEBUG ===')
