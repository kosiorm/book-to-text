import puppeteer from 'puppeteer';
import fs from 'fs';
import path, { resolve } from 'path';
import axios from 'axios';
import { exec, execSync } from 'child_process';

const email = process.env.EMAIL;
const password = process.env.PASSWORD;
const activationBytes = process.env.ACTIVATION_BYTES;

async function processFile(pathToFile: string, finalJsonFolder: string) {
    const command = `whisperx ${pathToFile} --model large-v2 --align_model WAV2VEC2_ASR_LARGE_LV60K_960H --batch_size 8 --output_dir ${finalJsonFolder}`;
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
}

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
        } else if (bookTitle) {
            // If a book title is provided, perform the full process
            const fileName = bookTitle.replace(/ /g, '_');
            const mp3Url = `${baseUrl}/audio/${fileName}.mp3`;
            const jsonUrl = `${baseUrl}/json/${fileName}/${fileName}.json`;

            res.status(200).json({ mp3Url, jsonUrl });

            const browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();

            // Intercept network requests
            await page.setRequestInterception(true);
            page.on('request', async (interceptedRequest) => {
                if (interceptedRequest.url().includes('download?asin=')) {
                    const aarPath = resolve(process.cwd(), './public/aar', `${fileName}.aax`);

                    if (fs.existsSync(aarPath)) {
                        console.log('Using local AAX file for testing');
                        await convertAndUploadAAX(aarPath, fileName, baseUrl);
                        await browser.close();
                    } else {
                        const downloadUrl = interceptedRequest.url();
                        interceptedRequest.continue();

                        const response = await axios.get(downloadUrl, {
                            headers: interceptedRequest.headers(),
                            responseType: 'stream'
                        });

                        const writer = fs.createWriteStream(aarPath);

                        response.data.pipe(writer);

                        writer.on('finish', async () => {
                            console.log('Download completed');
                            await convertAndUploadAAX(aarPath, fileName, baseUrl);
                            await browser.close();
                        });

                        writer.on('error', (error) => {
                            console.error(`Error during download: ${error}`);
                        });
                    }
                } else {
                    interceptedRequest.continue();
                }
            });

            await page.goto('https://www.audible.com/sign-in');
            await page.type('#ap_email', email);
            await page.type('#ap_password', password);
            await page.click('#signInSubmit');

            await page.waitForNavigation({ waitUntil: 'networkidle0' });

            await page.goto('https://www.audible.com/library/titles');

            await page.type('#lib-search', bookTitle);
            await page.keyboard.press('Enter'); //
            await page.waitForTimeout(2000); //

            const bookElements = await page.$$('.adbl-library-content-row');
            const bookElement = bookElements.find(async (el) => {
                const textContent = await page.evaluate(el => el.textContent, el);
                return textContent.includes(bookTitle);
            });
            if (bookElement) {
                const downloadButtonSelector = 'span[id^="download-button-"] > a.bc-button-text';
                const downloadButton = await bookElement.$(downloadButtonSelector);

                if (downloadButton) {
                    const boundingBox = await downloadButton.boundingBox();
                    await page.evaluate((x, y) => {
                        window.scrollBy(x, y);
                    }, boundingBox.x, boundingBox.y);
                    await downloadButton.click();
                }
            }

        } else {
            res.status(400).json({ error: 'Either bookTitle or mp3Url is required' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}

async function convertAndUploadAAX(aarPath, fileName, baseUrl) {
    const mp3Path = resolve(process.cwd(), './public/audio', `${fileName}.mp3`);
    const command = `ffmpeg -y -activation_bytes ${activationBytes} -i "${aarPath}" "${mp3Path}"`;

    try {
        execSync(command);
        console.log('Conversion completed successfully');
        const pathToFile = mp3Path;
        const finalJsonFolder = path.resolve('./public/json', fileName.split('.')[0]);
        if (!fs.existsSync(finalJsonFolder)) {
            fs.mkdirSync(finalJsonFolder);
        }
        await processFile(pathToFile, finalJsonFolder);
    } catch (error) {
        console.error(`Error during conversion: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
    }
}