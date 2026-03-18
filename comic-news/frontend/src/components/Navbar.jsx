import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Home, Library, Bookmark, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  // showSearch toggles the inline search field in the top bar
  const [showSearch, setShowSearch] = useState(false);
  // scrolled adds a drop-shadow once the page scrolls past the navbar height
  const [scrolled, setScrolled] = useState(false);

  // Passive listener avoids blocking the main thread during scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Returns true when the given path exactly matches the current route;
  // used to set aria-current="page" and apply the active highlight style.
  const isActive = (path) => location.pathname === path;

  // Submits the search by navigating to /library with a ?search= query param,
  // which Library.jsx reads to pre-populate and run the filter.
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/library?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  return (
    <nav aria-label="Main navigation" className={`fixed top-0 left-0 right-0 z-50 glass-effect transition-shadow duration-200 ${scrolled ? 'shadow-lg shadow-black/40' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" aria-label="ComicNews home">
            <BookOpen className="w-8 h-8 text-red-500" aria-hidden="true" />
            <span className="text-xl font-bold gradient-text">ComicNews</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              aria-current={isActive('/') ? 'page' : undefined}
              className={`flex items-center gap-2 transition-colors relative pb-1 ${
                isActive('/') ? 'text-red-500' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>Home</span>
              {isActive('/') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
            </Link>
            <Link
              to="/library"
              aria-current={isActive('/library') ? 'page' : undefined}
              className={`flex items-center gap-2 transition-colors relative pb-1 ${
                isActive('/library') ? 'text-red-500' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Library className="w-4 h-4" aria-hidden="true" />
              <span>Library</span>
              {isActive('/library') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
            </Link>
            <Link
              to="/bookmarks"
              aria-current={isActive('/bookmarks') ? 'page' : undefined}
              className={`flex items-center gap-2 transition-colors relative pb-1 ${
                isActive('/bookmarks') ? 'text-red-500' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4" aria-hidden="true" />
              <span>Bookmarks</span>
              {isActive('/bookmarks') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {showSearch ? (
              <form onSubmit={handleSearch} role="search" className="search-form relative flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Search stories..."
                  aria-label="Search comics"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 md:w-64 px-4 py-2 bg-dark-200 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-dark-100 transition-colors"
                  autoFocus
                  onBlur={(e) => {
                    // Only close if focus leaves the whole search form, not when tabbing to the X button
                    const form = e.currentTarget.closest('form');
                    if (!searchQuery && !form?.contains(e.relatedTarget)) setShowSearch(false);
                  }}
                />
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                  aria-label="Close search"
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                aria-label="Open search"
                className="p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <Search className="w-5 h-5" aria-hidden="true" />
              </button>
            )}

            <div className="flex md:hidden items-center gap-1 ml-1">
              <Link to="/" aria-label="Home" aria-current={isActive('/') ? 'page' : undefined} className={`p-2.5 rounded-lg transition-colors ${isActive('/') ? 'text-red-500 bg-red-500/10' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                <Home className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link to="/library" aria-label="Library" aria-current={isActive('/library') ? 'page' : undefined} className={`p-2.5 rounded-lg transition-colors ${isActive('/library') ? 'text-red-500 bg-red-500/10' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                <Library className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link to="/bookmarks" aria-label="Bookmarks" aria-current={isActive('/bookmarks') ? 'page' : undefined} className={`p-2.5 rounded-lg transition-colors ${isActive('/bookmarks') ? 'text-red-500 bg-red-500/10' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                <Bookmark className="w-5 h-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
