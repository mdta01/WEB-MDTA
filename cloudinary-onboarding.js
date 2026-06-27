// Cloudinary Onboarding Script - MDTA Miftahul Ulum 01
// Run with: node cloudinary-onboarding.js

const cloudinary = require('cloudinary').v2;

// === Configure Cloudinary (inline, no .env file) ===
cloudinary.config({
  cloud_name: 'duq8rhc3g',        // ← Cloud Name
  api_key: '667529899286123',      // ← API Key
  api_secret: 'ekaiIHYiBtlIuGVnlvF7uMn8XuU', // ← API Secret
});

async function main() {
  console.log('=== Cloudinary Onboarding ===\n');

  // --- 1. Upload an image (from Cloudinary's demo domain) ---
  console.log('Step 1: Uploading sample image...');
  const uploadResult = await cloudinary.uploader.upload(
    'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    { public_id: 'mdta_onboarding_test' }
  );

  console.log('Secure URL:', uploadResult.secure_url);
  console.log('Public ID:', uploadResult.public_id);
  console.log('');

  // --- 2. Get image details (metadata) ---
  console.log('Step 2: Fetching image metadata...');
  const details = await cloudinary.api.resource(uploadResult.public_id);

  console.log('Width:', details.width, 'px');
  console.log('Height:', details.height, 'px');
  console.log('Format:', details.format);
  console.log('File size:', details.bytes, 'bytes');
  console.log('');

  // --- 3. Transform the image ---
  console.log('Step 3: Generating optimized transformed URL...');
  // f_auto = automatic format selection (serves WebP/AVIF to compatible browsers for smaller size)
  // q_auto = automatic quality (reduces file size while keeping visual quality)
  const transformedUrl = cloudinary.url(uploadResult.public_id, {
    fetch_format: 'auto',  // f_auto
    quality: 'auto',        // q_auto
  });

  console.log('Done! Click link below to see optimized version of the image. Check the size and the format.');
  console.log('Transformed URL:', transformedUrl);
  console.log('\n=== Onboarding Complete ===');
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
