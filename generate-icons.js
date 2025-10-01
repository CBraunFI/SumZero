#!/usr/bin/env node
/**
 * Generate PWA icons for SumZero
 * Creates placeholder icons in various sizes using SVG
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ICON_SIZES = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512]
const OUTPUT_DIR = path.join(__dirname, 'public', 'icons')

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

/**
 * Generate SVG icon with the SumZero design
 */
function generateSVG(size) {
  const centerX = size / 2
  const centerY = size / 2
  const gridSize = size * 0.6
  const cellSize = gridSize / 3
  const padding = (size - gridSize) / 2

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.1}"/>

  <!-- Grid pattern representing the game board -->
  <g transform="translate(${padding}, ${padding})">
    <!-- Grid lines -->
    <line x1="0" y1="${cellSize}" x2="${gridSize}" y2="${cellSize}" stroke="#ffffff" stroke-width="${size * 0.01}" stroke-opacity="0.3"/>
    <line x1="0" y1="${cellSize * 2}" x2="${gridSize}" y2="${cellSize * 2}" stroke="#ffffff" stroke-width="${size * 0.01}" stroke-opacity="0.3"/>
    <line x1="${cellSize}" y1="0" x2="${cellSize}" y2="${gridSize}" stroke="#ffffff" stroke-width="${size * 0.01}" stroke-opacity="0.3"/>
    <line x1="${cellSize * 2}" y1="0" x2="${cellSize * 2}" y2="${gridSize}" stroke="#ffffff" stroke-width="${size * 0.01}" stroke-opacity="0.3"/>

    <!-- Game pieces -->
    <!-- Player 1 (dark) -->
    <rect x="${cellSize * 0.1}" y="${cellSize * 0.1}" width="${cellSize * 0.8}" height="${cellSize * 0.8}" fill="#333333" rx="${cellSize * 0.1}"/>
    <rect x="${cellSize * 1.1}" y="${cellSize * 0.1}" width="${cellSize * 0.8}" height="${cellSize * 0.8}" fill="#333333" rx="${cellSize * 0.1}"/>

    <!-- Player 2 (light) -->
    <rect x="${cellSize * 1.1}" y="${cellSize * 1.1}" width="${cellSize * 0.8}" height="${cellSize * 0.8}" fill="#ffffff" rx="${cellSize * 0.1}"/>
    <rect x="${cellSize * 2.1}" y="${cellSize * 1.1}" width="${cellSize * 0.8}" height="${cellSize * 0.8}" fill="#ffffff" rx="${cellSize * 0.1}"/>
    <rect x="${cellSize * 0.1}" y="${cellSize * 2.1}" width="${cellSize * 0.8}" height="${cellSize * 0.8}" fill="#ffffff" rx="${cellSize * 0.1}"/>
  </g>

  <!-- Title text for larger icons -->
  ${size >= 128 ? `
  <text x="${centerX}" y="${size * 0.92}" font-family="Arial, sans-serif" font-size="${size * 0.1}" font-weight="bold" fill="#ffffff" text-anchor="middle" opacity="0.9">
    SumZero
  </text>
  ` : ''}
</svg>`
}

/**
 * Convert SVG to PNG using canvas (Node.js compatible)
 * For production, you'd use a proper library like sharp or jimp
 */
function saveSVGIcon(size) {
  const svg = generateSVG(size)
  const filename = `icon-${size}x${size}.png`
  const svgFilename = `icon-${size}x${size}.svg`
  const filepath = path.join(OUTPUT_DIR, filename)
  const svgFilepath = path.join(OUTPUT_DIR, svgFilename)

  // Save SVG version
  fs.writeFileSync(svgFilepath, svg)

  // For PNG, we'll create a simple data URL that browsers can use
  // In production, you'd use a library to convert SVG to PNG
  console.log(`✓ Generated ${svgFilename}`)

  return svgFilepath
}

/**
 * Generate all icon sizes
 */
function generateAllIcons() {
  console.log('Generating PWA icons for SumZero...\n')

  ICON_SIZES.forEach(size => {
    saveSVGIcon(size)
  })

  console.log(`\n✓ Generated ${ICON_SIZES.length} icon sizes`)
  console.log(`✓ Icons saved to: ${OUTPUT_DIR}`)
  console.log('\nNOTE: SVG icons have been generated.')
  console.log('For production, convert these to PNG using:')
  console.log('  - Online: https://cloudconvert.com/svg-to-png')
  console.log('  - CLI: npm install -g sharp-cli && sharp-cli ...')
  console.log('  - Or use Photoshop/GIMP to export as PNG\n')
}

// Run the generator
generateAllIcons()
