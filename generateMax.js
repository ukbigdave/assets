const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const spriteDir = 'Images/Pokemon';
const overlayPath = './max.png';
const SCALE = 0.9;
const OVERLAY_SCALE = 0.35; // 25% size of the base

if (!fs.existsSync(spriteDir)) fs.mkdirSync(spriteDir);

(async () => {
    const overlay = await loadImage(overlayPath);

    const files = fs.readdirSync(spriteDir).filter(f =>
        f.endsWith('.png') &&
        !f.includes('-') &&
        !f.includes('-SHADOW') &&
        !f.includes('-MAX')
    );

    for (const file of files) {
        const base = await loadImage(path.join(spriteDir, file));

        const width = Math.floor(base.width * SCALE);
        const height = Math.floor(base.height * SCALE);

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Draw base image first
        ctx.drawImage(base, 0, 0, width, height);

        // Scale overlay
        const overlayWidth = width * OVERLAY_SCALE;
        const overlayHeight = overlay.height * (overlayWidth / overlay.width);

        // Position overlay in bottom-left
        const overlayX = 0;
        const overlayY = height - overlayHeight;

        ctx.drawImage(overlay, overlayX, overlayY, overlayWidth, overlayHeight);

        const outPath = path.join(spriteDir, file.replace('.png', '-MAX.png'));
        const buffer = canvas.toBuffer('image/png', { compressionLevel: 9 });

        fs.writeFileSync(outPath, buffer);
        console.log(`✅ ${file} -> ${Math.round(buffer.length / 1024)} KB`);
    }
})();
