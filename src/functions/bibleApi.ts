import { onRequest } from 'firebase-functions/v2/https';

const API_KEY = process.env.BIBLE_API_KEY;
const BASE_URL = 'https://api.scripture.api.bible/v1';

export const bibleApi = onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Get the endpoint from the URL
    const endpoint = req.query.endpoint as string;
    
    console.log('Bible API Debug:', {
      endpoint,
      apiKeyExists: !!API_KEY,
      url: `${BASE_URL}${endpoint}`,
      env: process.env.NODE_ENV
    });
    
    if (!endpoint) {
      res.status(400).json({ error: 'Missing endpoint parameter' });
      return;
    }

    if (!API_KEY) {
      console.error('API key missing in environment');
      res.status(500).json({ error: 'Bible API key not configured on server' });
      return;
    }

    // Make the request to the Bible API
    const url = `${BASE_URL}${endpoint}`;
    console.log('Making request to:', url);
    
    const response = await fetch(url, {
      headers: {
        'api-key': API_KEY,
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