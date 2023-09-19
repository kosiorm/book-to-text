import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { exec } from 'child_process';
import path, { resolve } from 'path';
import { downloadFile, processDownloadedFile, processMp3Url, downloadBook, convertAndUploadAAX } from '../../utils/utils';

const password = process.env.PASSWORD;
const activationBytes = process.env.ACTIVATION_BYTES;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const bookTitle = req.query.bookTitle as string | undefined;
        const mp3Url = req.query.mp3Url as string | undefined;

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'];
        const baseUrl = `${protocol}://${host}`;

        if (mp3Url) {
            try {
                const result = await processMp3Url(mp3Url, baseUrl);
                res.status(200).json(result);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        } else if (bookTitle) {
            const bookTitleNoSpaces = bookTitle.replace(/ /g, '_');
            const mp3Url = `${baseUrl}/audio/${bookTitleNoSpaces}.mp3`;
            const jsonUrl = `${baseUrl}/json/${bookTitleNoSpaces}/${bookTitleNoSpaces}.json`;
            res.status(200).json({ mp3Url, jsonUrl });

            try {
                console.log('Starting download of book...');
                const originalFileName = await downloadBook(bookTitle);
                console.log('Finished download of book. Starting conversion...');
            
                const oldPath = resolve(process.cwd(), './public/aar', originalFileName);
                const newPath = resolve(process.cwd(), './public/aar', `${bookTitleNoSpaces}.aax`);
                fs.renameSync(oldPath, newPath);
            
                const aarPath = newPath;
              
                
                let command = 'audible activation-bytes';
                if (password) {
                    command = `audible -p ${password} activation-bytes`;
                }
            
                await new Promise((resolve, reject) => {
                    exec(command, async (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error executing audible-cli: ${error}`);
                            reject(error);
                            return;
                        }
            
                        const activationBytes = stdout.trim().split('\n').pop();
            
                        const envFilePath = path.resolve(process.cwd(), '.env.local');
                        if (fs.existsSync(envFilePath)) {
                            let envFileContent = fs.readFileSync(envFilePath, 'utf8');
                            envFileContent = envFileContent.replace(/(ACTIVATION_BYTES=).*/, `$1${activationBytes}`);
                            fs.writeFileSync(envFilePath, envFileContent);
                        } else {
                            process.env.ACTIVATION_BYTES = activationBytes;
                            console.log(`Activation bytes: ${activationBytes}`);
                        }
            
                        try {
                            await convertAndUploadAAX(aarPath, bookTitleNoSpaces, baseUrl, activationBytes);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    });
                }).catch(console.error);
            
            } catch (error) {
                console.error(error.message);
                res.status(500).json({ error: error.message });
            }
        }
    }
}