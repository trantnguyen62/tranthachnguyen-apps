import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Library, Bookmark, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/library?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-red-500" />
            <span className="text-xl font-bold gradient-text">ComicNews</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`flex items-center gap-2 transition-colors ${
                isActive('/') ? 'text-red-500' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link
              to="/library"
              className={`flex items-center gap-2 transition-colors ${
                isActive('/library') ? 'text-red-500' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>Library</span>
            </Link>
            <Link
              to="/bookmarks"
              className={`flex items-center gap-2 transition-colors ${
                isActive('/bookmarks') ? 'text-red-500' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Bookmarks</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {showSearch ? (
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 md:w-64 px-4 py-2 bg-dark-200 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                  autoFocus
                  onBlur={() => !searchQuery && setShowSearch(false)}
                />
              </form>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-4">
            <Link to="/" className={isActive('/') ? 'text-red-500' : 'text-gray-300'}>
              <Home className="w-5 h-5" />
            </Link>
            <Link to="/library" className={isActive('/library') ? 'text-red-500' : 'text-gray-300'}>
              <Library className="w-5 h-5" />
            </Link>
            <Link to="/bookmarks" className={isActive('/bookmarks') ? 'text-red-500' : 'text-gray-300'}>
              <Bookmark className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
