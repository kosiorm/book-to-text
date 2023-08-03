import fs from 'fs';
import path, { resolve } from 'path';
import { downloadFile, processDownloadedFile, downloadBook, convertAndUploadAAX } from '../../utils/utils';

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
            const fileName = mp3Url.split('/').pop().split('.')[0];
            const pathToFile = resolve(process.cwd(), './public/audio', `${fileName}.mp3`);
            const finalJsonFolder = path.resolve('./public/json', fileName);
            const jsonUrl = `${baseUrl}/json/${fileName}/${fileName}.json`;

            res.status(200).json({ mp3Url: `${baseUrl}/audio/${fileName}.mp3`, jsonUrl });

            try {
                await downloadFile(mp3Url, pathToFile);
                await processDownloadedFile(pathToFile, finalJsonFolder);
            } catch (error) {
                console.error(`Error during download: ${error}`);
            }
        } else if (bookTitle) {
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