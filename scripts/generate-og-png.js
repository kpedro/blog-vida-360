/**
 * Gera og-banner.png a partir do og-banner.svg para Open Graph (Facebook, etc.)
 * Execute: npm run generate-og-png
 */
const path = require('path');
const fs = require('fs');

const sharp = require('sharp');

const svgPath = path.join(__dirname, '../assets/images/og-banner.svg');
const pngPath = path.join(__dirname, '../assets/images/og-banner.png');

const svgBuffer = fs.readFileSync(svgPath);

sharp(svgBuffer)
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log('✅ og-banner.png gerado em assets/images/og-banner.png');
  })
  .catch((err) => {
    console.error('❌ Erro ao gerar PNG:', err);
    process.exit(1);
  });
