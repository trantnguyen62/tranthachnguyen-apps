import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, SortAsc, SearchX } from 'lucide-react';
import ComicCard from '../components/ComicCard';
import SkeletonCard from '../components/SkeletonCard';
import { setMeta } from '../utils/meta';

// Module-level cache: genres are static, so we fetch once per page load
// and skip the network request if the Library component remounts (e.g. nav back).
let cachedGenres = null;

function Library() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [comics, setComics] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [loading, setLoading] = useState(true);

  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const title = 'Story Library - Comic News';
    const description = selectedGenre !== 'All'
      ? `Browse ${selectedGenre} comics on Comic News. Discover news stories and real-life moments transformed into visual comics.`
      : 'Browse all news stories transformed into comics. Filter by genre, sort by rating, and discover visual storytelling at its best.';
    const url = `${window.location.origin}/library`;

    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);

    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[property="og:type"]', 'website');
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);

    document.getElementById('canonical-link')?.remove();
    const canonical = Object.assign(document.createElement('link'), {
      id: 'canonical-link', rel: 'canonical', href: url,
    });
    document.head.appendChild(canonical);
    return () => {
      canonical.remove();
      const origDesc = 'Experience the news like never before. Comic News transforms trending stories and daily news into engaging visual comics you\'ll actually want to read.';
      document.querySelector('meta[name="description"]')?.setAttribute('content', origDesc);
    };
  }, [selectedGenre]);

  useEffect(() => {
    if (cachedGenres) {
      setGenres(cachedGenres);
      return;
    }
    const controller = new AbortController();
    const fetchGenres = async () => {
      try {
        const res = await fetch('/api/genres', { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        cachedGenres = data;
        setGenres(data);
      } catch (error) {
        if (error.name !== 'AbortError') console.error('Error fetching genres:', error);
      }
    };
    fetchGenres();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchComics = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedGenre !== 'All') params.append('genre', selectedGenre);
        if (sortBy) params.append('sort', sortBy);
        if (searchQuery) params.append('search', searchQuery);

        const res = await fetch(`/api/comics?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        setComics(data);

        // ItemList structured data
        document.getElementById('library-jsonld')?.remove();
        const ld = document.createElement('script');
        ld.id = 'library-jsonld';
        ld.type = 'application/ld+json';
        ld.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: selectedGenre !== 'All' ? `${selectedGenre} Comics - Comic News` : 'Story Library - Comic News',
          url: `${window.location.origin}/library`,
          description: selectedGenre !== 'All'
            ? `Browse ${selectedGenre} comics on Comic News.`
            : 'Browse all news stories transformed into comics.',
          hasPart: data.slice(0, 20).map(comic => ({
            '@type': 'Article',
            name: comic.title,
            url: `${window.location.origin}/comic/${comic.id}`,
            genre: comic.genre,
            author: { '@type': 'Person', name: comic.author },
          })),
        });
        document.head.appendChild(ld);
      } catch (error) {
        if (error.name !== 'AbortError') console.error('Error fetching comics:', error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchComics();
    return () => {
      controller.abort();
      document.getElementById('library-jsonld')?.remove();
    };
  }, [selectedGenre, sortBy, searchQuery]);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {searchQuery ? `Search: "${searchQuery}"` : 'Story Library'}
        </h1>
        <p className="text-gray-400" aria-live="polite" aria-atomic="true">
          {loading
            ? 'Loading stories…'
            : searchQuery
              ? `Found ${comics.length} ${comics.length === 1 ? 'story' : 'stories'} matching your search`
              : `${comics.length} ${comics.length === 1 ? 'story' : 'stories'} available`
          }
        </p>
      </div>

      {/* Filters */}
      <div className="glass-effect rounded-xl p-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" aria-hidden="true" />
            <span className="text-gray-400 text-sm">Category:</span>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by genre">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                aria-pressed={selectedGenre === genre}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedGenre === genre
                    ? 'bg-red-500 text-white shadow-sm shadow-red-500/30'
                    : 'bg-dark-200/60 text-gray-200 border border-white/10 hover:bg-dark-100 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="md:ml-auto flex items-center gap-2">
            <SortAsc className="w-5 h-5 text-gray-400" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort stories"
              className="bg-dark-200 text-gray-300 px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-red-500"
            >
              <option value="rating">Top Rated</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comics Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6" role="status" aria-label="Loading stories">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : comics.length === 0 ? (
        <div className="text-center py-20">
          <SearchX className="w-12 h-12 text-gray-600 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-400 text-lg">No stories found</p>
          <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
          {(selectedGenre !== 'All' || searchQuery) && (
            <button
              onClick={() => { setSelectedGenre('All'); navigate('/library'); }}
              className="mt-6 px-6 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {comics.map((comic, i) => (
            <ComicCard key={comic.id} comic={comic} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Library;
