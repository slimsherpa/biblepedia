import dynamic from 'next/dynamic';

// Use dynamic import with no SSR for the BibleExplorer component
// This is necessary because it uses browser APIs and client-side state
const BibleExplorer = dynamic(() => import('./components/BibleExplorer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading Bible Explorer...</div>
});

// Use dynamic import for the ErrorBoundary component
const ErrorBoundary = dynamic(() => import('./components/ErrorBoundary'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen">
      <ErrorBoundary>
        <BibleExplorer />
      </ErrorBoundary>
    </main>
  );
}
