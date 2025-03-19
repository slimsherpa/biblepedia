const { onRequest } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const cors = require('cors')({ origin: true });
const fetch = require('node-fetch');
const functions = require('firebase-functions');

// Get the API key from environment variables
const apiKey = defineString('API_BIBLE_KEY');

// Bible API configuration
const BIBLE_API_URL = 'https://api.scripture.api.bible/v1';
const BIBLE_API_KEY = process.env.BIBLE_API_KEY;

exports.nextServer = onRequest((req, res) => {
  res.redirect('https://biblepediaio.web.app');
});

// Helper function to make Bible API requests
async function makeBibleApiRequest(path) {
  try {
    const response = await fetch(`${BIBLE_API_URL}/${path}`, {
      headers: {
        'api-key': BIBLE_API_KEY,
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
      responsePreview: responseText.substring(0, 200), // First 200 chars
      path
    });

    if (!response.ok) {
      // Try to parse error response as JSON
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch (e) {
        // If parsing fails, use the raw text
        errorDetails = responseText;
      }

      console.error('Bible API Error:', {
        status: response.status,
        statusText: response.statusText,
        path,
        errorDetails
      });

      throw new Error(
        `Bible API request failed: ${response.status} ${response.statusText}\n${
          typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)
        }`
      );
    }

    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Bible API response as JSON:', {
        error: e,
        responseText: responseText.substring(0, 1000), // Log first 1000 chars
        contentType: response.headers.get('content-type')
      });
      throw new Error('Invalid JSON response from Bible API');
    }

    return data;
  } catch (error) {
    console.error('Error making Bible API request:', {
      path,
      error: error.message
    });
    throw error;
  }
}

// Bible API endpoint
exports.bibleApi = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Extract the path from the request URL
      const path = req.path.substring(1); // Remove leading slash
      
      if (!path) {
        throw new Error('No path provided');
      }

      // Make the request to the Bible API
      const data = await makeBibleApiRequest(path);
      
      // Return the response
      res.json(data);
    } catch (error) {
      console.error('Bible API Function Error:', error);
      
      // Determine if this is a known error type
      const isApiError = error.message.includes('Bible API request failed');
      const status = isApiError ? 400 : 500;
      
      res.status(status).json({
        error: {
          message: error.message,
          status
        }
      });
    }
  });
}); 