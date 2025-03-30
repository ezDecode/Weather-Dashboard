import { SearchIcon, XIcon } from "@heroicons/react/outline";
import { useState, useRef, useEffect } from "react";

const SearchBar = ({
  onSearch,
  darkMode = false,
  searchHistory = [],
  onRemoveFromHistory,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef(null);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm);
      setShowHistory(false);
    }
  };

  const handleHistoryClick = (city) => {
    onSearch(city);
    setSearchTerm(city);
    setShowHistory(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div ref={searchRef} className="relative">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowHistory(true)}
            placeholder="Search Location"
            className={`w-64 ${
              darkMode
                ? "bg-slate-800 text-white placeholder-slate-400 selection:bg-blue-500 selection:text-white"
                : "bg-slate-100 text-slate-700 placeholder-slate-500 selection:bg-blue-200"
            } rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-300 shadow-sm transition-all text-sm`}
            autoComplete="off"
          />
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <SearchIcon
              className={`h-4 w-4 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            />
          </div>
        </form>

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div
            className={`absolute top-full left-0 right-0 mt-1 ${
              darkMode ? "bg-slate-800" : "bg-white"
            } rounded-xl shadow-lg overflow-hidden z-50`}
          >
            {searchHistory.map((city, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(city)}
                className={`w-full text-left px-4 py-2 ${
                  darkMode
                    ? "hover:bg-slate-700 text-slate-200"
                    : "hover:bg-slate-50 text-slate-700"
                } text-sm transition-colors flex items-center space-x-2`}
              >
                <SearchIcon
                  className={`h-4 w-4 ${
                    darkMode ? "text-slate-400" : "text-slate-400"
                  }`}
                />
                <span>{city}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent Searches Capsules */}
      <div className="flex gap-2">
        {searchHistory.slice(0, 3).map((city, index) => (
          <div
            key={index}
            className={`flex items-center px-3 py-1 rounded-full text-sm ${
              darkMode
                ? "bg-slate-800 text-white"
                : "bg-slate-200 text-slate-700"
            } cursor-pointer hover:bg-opacity-80`}
          >
            <span
              onClick={() => handleHistoryClick(city)}
              className="cursor-pointer"
            >
              {city}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromHistory(city);
              }}
              className="ml-2 hover:text-red-500"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
