import sharp from 'sharp';

/**
 * Image optimisation + thumbnail generation.
 * Large images are resized/compressed to keep storage and bandwidth low
 * ("Optimized storage and compression" requirement).
 */
export async function optimizeImage(buffer) {
  const image = sharp(buffer, { failOn: 'none' }).rotate(); // auto-orient
  const meta = await image.metadata();

  const optimized = await image
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const thumbnail = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: 480, height: 480, fit: 'cover', position: 'attention' })
    .jpeg({ quality: 70 })
    .toBuffer();

  return {
    optimized,
    thumbnail,
    width: meta.width || null,
    height: meta.height || null,
  };
}

/**
 * Apply a dynamic, semi-transparent diagonal watermark to an image buffer.
 * Watermark text is built from club name / event name / user role.
 */
export async function watermarkImage(buffer, { clubName, eventName, role } = {}) {
  const image = sharp(buffer, { failOn: 'none' }).rotate();
  const meta = await image.metadata();
  const width = meta.width || 1200;
  const height = meta.height || 800;

  const lines = [clubName, eventName].filter(Boolean);
  const mainText = lines.join('  •  ') || 'CIG Media';
  const subText = role ? `Downloaded by ${role}` : '';

  const fontSize = Math.max(18, Math.round(width / 28));
  const subFontSize = Math.round(fontSize * 0.6);

  // Tiled diagonal watermark across the whole image + a corner label.
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="wm" width="${width / 2}" height="${height / 3}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
        <text x="0" y="${fontSize}" font-family="Arial, sans-serif" font-size="${fontSize}"
              fill="rgba(255,255,255,0.18)" font-weight="700">${escapeXml(mainText)}</text>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wm)" />
    <text x="${width - 16}" y="${height - 18}" text-anchor="end"
          font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700"
          fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.35)" stroke-width="1">${escapeXml(mainText)}</text>
    ${
      subText
        ? `<text x="${width - 16}" y="${height - 18 - fontSize}" text-anchor="end"
             font-family="Arial, sans-serif" font-size="${subFontSize}"
             fill="rgba(255,255,255,0.75)">${escapeXml(subText)}</text>`
        : ''
    }
  </svg>`;

  return image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 88 })
    .toBuffer();
}

function escapeXml(str = '') {
  return str.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c])
  );
}
