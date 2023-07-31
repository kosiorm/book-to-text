import puppeteer from 'puppeteer';
import fs from 'fs';
import path, { resolve } from 'path';
import axios from 'axios';
import { exec } from 'child_process';

const email = process.env.EMAIL;
const password = process.env.PASSWORD;

async function runFfprobe(pathToFile: string) {
    const command = `ffprobe "${pathToFile}"`;
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            const match = stderr.match(/file checksum == (\w+)/);
            const key = match ? match[1] : null;
            resolve(key);
        });
    });
}

async function runRcrack(key: string) {
    const rcrackPath = path.resolve(process.cwd(), './public/tables-master/run/rcrack.exe');
    const command = `${rcrackPath} . -h ${key}`;
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            const match = stdout.match(/hex:(\w+)/);
            const key = match ? match[1] : null;

            if (key) {
                const envFilePath = path.resolve(process.cwd(), '.env.local');
                let envFileContent = fs.readFileSync(envFilePath, 'utf8');
                envFileContent = envFileContent.replace(/(ACTIVATION_BYTES=).*/, `$1${key}`);
                fs.writeFileSync(envFilePath, envFileContent);
            }

            resolve(key);
        });
    });
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const bookTitle = req.body.bookTitle;

        if (bookTitle) {
            const fileName = bookTitle.replace(/ /g, '_');
            const aarPath = resolve(process.cwd(), './public/aar', `${fileName}.aax`);

            const browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();

            await page.setRequestInterception(true);
            page.on('request', async (interceptedRequest) => {
                if (interceptedRequest.url().includes('download?asin=')) {
                    if (fs.existsSync(aarPath)) {
                        const key = await runFfprobe(aarPath);
                        if (key) {
                            await runRcrack(key);
                            await browser.close();
                            res.write('Extracting activation bytes complete');
                            res.end();
                        }
                    } else {
                        const downloadUrl = interceptedRequest.url();
                        interceptedRequest.continue();

                        const response = await axios.get(downloadUrl, {
                            headers: interceptedRequest.headers(),
                            responseType: 'stream'
                        });

                        const writer = fs.createWriteStream(aarPath);

                        writer.on('finish', async () => {
                            const key = await runFfprobe(aarPath);
                            if (key) {
                                await runRcrack(key);
                                await browser.close();
                                res.write('Extracting activation bytes complete');
                                res.end();
                            }
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

            try {
                await page.type('#lib-search', bookTitle);
                await page.keyboard.press('Enter');
                // Wait for the book-related element to appear
                await page.waitForSelector('.adbl-library-content-row');
            } catch (error) {
                console.error(`Error during page interaction: ${error}`);
            }

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
            res.status(400).json({ error: 'bookTitle is required' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}