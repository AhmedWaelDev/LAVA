const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');
const backupDir = path.join(__dirname, 'images', 'original-backup');

// Create backup directory
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Hero images: convert to WebP, resize to 1920px max, target ~150-200KB
const heroImages = [
  { file: 'hero-banner.png', width: 1920, quality: 85 },
  { file: 'store-hero.png', width: 1920, quality: 85 },
  { file: 'work-hero.png', width: 1920, quality: 85 },
];

// Secondary images: convert to WebP, target ~50-80KB
const secondaryImages = [
  { file: 'manfuactor.jpg', width: 1200, quality: 80 },
  { file: 'store.jpg', width: 1200, quality: 80 },
  { file: 'holesale.jpg', width: 1200, quality: 80 },
];

async function optimizeImage(file, maxWidth, quality) {
  const inputPath = path.join(imagesDir, file);
  const outputFile = file.replace(/\.[^.]+$/, '.webp');
  const outputPath = path.join(imagesDir, outputFile);
  const backupPath = path.join(backupDir, file);

  if (!fs.existsSync(inputPath)) {
    console.log(`SKIP: ${file} not found`);
    return null;
  }

  // Backup original
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
    console.log(`BACKUP: ${file}`);
  }

  // Get original size
  const originalSize = fs.statSync(inputPath).size;

  // Convert to WebP and resize
  await sharp(inputPath)
    .resize(maxWidth, null, { withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(outputPath);

  const newSize = fs.statSync(outputPath).size;
  const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);

  console.log(`CONVERT: ${file} -> ${outputFile} (${(originalSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB, ${reduction}% reduction)`);

  return { original: file, output: outputFile };
}

async function main() {
  console.log('=== LAVA Image Optimization ===\n');

  console.log('--- Hero Images (target: ~150-200KB WebP) ---');
  const heroResults = [];
  for (const img of heroImages) {
    const result = await optimizeImage(img.file, img.width, img.quality);
    if (result) heroResults.push(result);
  }

  console.log('\n--- Secondary Images (target: ~50-80KB WebP) ---');
  const secondaryResults = [];
  for (const img of secondaryImages) {
    const result = await optimizeImage(img.file, img.width, img.quality);
    if (result) secondaryResults.push(result);
  }

  console.log('\n=== Optimization Complete ===');
  console.log(`Total images optimized: ${heroResults.length + secondaryResults.length}`);
  console.log(`Originals backed up to: ${backupDir}`);

  // Output mapping for HTML updates
  console.log('\n--- File Mapping (for HTML preload updates) ---');
  [...heroResults, ...secondaryResults].forEach(r => {
    console.log(`${r.original} -> ${r.output}`);
  });
}

main().catch(console.error);
