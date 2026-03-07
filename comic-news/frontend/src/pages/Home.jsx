import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Sparkles, ArrowRight, BookOpen, Bookmark, Monitor } from 'lucide-react';
import ComicCard from '../components/ComicCard';

function Home() {
  const [featured, setFeatured] = useState([]);
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Comic News - Daily News Turned Into Comics';
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, comicsRes] = await Promise.all([
          fetch('/api/featured'),
          fetch('/api/comics?sort=rating')
        ]);
        const featuredData = await featuredRes.json();
        const comicsData = await comicsRes.json();
        setFeatured(featuredData);
        setComics(comicsData.slice(0, 8));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-dark-300 to-dark-300"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
              <span className="gradient-text">Daily News</span>
              <br />
              <span className="text-white">Turned Into Comics</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Experience the news like never before. We transform trending stories 
              into engaging visual comics you'll actually want to read.
            </p>
            <Link
              to="/library"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-orange-600 transition-all shadow-lg shadow-red-500/25 hover:scale-105 active:scale-95"
            >
              Explore Stories
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">Featured Stories</h2>
          </div>
          <Link to="/library" className="text-red-500 hover:text-red-400 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {featured.map((comic) => (
            <ComicCard key={comic.id} comic={comic} />
          ))}
        </div>
      </section>

      {/* Popular Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-white">Trending Stories</h2>
          </div>
          <Link to="/library" className="text-red-500 hover:text-red-400 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {comics.map((comic) => (
            <ComicCard key={comic.id} comic={comic} />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Daily Updates</h3>
            <p className="text-gray-400">Fresh news stories transformed into comics every single day.</p>
          </div>
          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-7 h-7 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Bookmarks</h3>
            <p className="text-gray-400">Save your favorites and continue reading where you left off.</p>
          </div>
          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-7 h-7 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Visual Storytelling</h3>
            <p className="text-gray-400">Complex news made simple through engaging comic illustrations.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
