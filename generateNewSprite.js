/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const spriteDir = 'Images/Pokemon';
const MAX_EMOJI_PX = 128;       // Discord emoji recommended max dimensions
const MAX_FILE_KB = 256;        // Discord emoji upload size limit (best-effort)
const OUTPUT_FORMAT = 'image/png';
const PNG_COMPRESSION = 9;      // Lossless, helps stay <256KB

if (!fs.existsSync(spriteDir)) fs.mkdirSync(spriteDir, { recursive: true });

async function main() {
    const [, , url, rawName] = process.argv;

    if (!url || !rawName) {
        console.error('Usage: node newsprite.js <imageUrl> <spriteName>');
        process.exit(1);
    }

    // Ensure .png suffix once
    const baseName = rawName.toLowerCase().endsWith('.png') ? rawName : `${rawName}.png`;
    const outPath = path.join(spriteDir, baseName);

    try {
        // Use global fetch (Node 18+). If you’re on older Node, install node-fetch.
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch image (${res.status} ${res.statusText})`);

        const buf = Buffer.from(await res.arrayBuffer());
        const img = await loadImage(buf);

        // Compute target size (fit within 128x128, keep aspect)
        const scale = Math.min(MAX_EMOJI_PX / img.width, MAX_EMOJI_PX / img.height, 1);
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));

        const canvas = createCanvas(targetW, targetH);
        const ctx = canvas.getContext('2d');

        // Transparent canvas by default; draw scaled image
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        // Encode PNG (max compression to help stay under 256KB)
        let out = canvas.toBuffer(OUTPUT_FORMAT, { compressionLevel: PNG_COMPRESSION });

        // Safety check: if somehow still >256KB (rare at 128×128 PNG), try re-encode via JPEG fallback.
        if (out.length / 1024 > MAX_FILE_KB) {
            // Last-resort: JPEG at quality 0.85 (drops alpha). Only used if PNG >256KB.
            // If you must preserve transparency, comment this block out.
            out = canvas.toBuffer('image/jpeg', { quality: 0.85 });
            if (out.length / 1024 > MAX_FILE_KB) {
                // One more nudge
                out = canvas.toBuffer('image/jpeg', { quality: 0.75 });
            }
        }

        fs.writeFileSync(outPath, out);
        console.log(`✅ Saved ${path.basename(outPath)} (${targetW}x${targetH}, ${Math.round(out.length / 1024)} KB)`);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

main();