import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { exec } from 'child_process';
import path, { resolve } from 'path';
import { downloadFile, processDownloadedFile, downloadBook, convertAndUploadAAX } from '../../utils/utils';


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
            } catch (error) {
                console.error(`Error during download: ${error}`);
            }
        } else if (bookTitle) {
            try {
                console.log('Starting download of book...');
                const fileName = await downloadBook(bookTitle);
                console.log('Finished download of book. Starting conversion...');
                const aarPath = resolve(process.cwd(), './public/aar', fileName);
                const mp3Url = `${baseUrl}/audio/${fileName.replace('.aax', '.mp3')}`;
                const jsonUrl = `${baseUrl}/json/${fileName.replace('.aax', '')}/${fileName.replace('.aax', '')}.json`;
                res.status(200).json({ mp3Url, jsonUrl });
    
                // Get activation bytes
                let command = 'audible activation-bytes';
                if (password) {
                    command = `audible -p ${password} activation-bytes`;
                }

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error executing audible-cli: ${error}`);
                        return;
                    }
    
                    const activationBytes = stdout.trim();
    
                    // Update the .env.local file if it exists
                    const envFilePath = path.resolve(process.cwd(), '.env.local');
                    if (fs.existsSync(envFilePath)) {
                        let envFileContent = fs.readFileSync(envFilePath, 'utf8');
                        envFileContent = envFileContent.replace(/(ACTIVATION_BYTES=).*/, `$1${activationBytes}`);
                        fs.writeFileSync(envFilePath, envFileContent);
                    } else {
                        // If .env.local doesn't exist, set the activation bytes as an environment variable
                        process.env.ACTIVATION_BYTES = activationBytes;
                        console.log(`Activation bytes: ${activationBytes}`);
                    }
    
                    // Convert and upload AAX
                    convertAndUploadAAX(aarPath, fileName.replace('.aax', ''), baseUrl, activationBytes).catch(console.error);
                });
            } catch (error) {
                console.error(error.message);
            }
        }
    }
}