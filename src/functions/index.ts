import { onRequest } from 'firebase-functions/v2/https';
import { NextServer } from 'next/dist/server/next';
import * as path from 'path';

const nextServer = new NextServer({
  dev: false,
  dir: path.join(process.cwd(), '.next'),
  conf: {
    experimental: {}
  }
});

const handler = nextServer.getRequestHandler();

export const nextjs = onRequest(async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).send('Internal Server Error');
  }
});

export { bibleApi } from './bibleApi'; 