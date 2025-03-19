import { onRequest } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';

// Define the API key parameter
const bibleApiKey = defineString('api.bible.key');

const BASE_URL = 'https://api.scripture.api.bible/v1';
const KJV_BIBLE_ID = 'de4e12af7f28f599-01';

export const bibleApi = onRequest({
  cors: [
    'https://biblepediaio.web.app',
    'https://biblepediaio.firebaseapp.com',
    'http://localhost:3000'
  ],
  maxInstances: 10,
  secrets: [bibleApiKey]
}, async (req, res) => {
  try {
    // Get the path from the URL
    const path = req.query.path as string;
    
    console.log('Bible API Debug:', {
      path,
      apiKeyExists: !!bibleApiKey.value(),
      env: process.env.NODE_ENV,
      origin: req.headers.origin
    });
    
    if (!bibleApiKey.value()) {
      console.error('API key missing in environment');
      res.status(500).json({ error: 'Bible API key not configured on server' });
      return;
    }

    if (!path) {
      console.error('Missing path parameter');
      res.status(400).json({ error: 'Path parameter is required' });
      return;
    }

    // Construct the full endpoint URL
    const url = `${BASE_URL}${path}`;
    
    console.log('Making request to:', url);
    
    const response = await fetch(url, {
      headers: {
        'api-key': bibleApiKey.value(),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Bible API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: url
      });
      
      // Try to get error details
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
      } catch (e) {
        errorDetails = await response.text();
      }
      console.error('Error details:', errorDetails);

      // Special handling for common errors
      if (response.status === 403) {
        res.status(403).json({ error: 'Invalid or missing API key', details: errorDetails });
        return;
      }

      res.status(response.status).json({ 
        error: `API request failed with status ${response.status}`, 
        details: errorDetails 
      });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error in Bible API route:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}); 