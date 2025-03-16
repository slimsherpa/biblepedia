import { NextRequest, NextResponse } from 'next/server';

// Configure route handler to be dynamic
export const dynamic = 'force-dynamic';

const API_KEY = process.env.BIBLE_API_KEY;
const BASE_URL = 'https://api.scripture.api.bible/v1';

export async function GET(request: NextRequest) {
  try {
    // Get the endpoint from the URL
    const endpoint = request.nextUrl.searchParams.get('endpoint');
    
    console.log('Bible API Debug:', {
      endpoint,
      apiKeyExists: !!API_KEY,
      url: `${BASE_URL}${endpoint}`,
      env: process.env.NODE_ENV
    });
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      console.error('API key missing in environment');
      return NextResponse.json(
        { error: 'Bible API key not configured on server' },
        { status: 500 }
      );
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
        return NextResponse.json(
          { error: 'Invalid or missing API key', details: errorDetails },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `API request failed with status ${response.status}`, details: errorDetails },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Bible API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 