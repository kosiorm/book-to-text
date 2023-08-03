import puppeteer from 'puppeteer';
import fs from 'fs';
import path, { resolve } from 'path';
import axios from 'axios';
import { exec, execSync } from 'child_process';
import { processFile, downloadBook, convertAndUploadAAX } from '../../utils/utils'; // Add this line

const email = process.env.EMAIL;
const password = process.env.PASSWORD;
const activationBytes = process.env.ACTIVATION_BYTES;

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const bookTitle = req.body.bookTitle;
        const mp3Url = req.body.mp3Url;

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'];
        const baseUrl = `${protocol}://${host}`;

        if (mp3Url) {
            // If an MP3 URL is provided, download it, save it as an MP3 file, and process it with whisperx
            const fileName = mp3Url.split('/').pop().split('.')[0];
            const pathToFile = resolve(process.cwd(), './public/audio', `${fileName}.mp3`);
            const finalJsonFolder = path.resolve('./public/json', fileName);
            const jsonUrl = `${baseUrl}/json/${fileName}/${fileName}.json`;

            // Return the links to the MP3 and JSON files immediately
            res.status(200).json({ mp3Url: `${baseUrl}/audio/${fileName}.mp3`, jsonUrl });

            try {
                const response = await axios.get(mp3Url, { responseType: 'stream' });
                const writer = fs.createWriteStream(pathToFile);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                if (!fs.existsSync(finalJsonFolder)) {
                    fs.mkdirSync(finalJsonFolder);
                }
                await processFile(pathToFile, finalJsonFolder);
            } catch (error) {
                console.error(`Error during download: ${error}`);
            }
        }  else if (bookTitle) {
        // If a book title is provided, perform the full process
        const fileName = bookTitle.replace(/ /g, '_');
        const aarPath = resolve(process.cwd(), './public/aar', `${fileName}.aax`);
        const mp3Url = `${baseUrl}/audio/${fileName}.mp3`;
        const jsonUrl = `${baseUrl}/json/${fileName}/${fileName}.json`;

        res.status(200).json({ mp3Url, jsonUrl });

        const { browser } = await downloadBook(email, password, bookTitle, aarPath, async () => {
            await convertAndUploadAAX(aarPath, fileName, baseUrl, activationBytes);
            await browser.close();
        });
    } else {
        res.status(400).json({ error: 'Either bookTitle or mp3Url is required' });
    }
} else {
    res.status(405).json({ message: 'Method not allowed' });
}
}