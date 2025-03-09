export default function Header() {
  return (
    <header className="bg-blue-700">
      <div className="flex justify-between items-center">
        <div className="biblepedia-logo">
          <h1>biblepedia.io</h1>
          <span>SCHOLARLY WIKI</span>
        </div>
        
        <div className="pr-4">
          <span className="text-white text-sm font-medium">
            New Revised Standard Version
          </span>
        </div>
      </div>
    </header>
  );
} 