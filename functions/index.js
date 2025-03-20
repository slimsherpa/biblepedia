const { onRequest } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const fetch = require('node-fetch');

// Get the API key from environment variables
const apiKey = defineString('API_BIBLE_KEY');

exports.nextServer = onRequest((req, res) => {
  res.redirect('https://biblepediaio.web.app');
});

exports.bibleApi = onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, api-key');
  res.set('Access-Control-Max-Age', '3600');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Log the request details
    console.log('Bible API request:', {
      path: req.path,
      query: req.query,
      headers: req.headers,
      method: req.method
    });

    // Check if API key is configured
    if (!apiKey.value()) {
      console.error('Bible API key not configured');
      res.status(500).json({ error: 'Bible API key not configured on server' });
      return;
    }

    // Remove any leading/trailing slashes and ensure proper path format
    const path = req.path.replace(/^\/+/, '').replace(/\/+$/, '');
    const apiUrl = `https://api.scripture.api.bible/v1/${path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

    console.log('Forwarding request to:', apiUrl);

    // Forward the request to the Bible API
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'api-key': apiKey.value(),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Get response text first to properly handle both JSON and non-JSON responses
    const responseText = await response.text();
    
    // Log the response for debugging
    console.log('Bible API Response:', {
      status: response.status,
      contentType: response.headers.get('content-type'),
      responsePreview: responseText.substring(0, 200),
      url: apiUrl
    });

    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Bible API response:', {
        error: e.message,
        responseText: responseText.substring(0, 1000),
        url: apiUrl
      });
      res.status(500).json({ 
        error: 'Invalid JSON response from Bible API',
        details: responseText.substring(0, 1000)
      });
      return;
    }

    // Forward the response with proper status and CORS headers
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Bible API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from Bible API',
      details: error.message
    });
  }
}); 