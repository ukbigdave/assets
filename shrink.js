const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const spriteDir = 'Images/Pokemon';
const MAX_SIZE_KB = 256;
const SCALE_STEP = 0.95;
const MIN_SCALE = 0.75;

const shrinkImage = async (file, scale = 0.95) => {
    const original = await loadImage(path.join(spriteDir, file));

    const width = Math.floor(original.width * scale);
    const height = Math.floor(original.height * scale);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(original, 0, 0, width, height);

    const buffer = canvas.toBuffer('image/png', { compressionLevel: 9 });
    const sizeKB = buffer.length / 1024;

    if (sizeKB > MAX_SIZE_KB && scale > MIN_SCALE) {
        console.log(`⚠️ ${file} still too big (${Math.round(sizeKB)} KB), retrying at ${Math.round(scale * 100)}%`);
        return await shrinkImage(file, scale * SCALE_STEP);
    }

    fs.writeFileSync(path.join(spriteDir, file), buffer);
    console.log(`✅ Resized ${file} to ${Math.round(sizeKB)} KB @ ${Math.round(scale * 100)}%`);
};

(async () => {
    const files = fs.readdirSync(spriteDir).filter(f =>
        f.endsWith('.png') &&
        fs.statSync(path.join(spriteDir, f)).size > MAX_SIZE_KB * 1024
    );

    for (const file of files) {
        await shrinkImage(file);
    }
})();