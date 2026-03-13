import { useState, useEffect } from 'react';
import { Bookmark, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import ComicCard from '../components/ComicCard';

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Bookmarks - Comic News';
    document.getElementById('canonical-link')?.remove();
    const canonical = Object.assign(document.createElement('link'), {
      id: 'canonical-link', rel: 'canonical', href: `${window.location.origin}/bookmarks`,
    });
    document.head.appendChild(canonical);
    return () => { canonical.remove(); };
  }, []);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await fetch('/api/bookmarks');
        if (!res.ok) return;
        const data = await res.json();
        setBookmarks(data);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading bookmarks">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bookmark className="w-8 h-8 text-red-500" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-white">My Bookmarks</h1>
        </div>
        <p className="text-gray-400">Your saved stories, ready when you are</p>
      </div>

      {/* Content */}
      {bookmarks.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-dark-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-gray-500" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No bookmarks yet</h2>
          <p className="text-gray-400 mb-6">Open any story and hit the bookmark icon to save it here.</p>
          <Link
            to="/library"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
          >
            Browse Library
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {bookmarks.map((comic) => (
            <ComicCard key={comic.id} comic={comic} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Bookmarks;
