import { processMp3Url } from '../../utils/utils';
import Parser from 'rss-parser';
import path, { resolve } from 'path';
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) { 
    if (req.method === 'GET') {
        let searchPhrase = req.query.searchPhrase as string | undefined;
        const rssUrl = req.query.rssUrl as string | undefined;
        const mp3Url = req.query.mp3Url as string | undefined;

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'];
        const baseUrl = `${protocol}://${host}`;

        if (mp3Url) {
            
            try {
                const result = await processMp3Url(mp3Url, baseUrl, true);
                res.status(200).json(result);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        } else if (rssUrl && searchPhrase) {
    
    if (!isNaN(Number(searchPhrase))) {
        searchPhrase = '#' + searchPhrase;
    }

    const parser = new Parser();
    const feed = await parser.parseURL(rssUrl);

    const items = feed.items.filter(item => (" " + item.title + " ").includes(" " + searchPhrase + " "));

    if (items.length > 0) {
        if (items.length === 1) {
            const mp3Url = items[0].enclosure ? items[0].enclosure.url : null;
            if (mp3Url) {
                try {
                    const result = await processMp3Url(mp3Url, baseUrl, true);
                    res.status(200).json(result);
                } catch (error) {
                    res.status(400).json({ error: error.message });
                }
            } else {
                res.status(404).json({ error: 'No MP3 URL found for the matching item' });
            }
        } else {
            const results = items.map(item => {
                const mp3Url = item.enclosure ? item.enclosure.url : null;
                const title = item.title;
                return { title, mp3Url };
            });
            res.status(200).json(results);
        }
    } else {
        res.status(404).json({ error: 'No matching items found in the RSS feed' });
    }
} else {
    res.status(400).json({ error: 'Either mp3Url or both rssUrl and searchPhrase must be provided' });
}
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}