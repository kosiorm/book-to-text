## Setup

1. Clone the repository.
2. If you are using the `runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel` image, run the `runpod.sh` script to install the necessary dependencies. Otherwise, run the `install.sh` script.
3. Create an authentication file for Audible using [audible-cli](https://github.com/mkb79/audible-cli). If you decide to password-protect this file, you will need to set the password as an environment variable:
    - Copy the `tmp.env.local` file to `.env.local` and fill in the `PASSWORD` environment variable with your authentication file password.
    - Alternatively, you can set the `PASSWORD` environment variable in your server environment or as a temporary environment variable before running the server.
4. Run the server with `npm run dev`.

## Usage

To use the application, navigate to the appropriate URL in your browser. The URL will depend on the specific functionality you want to use. 

For example:

- To download and transcribe a book from Audible, navigate to `/api/btt?bookTitle=YOUR_BOOK_TITLE`.
- To download and transcribe an MP3 file, navigate to `/api/btt?mp3Url=YOUR_MP3_URL`.
- To process an RSS feed and download an MP3 file based on a search phrase, navigate to `/api/processRss?rssUrl=YOUR_RSS_URL&searchPhrase=YOUR_SEARCH_PHRASE`.

Replace `YOUR_BOOK_TITLE`, `YOUR_MP3_URL`, `YOUR_RSS_URL`, and `YOUR_SEARCH_PHRASE` with your actual values.

## Dependencies

- This project uses [audible-cli](https://github.com/mkb79/audible-cli) to interact with Audible's API.