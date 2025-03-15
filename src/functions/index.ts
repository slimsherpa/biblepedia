import { onRequest } from 'firebase-functions/v2/https';
import { NextServer } from 'next/dist/server/next';
import * as path from 'path';
import type { Request, Response } from 'firebase-functions';

const nextServer = new NextServer({
  dev: false,
  dir: path.join(process.cwd(), '.next'),
  conf: {
    env: process.env,
    experimental: {},
  },
});

const handler = nextServer.getRequestHandler();

export const nextjs = onRequest(
  {
    memory: '1GiB',
    region: 'us-central1',
  },
  async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('Error handling request:', err);
      res.status(500).send('Internal Server Error');
    }
  }
); 