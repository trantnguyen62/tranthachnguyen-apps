import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SortAsc } from 'lucide-react';
import ComicCard from '../components/ComicCard';

function Library() {
  const [searchParams] = useSearchParams();
  const [comics, setComics] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [loading, setLoading] = useState(true);

  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch('/api/genres');
        const data = await res.json();
        setGenres(data);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchComics = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedGenre !== 'All') params.append('genre', selectedGenre);
        if (sortBy) params.append('sort', sortBy);
        if (searchQuery) params.append('search', searchQuery);

        const res = await fetch(`/api/comics?${params.toString()}`);
        const data = await res.json();
        setComics(data);
      } catch (error) {
        console.error('Error fetching comics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComics();
  }, [selectedGenre, sortBy, searchQuery]);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {searchQuery ? `Search: "${searchQuery}"` : 'Story Library'}
        </h1>
        <p className="text-gray-400">
          {searchQuery 
            ? `Found ${comics.length} stories matching your search`
            : 'Browse all news stories turned into comics'
          }
        </p>
      </div>

      {/* Filters */}
      <div className="glass-effect rounded-xl p-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 text-sm">Category:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedGenre === genre
                    ? 'bg-red-500 text-white'
                    : 'bg-dark-200 text-gray-300 hover:bg-dark-100'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
          
          <div className="md:ml-auto flex items-center gap-2">
            <SortAsc className="w-5 h-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : comics.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No stories found</p>
          <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {comics.map((comic) => (
            <ComicCard key={comic.id} comic={comic} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Library;
