import dynamic from 'next/dynamic';

// Import the client-side only component
const BibleExplorer = dynamic(() => import('./components/BibleExplorer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function Home() {
  return (
    <main className="min-h-screen">
      <BibleExplorer />
    </main>
  );
}
