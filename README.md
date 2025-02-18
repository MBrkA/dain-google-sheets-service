# Google Sheets DAIN Service

A DAIN service that provides tools for interacting with Google Sheets. The service includes OAuth2 authentication with Google and tools for creating and retrieving spreadsheets.

## Features

- OAuth2 authentication with Google
- Create new Google Spreadsheets
- Retrieve existing spreadsheets by ID

## Tools

### Create Spreadsheet
Creates a new Google Spreadsheet with a specified title.

### Get Spreadsheet
Retrieves details of an existing Google Spreadsheet using its ID.

## Environment Variables

The following environment variables are required:

- \`DAIN_API_KEY\`: Your DAIN API key
- \`TUNNEL_URL\`: The tunnel URL for OAuth callbacks (defaults to http://localhost:2022)
- \`GOOGLE_CLIENT_ID\`: Your Google OAuth client ID
- \`GOOGLE_CLIENT_SECRET\`: Your Google OAuth client secret

## Setup

1. Create a Google Cloud project and enable the Google Sheets API
2. Create OAuth 2.0 credentials
3. Set up the required environment variables
4. Install dependencies with \`npm install\`
5. Start the service with \`npm start\`

## Usage

The service runs on port 2022 and provides two main tools:

1. Create Spreadsheet:
   - Input: title (string)
   - Output: Spreadsheet details including ID and URL

2. Get Spreadsheet:
   - Input: spreadsheetId (string)
   - Output: Detailed spreadsheet information

Both tools require Google OAuth authentication before use.
