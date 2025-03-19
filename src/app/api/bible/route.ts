import { NextRequest, NextResponse } from 'next/server';

// Configure route handler to be dynamic
export const dynamic = 'force-dynamic';

const API_KEY = process.env.BIBLE_API_KEY;
const BASE_URL = 'https://api.scripture.api.bible/v1';

export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path');
    
    if (!API_KEY) {
      console.error('Missing API key');
      return NextResponse.json(
        { error: 'Bible API key not configured' },
        { status: 500 }
      );
    }

    if (!path) {
      console.error('Missing path parameter');
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    console.log('Making request to Bible API:', {
      url: `${BASE_URL}${path}`,
      hasApiKey: !!API_KEY
    });

    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'api-key': API_KEY,
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    const responseText = await response.text();
    console.log('Bible API raw response:', responseText);

    if (!response.ok) {
      console.error('Bible API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      return NextResponse.json(
        { error: `Bible API error: ${response.statusText}`, details: responseText },
        { status: response.status }
      );
    }

    try {
      const data = JSON.parse(responseText);
      console.log('Bible API parsed response:', data);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse Bible API response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from Bible API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Bible data' },
      { status: 500 }
    );
  }
} 