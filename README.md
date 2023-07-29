# Book to text

This project is a simple API that interacts with Audible to download and transcribe audiobooks. It can also accept an MP3 URL, download the MP3 file, and transcribe it.

 Prerequisites

Before you begin, ensure you have the following installed:

- [FFmpeg](https://ffmpeg.org/): This is used for audio conversion. Make sure to add it to your system's PATH.
- [whisperx](https://github.com/m-bain/whisperX): This is used for transcribing audio files. Make sure the `whisperx` command is available in your system's PATH.


- [inAudible-NG/tables](https://github.com/inAudible-NG/tables): This is used to get the `ACTIVATION_BYTES` for Audible.

## Endpoints

### POST /api/btt

This endpoint accepts either a book title or an MP3 URL.

#### Request Body

- `bookTitle`: The title of the book to download and transcribe from Audible.
- `mp3Url`: The URL of an MP3 file to download and transcribe.

You must provide either `bookTitle` or `mp3Url`, but not both.

#### Response

The response is a JSON object with the following properties:

- `mp3Url`: The URL of the downloaded or converted MP3 file.
- `jsonUrl`: The URL of the JSON file containing the transcription of the MP3 file.

## Setup

1. Clone the repository.
2. Install the dependencies with `npm install`.
3. Copy the `tmp.env.local` file to `.env.local` and fill in the following environment variables:
   - `EMAIL`: Your Audible email.
   - `PASSWORD`: Your Audible password.
   - `ACTIVATION_BYTES`: Your Audible activation bytes.
4. Run the server with `npm run dev`.

## Usage

To download and transcribe a book from Audible, send a POST request to `/api/btt` with the `bookTitle` parameter.

To download and transcribe an MP3 file, send a POST request to `/api/btt` with the `mp3Url` parameter.

## Dependencies

This project uses the following main dependencies:

- [Puppeteer](https://pptr.dev/): For automating browser actions.
- [Axios](https://axios-http.com/): For making HTTP requests.
