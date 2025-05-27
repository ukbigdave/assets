const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const spriteDir = 'Images/Pokemon';
const MAX_SIZE_KB = 256;
const MAX_DIMENSION = 128;      // new: max width/height for Discord emoji
const SCALE_STEP = 0.95;
const MIN_SCALE = 0.75;

const shrinkImage = async (file) => {
    const filePath = path.join(spriteDir, file);
    const original = await loadImage(filePath);

    // new: skip if already within both size and dimension limits
    const { size } = fs.statSync(filePath);
    if (
        original.width  <= MAX_DIMENSION &&
        original.height <= MAX_DIMENSION &&
        size            <= MAX_SIZE_KB * 1024
    ) {
        console.log(`⏭️ ${file} within limits, skipped`);
        return;
    }

    // new: start at dimension cap
    const dimensionScale = Math.min(
        1,
        MAX_DIMENSION / original.width,
        MAX_DIMENSION / original.height
    );
    let scale = dimensionScale;
    let buffer, sizeKB;

    // new: iteratively down-scale until under size limit
    do {
        const width  = Math.floor(original.width  * scale);
        const height = Math.floor(original.height * scale);
        const canvas = createCanvas(width, height);
        const ctx    = canvas.getContext('2d');

        ctx.drawImage(original, 0, 0, width, height);
        buffer = canvas.toBuffer('image/png', { compressionLevel: 9 });
        sizeKB = buffer.length / 1024;

        console.log(`⚙️ ${file} @ ${Math.round(scale*100)}% → ${Math.round(sizeKB)} KB`);
        if (sizeKB > MAX_SIZE_KB && scale > MIN_SCALE) {
            scale *= SCALE_STEP;
        } else {
            break;
        }
    } while (true);

    fs.writeFileSync(path.join(spriteDir, file), buffer);
    console.log(`✅ ${file} final @ ${Math.round(scale*100)}% → ${Math.round(sizeKB)} KB`);
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