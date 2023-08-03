# Book to text

This project is a simple API that interacts with Audible to download and transcribe audiobooks. It can also accept an MP3 URL, download the MP3 file, and transcribe it. Additionally, it can process RSS feeds to find and download MP3 files based on a search phrase.

## Prerequisites

Before you begin, ensure you have the following installed:

- [FFmpeg](https://ffmpeg.org/): This is used for audio conversion. Make sure to add it to your system's PATH.
- [whisperx](https://github.com/m-bain/whisperX): This is used for transcribing audio files. Make sure the `whisperx` command is available in your system's PATH.




## Setup

1. Clone the repository.
2. Install the dependencies with `npm install`.
3. Copy the `tmp.env.local` file to `.env.local` and fill in the following environment variables:
    - `EMAIL`: Your Audible email.
    - `PASSWORD`: Your Audible password.
    - `ACTIVATION_BYTES`: Your Audible activation bytes. If you have activation bytes, put them in `.env.local`. If you don't have activation bytes, use the `bytes` API to automatically update the `.env.local` file when it finishes.
4. Run the server with `npm run dev`.

## Usage

To obtain the activation bytes for your Audible account, send a POST request to /api/bytes with the bookTitle parameter.

To download and transcribe a book from Audible, send a POST request to `/api/btt` with the `bookTitle` parameter.

To download and transcribe an MP3 file, send a POST request to `/api/btt` with the `mp3Url` parameter.

To process an RSS feed and download an MP3 file based on a search phrase, send a POST request to `/api/processRss` with the `rssUrl` and `searchPhrase` parameters.

## Dependencies

- This project uses code from [inAudible-NG/tables](https://github.com/inAudible-NG/tables) to get the `ACTIVATION_BYTES` for Audible.