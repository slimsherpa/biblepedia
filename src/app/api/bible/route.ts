import { NextRequest, NextResponse } from 'next/server';

// Configure route handler to be dynamic
export const dynamic = 'force-dynamic';

const API_KEY = process.env.BIBLE_API_KEY;
const BASE_URL = 'https://api.scripture.api.bible/v1';
const KJV_BIBLE_ID = 'de4e12af7f28f599-01';

export async function GET(request: NextRequest) {
  try {
    // Get the path from the URL (e.g., /books, /chapters/GEN.1, etc.)
    const path = request.nextUrl.searchParams.get('path') || '';
    
    if (!API_KEY) {
      console.error('API key missing in environment');
      return NextResponse.json(
        { error: 'Bible API key not configured on server' },
        { status: 500 }
      );
    }

    // Construct the full endpoint URL
    const endpoint = path ? `/bibles/${KJV_BIBLE_ID}/${path}` : `/bibles/${KJV_BIBLE_ID}`;
    const url = `${BASE_URL}${endpoint}`;
    
    console.log('Making request to:', url);
    
    const response = await fetch(url, {
      headers: {
        'api-key': API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Bible API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: url
      });
      
      let errorDetails = '';
      try {
        const errorData = await response.json();
        console.error('Error response body:', errorData);
        errorDetails = JSON.stringify(errorData);
      } catch (e) {
        const textResponse = await response.text();
        console.error('Error response text:', textResponse);
        errorDetails = textResponse;
      }

      return NextResponse.json(
        { error: `Bible API request failed: ${response.statusText}`, details: errorDetails },
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