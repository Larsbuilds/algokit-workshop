# AlgoKit Workshop

This is a TypeScript project for Algorand development using AlgoKit. The application is deployed on Algorand Testnet and includes functionality to store GitHub handles in box storage.

## Deployed Application

- **Application ID**: 738489531
- **Network**: Algorand Testnet
- **GitHub Handle**: Larsbuilds

## Features

- Application creation and deployment to Testnet
- GitHub handle storage in box storage
- Deposit functionality
- Box operations for storing and retrieving GitHub handle

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Algorand Node (for local development)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the application:
```bash
npm start
```

## Development

For development with watch mode:
```bash
npm run dev
```

## Project Structure

- `src/` - Source code directory
  - `teal/` - TEAL programs
    - `approval.teal` - Main application logic
    - `clear.teal` - Clear state program
  - `index.ts` - Main application code
- `dist/` - Compiled JavaScript output
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies and scripts
- `workshop-submission.txt` - Contains the Application ID for workshop submission

## Notes

- The application is deployed on Algorand Testnet
- GitHub handle is stored in a box named "github"
- The application supports deposit functionality
- Box operations are used to store and retrieve the GitHub handle

## About

This project was created as part of the AlgoKit workshop to demonstrate Algorand smart contract development and box storage operations 