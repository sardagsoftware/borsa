#!/usr/bin/env node
/**
 * Bulk HTML Image Update Script
 * Updates all HTML files to use optimized WebP/AVIF images with picture elements
 *
 * Usage:
 *   node ops/tools/update-html-images.js [--dry-run] [--dir=./public]
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

const config = {
  dryRun: process.argv.includes('--dry-run'),
  dir: './public',
};

// Parse arguments
process.argv.forEach(arg => {
  if (arg.startsWith('--dir=')) {
    config.dir = arg.split('=')[1];
  }
});

// Image configurations
const imageReplacements = [
  {
    original: 'lydian-logo.png',
    webp: 'lydian-logo.webp',
    avif: 'lydian-logo.avif',
    alt: 'LyDian Logo',
  },
  {
    original: 'og-image.png',
    webp: 'og-image.webp',
    avif: 'og-image.avif',
    alt: 'LyDian Platform',
  },
  {
    original: 'icon-512.png',
    webp: 'icon-512.webp',
    avif: 'icon-512.avif',
    alt: 'LyDian Icon',
  },
  {
    original: 'icon-192.png',
    webp: 'icon-192.webp',
    avif: 'icon-192.avif',
    alt: 'LyDian Icon',
  },
];

/**
 * Generate picture element HTML
 */
function generatePictureElement(img) {
  const indent = '                '; // 16 spaces for typical indentation

  return `${indent}<picture>
${indent}  <source srcset="/${img.avif}" type="image/avif">
${indent}  <source srcset="/${img.webp}" type="image/webp">
${indent}  <img src="/${img.original}" alt="${img.alt}" loading="lazy">
${indent}</picture>`;
}

/**
 * Process a single HTML file
 */
async function processHTMLFile(filePath) {
  let content = await fs.readFile(filePath, 'utf-8');
  let modified = false;
  const changes = [];

  for (const img of imageReplacements) {
    // Pattern 1: Simple img tag with src
    const simpleImgPattern = new RegExp(
      `<img\\s+src=["']/?(${img.original})["'][^>]*>`,
      'gi'
    );

    // Pattern 2: img tag with other attributes before src
    const complexImgPattern = new RegExp(
      `<img\\s+[^>]*src=["']/?(${img.original})["'][^>]*>`,
      'gi'
    );

    // Check if already using picture element
    if (content.includes(`<picture>`) && content.includes(img.webp)) {
      // Already optimized
      continue;
    }

    // Skip if this is a favicon or apple-touch-icon
    if (content.match(new RegExp(`<link[^>]*${img.original}[^>]*>`, 'gi'))) {
      continue;
    }

    // Replace img tags with picture elements
    const matches = content.match(simpleImgPattern) || content.match(complexImgPattern);

    if (matches && matches.length > 0) {
      // For now, only replace the first occurrence in body (not in head)
      // This is a simple implementation - a more robust one would parse the HTML properly

      const pictureElement = generatePictureElement(img);
      const imgPattern = new RegExp(`<img[^>]*src=["']/?(${img.original})["'][^>]*>`, 'i');

      // Only replace if not in <head> or <link> tag
      const bodyStart = content.indexOf('<body');
      if (bodyStart !== -1) {
        const beforeBody = content.substring(0, bodyStart);
        const afterBody = content.substring(bodyStart);

        const afterBodyReplaced = afterBody.replace(imgPattern, pictureElement);

        if (afterBodyReplaced !== afterBody) {
          content = beforeBody + afterBodyReplaced;
          modified = true;
          changes.push(`Replaced <img> with <picture> for ${img.original}`);
        }
      }
    }
  }

  if (modified && !config.dryRun) {
    await fs.writeFile(filePath, content, 'utf-8');
  }

  return { modified, changes };
}

/**
 * Main function
 */
async function main() {
  console.log('🖼️  HTML Image Update Tool');
  console.log('==========================\n');
  console.log(`Directory: ${config.dir}`);
  console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  if (config.dryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }

  // Find all HTML files
  const htmlFiles = await glob(`${config.dir}/**/*.html`, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*backup*.html', '**/*BACKUP*.html']
  });

  console.log(`Found ${htmlFiles.length} HTML files\n`);

  let modifiedCount = 0;
  let totalChanges = 0;

  for (const file of htmlFiles) {
    const relativePath = path.relative(config.dir, file);

    try {
      const result = await processHTMLFile(file);

      if (result.modified || result.changes.length > 0) {
        modifiedCount++;
        totalChanges += result.changes.length;

        console.log(`✅ ${relativePath}`);
        result.changes.forEach(change => {
          console.log(`   - ${change}`);
        });
      }
    } catch (error) {
      console.error(`❌ ${relativePath}: ${error.message}`);
    }
  }

  console.log('\n📊 SUMMARY');
  console.log('===========\n');
  console.log(`Files scanned: ${htmlFiles.length}`);
  console.log(`Files ${config.dryRun ? 'would be ' : ''}modified: ${modifiedCount}`);
  console.log(`Total changes: ${totalChanges}`);

  if (config.dryRun && modifiedCount > 0) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }

  console.log('\n✅ Done!');
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { processHTMLFile, generatePictureElement };
