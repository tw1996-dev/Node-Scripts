// tw1996-dev
// Image Compression Script: JPG, JPEG, PNG to WebP
// This script will compress JPG, JPEG, and PNG images into WebP format. It aims to significantly reduce file size while maintaining image quality.

// After using this script, you can then use a separate "webp-to-png" script (if desired) to convert all the WebP images back to PNG format.

// First, check what the modules export
console.log('imagemin:', typeof require('imagemin'));
console.log('imageminWebp:', typeof require('imagemin-webp'));

const imagemin = require('imagemin');
const imageminWebp = require('imagemin-webp');
const path = require('path');
const fs = require('fs').promises;

async function convertToWebP() {
    try {
        // Check if the output folder exists; if not, create it
        try {
            await fs.access('output');
        } catch {
            await fs.mkdir('output', { recursive: true });
            console.log('Created output/ folder');
        }

        console.log('Starting image conversion...');
        
        // Check different ways to call imagemin
        let imageminFunc = imagemin;
        let webpPlugin = imageminWebp;
        
        // If imagemin is not a function, try .default
        if (typeof imagemin !== 'function' && imagemin.default) {
            imageminFunc = imagemin.default;
        }
        
        // If imageminWebp is not a function, try .default
        if (typeof imageminWebp !== 'function' && imageminWebp.default) {
            webpPlugin = imageminWebp.default;
        }
        
        console.log('Using:', typeof imageminFunc, typeof webpPlugin);
        
        const files = await imageminFunc(['images/*.{jpg,jpeg,png}'], {
            destination: 'output',
            plugins: [
                webpPlugin({ 
                    quality: 75,
                    method: 6,
                    alphaQuality: 75
                })
            ]
        });

        if (files.length === 0) {
            console.log('No images found for conversion in images/ folder.');
            return;
        }

        // Rename extensions to .webp (asynchronously)
        const renamePromises = files.map(async (file) => {
            const oldPath = file.destinationPath;
            const newPath = oldPath.replace(/\.(jpe?g|png)$/i, '.webp');

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

        console.log(`\n🎉 Successfully converted ${files.length} images to WebP format!`);
        console.log(`📁 Files saved in: output/`);

    } catch (error) {
        console.error('❌ An error occurred during conversion:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Run the script
convertToWebP();