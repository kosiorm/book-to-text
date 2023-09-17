import { downloadBook } from '../../utils/utils';
import fs from 'fs';
import path, { resolve } from 'path';
import type { NextApiRequest, NextApiResponse } from 'next'
import { exec } from 'child_process';
import os from 'os'
import axios from 'axios';

const email = process.env.EMAIL;
const password = process.env.PASSWORD;

async function updateEnvironmentVariable(variableName, newValue) {
    const apiKey = process.env.RUNPOD_API_KEY;
    const podId = process.env.RUNPOD_POD_ID;
  
    if (!apiKey || !podId) {
      console.error('RUNPOD_API_KEY or RUNPOD_POD_ID is not set');
      return;
    }
  
    const response = await axios.patch(
      `https://api.runpod.io/v1/pods/${podId}`,
      {
        env: [
          {
            key: variableName,
            value: newValue,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
      }
    );
  
    if (response.status === 200) {
      console.log('Environment variable updated successfully');
    } else {
      console.error('Failed to update environment variable');
    }
  }


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
      command = `WINEPREFIX=~/.wine64 WINEARCH=win64 wine ${rcrackPath} . -h ${key}`; // set WINEPREFIX and WINEARCH
    }
  
    return new Promise(async (resolve, reject) => {
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        const match = stdout.match(/hex:(\w+)/);
        const key = match ? match[1] : null;
  
        if (key) {
          // Update the environment variable on RunPod if RUNPOD_API_KEY and RUNPOD_POD_ID are set
          if (process.env.RUNPOD_API_KEY ) {
            await updateEnvironmentVariable('ACTIVATION_BYTES', key);
          }
      
          // Update the .env.local file if it exists
          const envFilePath = path.resolve(process.cwd(), '.env.local');
          if (fs.existsSync(envFilePath)) {
            let envFileContent = fs.readFileSync(envFilePath, 'utf8');
            envFileContent = envFileContent.replace(/(ACTIVATION_BYTES=).*/, `$1${key}`);
            fs.writeFileSync(envFilePath, envFileContent);
          }
        }
      
        resolve(key);
      });
    });
  }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const bookTitle = req.query.bookTitle as string | undefined;

        if (!email || !password || !bookTitle) {
            res.status(500).json({ error: 'Required parameters are not set' });
            return;
        }

        const fileName = bookTitle.replace(/ /g, '_');
        const aarPath = resolve(process.cwd(), './public/aar', `${fileName}.aax`);

        try {
            const { browser, page } = await downloadBook(email, password, bookTitle, aarPath, async () => {
                const key = await runFfprobe(aarPath);
                if (key) {
                    await runRcrack(key as string);
                    await browser.close();
                    res.write('Extracting activation bytes complete');
                    res.end();
                } else {
                    res.status(500).json({ error: 'Key extraction failed' });
                    return;
                }
            });
            res.send('Success'); 
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}