## Setup

1. Clone the repository.
2. Run the `install.sh` script to install the necessary dependencies.
3. Copy the `tmp.env.local` file to `.env.local` and fill in the following environment variables:
    - `EMAIL`: Your Audible email.
    - `PASSWORD`: Your Audible password.
    - `ACTIVATION_BYTES`: Your Audible activation bytes. If you have activation bytes, put them in `.env.local`. If you don't have activation bytes, use the `bytes` API to automatically update the `.env.local` file when it finishes.
4. Run the server with `npm run dev`.

## Usage

To use the application, navigate to the appropriate URL in your browser. The URL will depend on the specific functionality you want to use. 

For example:

- To download and transcribe a book from Audible, navigate to `/api/btt?bookTitle=YOUR_BOOK_TITLE`.
- To download and transcribe an MP3 file, navigate to `/api/btt?mp3Url=YOUR_MP3_URL`.
- To process an RSS feed and download an MP3 file based on a search phrase, navigate to `/api/processRss?rssUrl=YOUR_RSS_URL&searchPhrase=YOUR_SEARCH_PHRASE`.

Replace `YOUR_BOOK_TITLE`, `YOUR_MP3_URL`, `YOUR_RSS_URL`, and `YOUR_SEARCH_PHRASE` with your actual values.

## Dependencies

- This project uses code from [inAudible-NG/tables](https://github.com/inAudible-NG/tables) to get the `ACTIVATION_BYTES` for Audible. The `tables` folder is a submodule of this repository. To update the submodule, run `git submodule update --remote --merge` from the root of this repository.