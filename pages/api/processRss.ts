import { processFile } from '../../utils/utils';
import Parser from 'rss-parser';
import axios from 'axios';
import fs from 'fs';
import path, { resolve } from 'path';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const searchPhrase = req.body.searchPhrase;
        const rssUrl = req.body.rssUrl; // Get the RSS feed URL from the request

        const parser = new Parser();
        const feed = await parser.parseURL(rssUrl);

        const item = feed.items.find(item => item.title.includes(searchPhrase));

        if (item && item.enclosure && item.enclosure.url) {
            const mp3Url = item.enclosure.url;
            const fileName = mp3Url.split('/').pop().split('.')[0];
            const pathToFile = resolve(process.cwd(), './public/audio', `${fileName}.mp3`);
            const finalJsonFolder = path.resolve('./public/json', fileName);

            const response = await axios.get(mp3Url, { responseType: 'stream' });
            const writer = fs.createWriteStream(pathToFile);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            if (!fs.existsSync(finalJsonFolder)) {
                fs.mkdirSync(finalJsonFolder);
            }
            await processFile(pathToFile, finalJsonFolder);

            res.status(200).json({ message: 'Processing completed' });
        } else {
            res.status(404).json({ error: 'No matching item found in the RSS feed' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}