import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, SortAsc, SearchX, X } from 'lucide-react';
import ComicCard from '../components/ComicCard';
import SkeletonCard from '../components/SkeletonCard';
import { setMeta, injectHeadElement, injectJsonLd } from '../utils/meta';

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
  const genreScrollRef = useRef(null);
  const activeGenreRef = useRef(null);

  useEffect(() => {
    const title = 'Story Library - Comic News';
    const description = selectedGenre !== 'All'
      ? `Browse ${selectedGenre} comics on Comic News. Discover news stories and real-life moments transformed into visual comics.`
      : 'Browse all stories transformed into comics. Filter by genre, sort by rating, and discover visual storytelling at its best.';
    const url = `${window.location.origin}/library`;

    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);

    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[property="og:type"]', 'website');
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);

    const canonical = injectHeadElement('link', { id: 'canonical-link', rel: 'canonical', href: url });

    // Noindex search result pages to avoid thin/duplicate content indexing
    document.getElementById('meta-robots-library')?.remove();
    if (searchQuery) {
      injectHeadElement('meta', { id: 'meta-robots-library', name: 'robots', content: 'noindex, follow' });
    }

    return () => {
      canonical.remove();
      document.getElementById('meta-robots-library')?.remove();
      const origDesc = 'Real stories turned into comics. Comic News transforms awkward moments, real-life slip-ups, and everyday events into visual comics you\'ll actually want to read.';
      document.querySelector('meta[name="description"]')?.setAttribute('content', origDesc);
    };
  }, [selectedGenre, searchQuery]);

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
        injectJsonLd('library-jsonld', {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: selectedGenre !== 'All' ? `${selectedGenre} Comics - Comic News` : 'Story Library - Comic News',
          url: `${window.location.origin}/library`,
          description: selectedGenre !== 'All'
            ? `Browse ${selectedGenre} comics on Comic News.`
            : 'Browse all stories transformed into comics.',
          hasPart: data.slice(0, 20).map(comic => ({
            '@type': 'Article',
            name: comic.title,
            url: `${window.location.origin}/comic/${comic.id}`,
            genre: comic.genre,
            author: { '@type': 'Person', name: comic.author },
          })),
        });
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

  // Scroll active genre button into view on mobile when selection changes
  useEffect(() => {
    if (activeGenreRef.current && genreScrollRef.current) {
      activeGenreRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedGenre]);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          {searchQuery ? (
            <>
              <span>Search: &ldquo;{searchQuery}&rdquo;</span>
              <button
                onClick={() => navigate('/library')}
                aria-label="Clear search"
                className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </>
          ) : 'Story Library'}
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
            <span className="text-gray-400 text-sm">Genre:</span>
          </div>
          <div className="relative flex-1 min-w-0">
            <div ref={genreScrollRef} className="flex gap-2 overflow-x-auto pb-1 flex-nowrap md:flex-wrap md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" role="group" aria-label="Filter by genre">
              {genres.map((genre) => (
                <button
                  key={genre}
                  ref={selectedGenre === genre ? activeGenreRef : null}
                  onClick={() => setSelectedGenre(genre)}
                  aria-pressed={selectedGenre === genre}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedGenre === genre
                      ? 'bg-red-500 text-white shadow-sm shadow-red-500/30'
                      : 'bg-dark-200/60 text-gray-200 border border-white/10 hover:bg-dark-100 hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            {/* Fade hint to indicate more genres on mobile */}
            <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-dark-200 to-transparent pointer-events-none md:hidden" aria-hidden="true" />
          </div>

          <div className="md:ml-auto flex items-center gap-2">
            <SortAsc className="w-5 h-5 text-gray-400" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort stories"
              className="bg-dark-200 text-gray-300 px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="rating">Top Rated</option>
              <option value="title">A–Z</option>
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
