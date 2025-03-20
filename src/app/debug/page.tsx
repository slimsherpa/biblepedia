'use client';

import { useState } from 'react';
import { fetchBibleVersions, fetchBooks, fetchChapters, fetchVerses, fetchVerse } from '@/lib/api/bibleApi';
import { BIBLE_VERSIONS } from '@/lib/api/bibleApi';

export default function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">API Debugger</h1>
      
      <div className="space-y-8">
        {/* Environment Info */}
        <section className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
          <pre className="bg-white p-4 rounded overflow-auto">
            {JSON.stringify({
              NODE_ENV: process.env.NODE_ENV,
              hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
              protocol: typeof window !== 'undefined' ? window.location.protocol : 'server',
              baseUrl: typeof window !== 'undefined' ? 
                (window.location.hostname.includes('web.app') || 
                 window.location.hostname.includes('firebaseapp.com') ||
                 window.location.hostname === 'biblepedia.io')
                  ? 'https://bibleapi-d3bzjj5vnq-uc.a.run.app'
                  : '/api/bible'
                : 'server'
            }, null, 2)}
          </pre>
        </section>

        {/* API Test Section */}
        <section className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">API Test</h2>
          <div className="space-y-4">
            {BIBLE_VERSIONS.map((version) => (
              <div key={version.id} className="border p-4 rounded bg-white">
                <h3 className="font-medium mb-2">{version.name} ({version.abbreviation})</h3>
                <div className="space-y-2">
                  <TestEndpoint 
                    name="Get Books" 
                    endpoint={`bibles/${version.id}/books`} 
                  />
                  <TestEndpoint 
                    name="Get Genesis Chapters" 
                    endpoint={`bibles/${version.id}/books/GEN/chapters`} 
                  />
                  <TestEndpoint 
                    name="Get Genesis 1 Verses" 
                    endpoint={`bibles/${version.id}/chapters/GEN.1/verses`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Response Log */}
        <section className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Response Log</h2>
          <div id="responseLog" className="bg-white p-4 rounded h-96 overflow-auto font-mono text-sm">
          </div>
        </section>
      </div>
    </div>
  );
}

function TestEndpoint({ name, endpoint }: { name: string; endpoint: string }) {
  async function testEndpoint() {
    const logElement = document.getElementById('responseLog');
    if (!logElement) return;

    try {
      // Log the request
      logElement.innerHTML = `Testing ${endpoint}...\n` + logElement.innerHTML;

      // Determine base URL
      const baseUrl = typeof window !== 'undefined' && 
        (window.location.hostname.includes('web.app') || 
         window.location.hostname.includes('firebaseapp.com') ||
         window.location.hostname === 'biblepedia.io')
          ? 'https://bibleapi-d3bzjj5vnq-uc.a.run.app'
          : '/api/bible';

      // Make the request
      const response = await fetch(`${baseUrl}/${endpoint}`);
      const responseText = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = responseText;
      }

      // Log the response
      logElement.innerHTML = `${new Date().toISOString()} - ${name}\n` +
        `URL: ${baseUrl}/${endpoint}\n` +
        `Status: ${response.status}\n` +
        `Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}\n` +
        `Response: ${JSON.stringify(data, null, 2)}\n\n` +
        '-------------------\n\n' +
        logElement.innerHTML;
    } catch (error) {
      // Log any errors
      logElement.innerHTML = `${new Date().toISOString()} - ERROR - ${name}\n` +
        `URL: ${endpoint}\n` +
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
        '-------------------\n\n' +
        logElement.innerHTML;
    }
  }

  return (
    <button
      onClick={testEndpoint}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
    >
      {name}
    </button>
  );
} 