const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const spriteDir = 'Images/Pokemon';
const overlayPath = './shadow.png';
const SCALE = 0.9;
const OVERLAY_SCALE = 1.15;

function shouldGenerateShadow(file) {
    return file.endsWith('.png') &&
        !file.includes('-SHADOW') &&
        (file.startsWith('9') || file === '487-ALTERED.png' || file === '487-ORIGIN.png');
}

async function generateShadow(file, overlay) {
    const base = await loadImage(path.join(spriteDir, file));

    const width = Math.floor(base.width * SCALE);
    const height = Math.floor(base.height * SCALE);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw slightly oversized overlay, centred
    const overlayWidth = width * OVERLAY_SCALE;
    const overlayHeight = height * OVERLAY_SCALE;
    const offsetX = -(overlayWidth - width) / 2;
    const offsetY = -(overlayHeight - height) / 2;

    ctx.drawImage(overlay, offsetX, offsetY, overlayWidth, overlayHeight);
    ctx.drawImage(base, 0, 0, width, height);

    const outPath = path.join(spriteDir, file.replace('.png', '-SHADOW.png'));
    const buffer = canvas.toBuffer('image/png', { compressionLevel: 9 });

    fs.writeFileSync(outPath, buffer);
    console.log(`✅ ${file} -> ${Math.round(buffer.length / 1024)} KB`);
}

if (!fs.existsSync(spriteDir)) fs.mkdirSync(spriteDir);

(async () => {
    const overlay = await loadImage(overlayPath);

    const files = fs.readdirSync(spriteDir).filter(shouldGenerateShadow);

    for (const file of files) {
        await generateShadow(file, overlay);
    }
})();