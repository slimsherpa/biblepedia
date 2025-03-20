import { NextRequest, NextResponse } from 'next/server';

// Configure route handler to be dynamic
export const dynamic = 'force-dynamic';

const API_KEY = process.env.BIBLE_API_KEY || process.env.NEXT_PUBLIC_BIBLE_API_KEY;
const BASE_URL = 'https://api.scripture.api.bible/v1';

// Helper to get CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, api-key',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { 
    status: 204,
    headers: getCorsHeaders()
  });
}

export async function GET(request: NextRequest) {
  try {
    const headers = getCorsHeaders();
    const path = request.nextUrl.searchParams.get('path');
    
    if (!API_KEY) {
      console.error('Missing API key. Environment:', {
        BIBLE_API_KEY: !!process.env.BIBLE_API_KEY,
        NEXT_PUBLIC_BIBLE_API_KEY: !!process.env.NEXT_PUBLIC_BIBLE_API_KEY,
        NODE_ENV: process.env.NODE_ENV
      });
      return NextResponse.json(
        { error: 'Bible API key not configured' },
        { status: 500, headers }
      );
    }

    if (!path) {
      console.error('Missing path parameter');
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400, headers }
      );
    }

    console.log('Making request to Bible API:', {
      url: `${BASE_URL}/${path}`,
      hasApiKey: !!API_KEY
    });

    const response = await fetch(`${BASE_URL}/${path}`, {
      headers: {
        'api-key': API_KEY,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Bible data' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
} 