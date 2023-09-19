import { exec, execSync } from 'child_process';
import fs from 'fs';
import path, { resolve } from 'path';
import axios from 'axios';
import { Solver } from '2captcha';


export async function processFile(pathToFile: string, finalJsonFolder: string) {
    const condaEnvName = 'btt';
    const command = `conda run -n ${condaEnvName} whisperx ${pathToFile} --model large-v2 --align_model WAV2VEC2_ASR_LARGE_LV60K_960H --batch_size 8 --output_dir  ${finalJsonFolder}`;
    try {
        const stdout = execSync(command);
        console.log('Finished processing request.');
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
    const password = process.env.PASSWORD;
    let command = `echo a | audible download --aax --title '${bookTitle}' --output-dir '${outputDir}'`;

    // Include the password in the command if it exists
    if (password) {
        command = `audible -p ${password} download -y --aax --title '${bookTitle}' --output-dir '${outputDir}'`;
    }

    return new Promise((resolve, reject) => {
        console.log(`Starting download of book: ${bookTitle}`);
        exec(command, { maxBuffer: 1024 * 5000 }, (error, stdout, stderr) => { // Increase maxBuffer size to 5MB
            if (error) {
                console.error(`Error executing audible-cli: ${error}`);
                reject(error);
                return;
            }
            console.log(`audible-cli output: ${stdout}`);
            console.log(`Finished download of book: ${bookTitle}`);
            
            fs.readdir(outputDir, (err, files) => {
                if (err) {
                    reject(new Error(`Could not read the aar directory: ${err}`));
                    return;
                }
                const fileName = files.find(file => file.includes(bookTitle.replace(/ /g, '_')));
                if (fileName) {
                    resolve(fileName);
                } else {
                    reject(new Error(`Could not find a file in the aar directory that includes the book title in its name`));
                }
            });
        });
    });
}

export async function convertAndUploadAAX(aarPath: string, bookTitle: string, baseUrl: string, activationBytes: string) {
    const mp3Path = resolve(process.cwd(), './public/audio', `${bookTitle}.mp3`);
    const command = `ffmpeg -y -activation_bytes ${activationBytes} -i "${aarPath}" "${mp3Path}"`;

    try {
        console.log('Running ffmpeg command:', command);
        execSync(command);
        console.log('Conversion completed successfully');
        const pathToFile = mp3Path;
        const finalJsonFolder = path.resolve('./public/json', bookTitle);
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

export async function processMp3Url(mp3Url: string, baseUrl: string) {
    console.log('Processing request...');
    const fileName = mp3Url.split('/').pop()?.split('.')[0];
    if (!fileName) {
        throw new Error('Invalid mp3Url');
    }
    const pathToFile = resolve(process.cwd(), './public/audio', `${fileName}.mp3`);
    const finalJsonFolder = path.resolve('./public/json', fileName);

    const result = {
        mp3Url: `${baseUrl}/audio/${fileName}.mp3`,
        jsonUrl: `${baseUrl}/json/${fileName}/${fileName}.json`
    };

    // Start the download and processing in the background
    downloadFile(mp3Url, pathToFile)
        .then(() => processDownloadedFile(pathToFile, finalJsonFolder))
        .catch(error => console.error(`Error during download: ${error}`));

    return result;
}

export async function processDownloadedFile(pathToFile: string, finalJsonFolder: string) {
    if (!fs.existsSync(finalJsonFolder)) {
        fs.mkdirSync(finalJsonFolder);
    }

    return processFile(pathToFile, finalJsonFolder);
    
} 