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

export async function downloadBook(bookTitle: string) {
    const outputDir = path.resolve(process.cwd(), './public/aar');
    return new Promise((resolve, reject) => {
        console.log(`Starting download of book: ${bookTitle}`);
        exec(`audible download --aax --title '${bookTitle}' --output-dir '${outputDir}'`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing audible-cli: ${error}`);
                reject(error);
                return;
            }
            console.log(`audible-cli output: ${stdout}`);
            console.log(`Finished download of book: ${bookTitle}`);
            resolve(stdout);
        });
    });
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