
import { downloadBook } from '../../utils/utils';
import fs from 'fs';
import path, { resolve } from 'path';

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

            // Get the browser and page from downloadBook
            const { browser, page } = await downloadBook(email, password, bookTitle, aarPath, () => {});
            if (fs.existsSync(aarPath)) {
                const key = await runFfprobe(aarPath);
                if (key) {
                    await runRcrack(key);
                    // Close the browser after the download and extraction processes are complete
                    await browser.close();
                    res.write('Extracting activation bytes complete');
                    res.end();
                }
            }
        } else {
            res.status(400).json({ error: 'bookTitle is required' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}