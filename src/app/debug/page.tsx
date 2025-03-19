import dynamic from 'next/dynamic';

const DebugPage = dynamic(() => import('./DebugPage'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-700">Loading debug page...</p>
      </div>
    </div>
  ),
});

export default function Page() {
  return <DebugPage />;
}
