import { exec } from 'child_process';
import fs from 'fs';
import path, { resolve } from 'path';
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const command = 'audible activation-bytes';

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing audible-cli: ${error}`);
                res.status(500).json({ error: error.message });
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

            res.status(200).json({ activationBytes });
        });
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
