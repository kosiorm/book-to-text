import puppeteer from 'puppeteer';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path, { resolve } from 'path';
import axios from 'axios';
import { Solver } from '2captcha';

const solver = new Solver('8001c8f996159eff564e918e52500534');

export async function processFile(pathToFile: string, finalJsonFolder: string) {
    const condaEnvName = 'btt';
    const command = `conda run -n ${condaEnvName} whisperx ${pathToFile} --model large-v2 --align_model WAV2VEC2_ASR_LARGE_LV60K_960H --batch_size 8 --output_dir  ${finalJsonFolder}`;
    try {
        const stdout = execSync(command);
        return stdout;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error during processing: ${error.message}`);
            console.error(`Error stack: ${error.stack}`);
        } else {
            console.error(`Error during processing: ${error}`);
        }
    }
}

export async function downloadBook(email: string, password: string, bookTitle: string, aarPath: string, onDownloadFinish: () => Promise<void>) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    const page = await browser.newPage();

 
    await page.setViewport({ width: 1280, height: 800 });

    if (fs.existsSync(aarPath)) {
        console.log('Using local AAX file for testing');
        return { browser, page };
    }

    await page.setRequestInterception(true);
    page.on('request', async (interceptedRequest) => {
        if (interceptedRequest.url().includes('download?asin=')) {
            const downloadUrl = interceptedRequest.url();
            interceptedRequest.continue();

            const response = await axios.get(downloadUrl, {
                headers: interceptedRequest.headers(),
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(aarPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('close', async () => {
                    console.log('Download completed');
                    await onDownloadFinish();
                    resolve();
                });
        
                writer.on('error', (error) => {
                    console.error(`Error during download: ${error}`);
                    reject(error);
                });
            });
        } else {
            interceptedRequest.continue();
        }
    });

    await page.goto('https://www.audible.com/sign-in'); 

    
    let attempts = 0;
while (attempts < 3) {
    const captchaElement = await page.$('.a-row.a-text-center img');

    if (captchaElement) {
        const captchaImage = await captchaElement.screenshot({ encoding: 'base64' });
        const captchaSolution = await solver.imageCaptcha(captchaImage);
        const captchaSolutionUpperCase = captchaSolution.data.toUpperCase(); // convert the solution to uppercase
        // Enter the captcha solution into the page
        await page.evaluate((solution) => {
            document.querySelector('#captchacharacters').value = solution;
        }, captchaSolutionUpperCase); // use captchaSolutionUpperCase instead of captchaSolution.data

        // Wait for a moment before clicking the continue button
        await page.waitForTimeout(1000); // wait for 1 second

        // Click the continue button
        await page.evaluate(() => {
            document.querySelector('button[type="submit"].a-button-text').click();
        });

        attempts++;

        // Wait for the page to load
        await page.waitForTimeout(3000); // wait for 3 seconds
    } else {
        // If the captcha doesn't appear, proceed to the login page:
        await page.waitForSelector('#ap_email');
        await page.type('#ap_email', email, { delay: 100 });
        await page.waitForSelector('#ap_password');
        await page.type('#ap_password', password, { delay: 100 });
        await page.click('#signInSubmit');
        break;
    }
}

if (attempts === 3) {
    throw new Error('Failed to solve captcha after 3 attempts');
}

console.log('Login successful');
await page.waitForNavigation({ url: 'https://www.audible.com/?loginAttempt=true' }); 

await Promise.all([
    page.waitForNavigation(), 
    page.goto('https://www.audible.com/library/titles'), 
]);

    try {
    await page.waitForSelector('#lib-search');
    await page.type('#lib-search', bookTitle);
    await page.keyboard.press('Enter');
    await page.waitForSelector('.adbl-library-content-row');
} catch (error) {
    console.error(`Error during page interaction: ${error}`);
}

    const bookElements = await page.$$('.adbl-library-content-row');
    const bookElement = bookElements.find(async (el) => {
        const textContent = await page.evaluate(el => el.textContent, el);
        return textContent ? textContent.includes(bookTitle) : false;
    });

    if (bookElement) {
        const downloadButtonSelector = 'span[id^="download-button-"] > a.bc-button-text';
        const downloadButton = await bookElement.$(downloadButtonSelector);

        if (downloadButton) {
            const boundingBox = await downloadButton.boundingBox();
            if (boundingBox) {
                await page.evaluate((x, y) => {
                    window.scrollBy(x, y);
                }, boundingBox.x, boundingBox.y);
                await downloadButton.click();
                console.log('Download started');
            }
        }
    }
    return { browser, page };
}

export async function convertAndUploadAAX(aarPath: string, fileName: string, baseUrl: string, activationBytes: string) {
    const mp3Path = resolve(process.cwd(), './public/audio', `${fileName}.mp3`);
    const command = `ffmpeg -y -activation_bytes ${activationBytes} -i "${aarPath}" "${mp3Path}"`;

    try {
        console.log('Running ffmpeg command:', command);
        execSync(command);
        console.log('Conversion completed successfully');
        const pathToFile = mp3Path;
        const finalJsonFolder = path.resolve('./public/json', fileName.split('.')[0]);
        if (!fs.existsSync(finalJsonFolder)) {
            fs.mkdirSync(finalJsonFolder);
        }
        await processFile(pathToFile, finalJsonFolder);
    } catch (error) {
        console.error(`Error during conversion: ${error}`);
    }
}

export async function downloadFile(url: string, pathToFile: string) {
    const response = await axios.get(url, { responseType: 'stream' });
    const writer = fs.createWriteStream(pathToFile);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

export async function processDownloadedFile(pathToFile: string, finalJsonFolder: string) {
    if (!fs.existsSync(finalJsonFolder)) {
        fs.mkdirSync(finalJsonFolder);
    }
    return processFile(pathToFile, finalJsonFolder);
}