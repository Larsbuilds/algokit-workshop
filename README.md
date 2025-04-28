# AlgoKit Workshop

This is a TypeScript project for Algorand development using AlgoKit.

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
- `dist/` - Compiled JavaScript output
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies and scripts

## Notes

- Make sure you have an Algorand node running locally for development
- The default configuration assumes a local node running on port 4001
- Update the `algodToken`, `algodServer`, and `algodPort` in `src/index.ts` if your setup differs 