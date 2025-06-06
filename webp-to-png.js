// tw1996-dev
// Script for WebP → PNG conversion with maximum lossless compression
console.log('imagemin:', typeof require('imagemin'));

const imagemin = require('imagemin');
const imageminPngout = require('imagemin-pngout'); // Best PNG compression
const path = require('path');
const fs = require('fs').promises;

async function convertWebPtoPNG() {
    try {
        // Check if the 'output' folder exists
        try {
            await fs.access('output');
        } catch {
            console.log('❌ The output/ folder does not exist! Please run the first script first.');
            return;
        }

        // Create 'outputpng' folder
        try {
            await fs.access('outputpng');
        } catch {
            await fs.mkdir('outputpng', { recursive: true });
            console.log('Created outputpng/ folder.');
        }

        console.log('Starting WebP → PNG conversion...\n');

        // Check for WebP files
        const webpFiles = await fs.readdir('output');
        const webpCount = webpFiles.filter(file => file.toLowerCase().endsWith('.webp')).length;
        
        if (webpCount === 0) {
            console.log('❌ No WebP files found in the output/ folder.');
            return;
        }

        console.log(`Found ${webpCount} WebP files to convert.`);

        // Prepare imagemin
        let imageminFunc = imagemin;
        let pngoutPlugin = imageminPngout;

        // Check for .default export
        if (typeof imagemin !== 'function' && imagemin.default) {
            imageminFunc = imagemin.default;
        }
        if (typeof imageminPngout !== 'function' && imageminPngout.default) {
            pngoutPlugin = imageminPngout.default;
        }

        console.log('Using:', typeof imageminFunc, typeof pngoutPlugin);

        // Convert WebP → PNG with maximum lossless compression
        const files = await imageminFunc(['output/*.webp'], {
            destination: 'outputpng',
            plugins: [
                pngoutPlugin({
                    // Maximum lossless compression
                    strategy: 0,  // Most aggressive compression strategy
                    verbose: false
                })
            ]
        });

        if (files.length === 0) {
            console.log('❌ Failed to convert any files.');
            return;
        }

        // Change extensions from .webp to .png
        const renamePromises = files.map(async (file) => {
            const oldPath = file.destinationPath;
            const newPath = oldPath.replace(/\.webp$/i, '.png');

            if (oldPath !== newPath) {
                try {
                    await fs.rename(oldPath, newPath);
                    console.log(`✓ ${path.basename(oldPath)} → ${path.basename(newPath)}`);
                } catch (error) {
                    console.error(`Error renaming ${oldPath}:`, error.message);
                }
            }
        });

        await Promise.all(renamePromises);

        console.log(`\n🎉 Successfully converted ${files.length} WebP files → PNG!`);
        console.log(`📁 PNG files saved in: outputpng/`);

        // Show size comparison
        await compareFileSizes();

    } catch (error) {
        console.error('❌ An error occurred during conversion:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Function to compare file sizes
async function compareFileSizes() {
    try {
        console.log('\n📊 SIZE COMPARISON:');

        const webpFiles = await fs.readdir('output').catch(() => []);
        const pngFiles = await fs.readdir('outputpng').catch(() => []);

        let webpSize = 0, pngSize = 0;

        // Calculate WebP sizes
        for (const file of webpFiles) {
            if (file.toLowerCase().endsWith('.webp')) {
                try {
                    const stats = await fs.stat(path.join('output', file));
                    webpSize += stats.size;
                } catch {}
            }
        }

        // Calculate PNG sizes
        for (const file of pngFiles) {
            if (file.toLowerCase().endsWith('.png')) {
                try {
                    const stats = await fs.stat(path.join('outputpng', file));
                    pngSize += stats.size;
                } catch {}
            }
        }

        const formatSize = (bytes) => {
            const mb = bytes / (1024 * 1024);
            return mb > 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
        };

        console.log(`🔸 WebP (output/): ${formatSize(webpSize)}`);
        console.log(`🔸 PNG (outputpng/): ${formatSize(pngSize)}`);
        
        if (pngSize > webpSize) {
            const increase = ((pngSize - webpSize) / webpSize * 100).toFixed(1);
            console.log(`📈 PNGs are larger by ${increase}% (${formatSize(pngSize - webpSize)})`);
        } else {
            const decrease = ((webpSize - pngSize) / webpSize * 100).toFixed(1);
            console.log(`📉 PNGs are smaller by ${decrease}% (${formatSize(webpSize - pngSize)})`);
        }

        console.log(`\n💡 PNGs maintain 100% quality with maximum lossless compression!`);

    } catch (error) {
        console.log('⚠️  Could not compare file sizes.');
    }
}

// Run the script
convertWebPtoPNG();