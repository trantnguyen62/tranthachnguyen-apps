import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Sparkles, ArrowRight, BookOpen, Bookmark, Monitor } from 'lucide-react';
import ComicCard from '../components/ComicCard';
import SkeletonCard from '../components/SkeletonCard';

function Home() {
  const [featured, setFeatured] = useState([]);
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Comic News - Daily News Turned Into Comics';

    // Canonical link
    document.getElementById('canonical-link')?.remove();
    const canonical = Object.assign(document.createElement('link'), {
      id: 'canonical-link', rel: 'canonical', href: `${window.location.origin}/`,
    });
    document.head.appendChild(canonical);

    // WebSite structured data
    document.getElementById('page-jsonld')?.remove();
    const ld = document.createElement('script');
    ld.id = 'page-jsonld';
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Comic News',
      url: `${window.location.origin}/`,
      description: 'Experience the news like never before. Comic News transforms trending stories and daily news into engaging visual comics you\'ll actually want to read.',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${window.location.origin}/library?search={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    });
    document.head.appendChild(ld);

    return () => {
      canonical.remove();
      document.getElementById('page-jsonld')?.remove();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, comicsRes] = await Promise.all([
          fetch('/api/featured'),
          fetch('/api/comics?sort=rating')
        ]);
        if (!featuredRes.ok || !comicsRes.ok) return;
        const featuredData = await featuredRes.json();
        const comicsData = await comicsRes.json();
        setFeatured(featuredData);
        const topComics = comicsData.slice(0, 8);
        setComics(topComics);

        // ItemList structured data for comic collection
        document.getElementById('page-itemlist-jsonld')?.remove();
        const ldList = document.createElement('script');
        ldList.id = 'page-itemlist-jsonld';
        ldList.type = 'application/ld+json';
        ldList.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Trending Comics',
          url: `${window.location.origin}/library`,
          itemListElement: topComics.map((comic, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: comic.title,
            url: `${window.location.origin}/comic/${comic.id}`,
          })),
        });
        document.head.appendChild(ldList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => { document.getElementById('page-itemlist-jsonld')?.remove(); };
  }, []);

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
              Real news events. Real-life moments. All brought to life through comics —
              from weather alerts to everyday awkwardness, one panel at a time.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                to="/library"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-orange-600 transition-all shadow-lg shadow-red-500/40 hover:shadow-xl hover:shadow-red-500/50 hover:scale-105 active:scale-95"
              >
                Explore Stories
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/bookmarks"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
              >
                My Bookmarks
              </Link>
            </div>
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
          <Link to="/library" className="text-red-500 hover:text-red-400 flex items-center gap-1 text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : featured.map((comic) => <ComicCard key={comic.id} comic={comic} />)
          }
        </div>
      </section>

      {/* Popular Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-white">Top Rated</h2>
          </div>
          <Link to="/library" className="text-red-500 hover:text-red-400 flex items-center gap-1 text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : comics.map((comic) => <ComicCard key={comic.id} comic={comic} />)
          }
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Curated Stories</h3>
            <p className="text-gray-400">Hand-picked news stories and real-life moments transformed into comics.</p>
          </div>
          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-7 h-7 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Your Reading List</h3>
            <p className="text-gray-400">Save your favorites and pick up exactly where you left off.</p>
          </div>
          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-7 h-7 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Visual Storytelling</h3>
            <p className="text-gray-400">From breaking weather alerts to everyday mishaps — every story gets the comic treatment it deserves.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
