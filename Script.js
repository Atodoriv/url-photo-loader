const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const urlModule = require('url');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

async function downloadImage(url, filepath) {
    const response = await axios({
        url,
        responseType: 'arraybuffer',
    });
    await writeFileAsync(filepath, response.data);
    console.log(`Downloaded ${url}`);
}

async function downloadImagesFromUrl(pageUrl, folderPath) {
    // Create the folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
        await mkdirAsync(folderPath, { recursive: true });
    }

    const response = await axios.get(pageUrl);
    const $ = cheerio.load(response.data);
    const imgUrls = [];

    $('img').each((_, element) => {
        const imgSrc = $(element).attr('src');
        if (imgSrc) {
            const imgUrl = urlModule.resolve(pageUrl, imgSrc);
            imgUrls.push(imgUrl);
        }
    });

    for (const imgUrl of imgUrls) {
        const urlPath = urlModule.parse(imgUrl).pathname;
        const filename = path.basename(urlPath);
        const filepath = path.join(folderPath, filename);
        await downloadImage(imgUrl, filepath);
    }
}

async function main() {
    const pageUrl = process.argv[2];
    const folderPath = process.argv[3];

    if (!pageUrl || !folderPath) {
        console.error('Usage: node script.js <URL> <folder-path>');
        process.exit(1);
    }

    try {
        await downloadImagesFromUrl(pageUrl, folderPath);
        console.log('All images downloaded!');
    } catch (err) {
        console.error('Error downloading images:', err);
    }
}

main();
