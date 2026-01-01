# Favicon Generation

This directory contains the script to generate all favicon files from the Healthy Club logo.

## Generated Files

The script generates the following favicon files:

- **app/favicon.ico** - 32x32 ICO file (Next.js default location)
- **public/favicon-16x16.png** - 16x16 PNG favicon
- **public/favicon-32x32.png** - 32x32 PNG favicon
- **public/apple-touch-icon.png** - 180x180 PNG for iOS devices
- **public/android-chrome-192x192.png** - 192x192 PNG for Android
- **public/android-chrome-512x512.png** - 512x512 PNG for Android

## How It Works

The script:
1. Reads the circular logo from `public/images/logo.jpg`
2. Extracts the center 60% of the image (focusing on the icon without text/phone)
3. Resizes it to multiple dimensions for different devices
4. Saves as PNG files with transparent backgrounds

## Usage

To regenerate the favicons (e.g., if the logo changes):

```bash
npm run generate-favicon
```

Or run directly:

```bash
node scripts/generate-favicon.js
```

## Dependencies

Requires `sharp` package for image processing (already included in devDependencies).

## Metadata Configuration

The favicon metadata is configured in `app/layout.tsx` with proper size references and the web manifest link.
