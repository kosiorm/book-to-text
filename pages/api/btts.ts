import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path, { resolve } from 'path';
import { downloadFile, processDownloadedFile, downloadBook, convertAndUploadAAX } from '../../utils/utils';
import { exec } from 'child_process';
import os from 'os';

process.env.PATH = process.env.PATH + ':/path/to/whisperx';

const email = process.env.EMAIL;
const password = process.env.PASSWORD;
let activationBytes = process.env.ACTIVATION_BYTES;

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
    let rcrackPath: string;
    let command: string;
  
    if (os.platform() === 'win32') {
        rcrackPath = path.resolve(process.cwd(), './public/tables-master/run/rcrack.exe');
        command = `${rcrackPath} . -h ${key}`;
    } else {
        rcrackPath = path.resolve(process.cwd(), './public/tables-master/run/rcrack');
        command = `wine ${rcrackPath} . -h ${key}`;
    }

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            const match = stdout.match(/hex:(\w+)/);
            const activationBytes = match ? match[1] : null;

            if (activationBytes) {
                const envFilePath = path.resolve(process.cwd(), '.env.local');
                if (fs.existsSync(envFilePath)) {
                    let envFileContent = fs.readFileSync(envFilePath, 'utf8');
                    envFileContent = envFileContent.replace(/(ACTIVATION_BYTES=).*/, `$1${activationBytes}`);
                    fs.writeFileSync(envFilePath, envFileContent);
                } else {
                    console.log(`Activation bytes: ${activationBytes}`);
                }
            }

            resolve(activationBytes);
        });
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const bookTitle = req.query.bookTitle as string | undefined;
        const mp3Url = req.query.mp3Url as string | undefined;

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'];
        const baseUrl = `${protocol}://${host}`;

        if (!email || !password) {
            res.status(500).json({ error: 'Required environment variables are not set' });
            return;
        }

        if (bookTitle) {
            const fileName = bookTitle.replace(/ /g, '_');
            const aarPath = resolve(process.cwd(), './public/aar', `${fileName}.aax`);

            if (!activationBytes) {
                try {
                    const result = await downloadBook(email, password, bookTitle, aarPath, async () => {
                        const key = await runFfprobe(aarPath);
                        if (key) {
                            activationBytes = await runRcrack(key as string);
                            if (!activationBytes) {
                                res.status(500).json({ error: 'Activation bytes extraction failed' });
                                return;
                            }
                        } else {
                            res.status(500).json({ error: 'Key extraction failed' });
                            return;
                        }
                    });

                    if (result && result.browser) {
                        await result.browser.close();
                    }
                } catch (error) {
                    res.status(500).json({ error: error.message });
                }
            }

            const mp3Url = `${baseUrl}/audio/${fileName}.mp3`;
            const jsonUrl = `${baseUrl}/json/${fileName}/${fileName}.json`;

            res.status(200).json({ mp3Url, jsonUrl });

            if (fs.existsSync(aarPath)) {
                console.log('Starting conversion...');
                await convertAndUploadAAX(aarPath, fileName, baseUrl, activationBytes);
                console.log('Conversion finished');
            }

        } else if (mp3Url) {
            const fileName = mp3Url.split('/').pop()?.split('.')[0];
            if (!fileName) {
                res.status(400).json({ error: 'Invalid mp3Url' });
                return;
            }

            const pathToFile = resolve(process.cwd(), './public/audio', `${fileName}.mp3`);
            const finalJsonFolder = path.resolve('./public/json', fileName);

            res.status(200).json({ mp3Url: `${baseUrl}/audio/${fileName}.mp3`, jsonUrl: `${baseUrl}/json/${fileName}/${fileName}.json` });
           

            try {
                await downloadFile(mp3Url, pathToFile);
                console.log('Starting transcription...');
                await processDownloadedFile(pathToFile, finalJsonFolder);
                console.log('Transcription completed successfully.');

            }   catch (error) {
                console.error(`Error during download: ${error}`);
            }

        } else {
            res.status(400).json({ error: 'Either bookTitle or mp3Url is required' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}