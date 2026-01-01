const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../public/images/logo.jpg');
const outputDir = path.join(__dirname, '../app');
const publicDir = path.join(__dirname, '../public');

async function generateFavicons() {
  try {
    // Read the logo
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`Original image size: ${metadata.width}x${metadata.height}`);

    // The logo is circular, we'll crop the center portion (the main icon)
    // to avoid including the text and phone number
    const centerSize = Math.min(metadata.width, metadata.height);
    const cropSize = Math.floor(centerSize * 0.6); // Take 60% of the center
    const left = Math.floor((metadata.width - cropSize) / 2);
    const top = Math.floor((metadata.height - cropSize) / 2);

    // Extract the center portion
    const centerIcon = image.extract({
      left: left,
      top: top,
      width: cropSize,
      height: cropSize
    });

    // Generate favicon.ico (32x32)
    console.log('Generating favicon.ico...');
    await centerIcon
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'favicon.ico'));

    // Generate favicon-16x16.png
    console.log('Generating favicon-16x16.png...');
    await centerIcon
      .clone()
      .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16.png'));

    // Generate favicon-32x32.png
    console.log('Generating favicon-32x32.png...');
    await centerIcon
      .clone()
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));

    // Generate apple-touch-icon.png (180x180)
    console.log('Generating apple-touch-icon.png...');
    await centerIcon
      .clone()
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    // Generate a larger favicon (192x192) for Android
    console.log('Generating android-chrome-192x192.png...');
    await centerIcon
      .clone()
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'android-chrome-192x192.png'));

    // Generate an even larger favicon (512x512) for Android
    console.log('Generating android-chrome-512x512.png...');
    await centerIcon
      .clone()
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'android-chrome-512x512.png'));

    console.log('✅ All favicon files generated successfully!');
    console.log('\nGenerated files:');
    console.log('- app/favicon.ico (32x32)');
    console.log('- public/favicon-16x16.png');
    console.log('- public/favicon-32x32.png');
    console.log('- public/apple-touch-icon.png (180x180)');
    console.log('- public/android-chrome-192x192.png');
    console.log('- public/android-chrome-512x512.png');

  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
