export default function Header() {
  return (
    <header className="bg-blue-700">
      <div className="flex justify-between items-center">
        <div className="biblepedia-logo">
          <h1>biblepedia</h1>
          <span>SCHOLARLY WIKI</span>
        </div>
        
        <div className="pr-4">
          <select className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>New Revised Standard Version (en)</option>
          </select>
        </div>
      </div>
    </header>
  );
} 