import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Bible API endpoint
export const bibleApi = onRequest({
  memory: '256MiB',
  timeoutSeconds: 30,
  maxInstances: 10,
}, async (req, res) => {
  const API_KEY = process.env.BIBLE_API_KEY;
  const BASE_URL = 'https://api.scripture.api.bible/v1';
  
  try {
    // Get the endpoint from the URL
    const endpoint = req.query.endpoint as string;
    
    // Add CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (!endpoint) {
      res.status(400).json({ error: 'Missing endpoint parameter' });
      return;
    }

    if (!API_KEY) {
      console.error('API key missing in environment');
      res.status(500).json({ error: 'Bible API key not configured on server' });
      return;
    }

    // Check cache first
    const cacheRef = admin.firestore().collection('bible_cache').doc(endpoint);
    const cacheDoc = await cacheRef.get();
    
    if (cacheDoc.exists) {
      const cacheData = cacheDoc.data();
      const cacheAge = Date.now() - cacheData!.timestamp;
      
      // Use cache if it's less than 24 hours old
      if (cacheAge < 24 * 60 * 60 * 1000) {
        console.log('Serving from cache:', endpoint);
        res.json(cacheData!.data);
        return;
      }
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
        res.status(403).json({ 
          error: 'Invalid or missing API key', 
          details: errorDetails 
        });
        return;
      }

      res.status(response.status).json({ 
        error: `API request failed with status ${response.status}`, 
        details: errorDetails 
      });
      return;
    }

    const data = await response.json();
    
    // Cache the successful response
    await cacheRef.set({
      data,
      timestamp: Date.now()
    });

    res.json(data);
  } catch (error) {
    console.error('Error in Bible API function:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}); 