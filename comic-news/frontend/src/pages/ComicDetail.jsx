import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, BookOpen, User, Tag, Bookmark, BookmarkCheck, Play, ArrowLeft, FileText, Image } from 'lucide-react';
import { setMeta } from '../utils/meta';

function ComicDetail() {
  const { id } = useParams();
  const [comic, setComic] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [comicRes, bookmarkRes, progressRes] = await Promise.all([
          fetch(`/api/comics/${id}`),
          fetch(`/api/bookmarks/check/${id}`),
          fetch(`/api/progress/${id}`)
        ]);

        if (!comicRes.ok) return;

        const comicData = await comicRes.json();
        const bookmarkData = bookmarkRes.ok ? await bookmarkRes.json() : {};
        const progressData = progressRes.ok ? await progressRes.json() : {};

        setComic(comicData);
        setIsBookmarked(bookmarkData.isBookmarked || false);
        setProgress(progressData.page || 1);

        const pageTitle = `${comicData.title} - Comic News`;
        document.title = pageTitle;

        // Update OG/Twitter meta tags
        const canonicalHref = `${window.location.origin}/comic/${id}`;
        const imgUrl = `${window.location.origin}${comicData.coverImage}`;
        setMeta('meta[name="description"]', comicData.description);
        setMeta('meta[property="og:title"]', pageTitle);
        setMeta('meta[property="og:description"]', comicData.description);
        setMeta('meta[property="og:image"]', imgUrl);
        setMeta('meta[property="og:type"]', 'article');
        setMeta('meta[property="og:url"]', canonicalHref);
        setMeta('meta[name="twitter:title"]', pageTitle);
        setMeta('meta[name="twitter:description"]', comicData.description);
        setMeta('meta[name="twitter:image"]', imgUrl);
        setMeta('meta[property="og:image:alt"]', comicData.title);

        // Keywords meta
        document.getElementById('meta-keywords')?.remove();
        const kwMeta = document.createElement('meta');
        kwMeta.id = 'meta-keywords';
        kwMeta.name = 'keywords';
        kwMeta.content = [comicData.genre, 'comic news', 'news comic', comicData.author].filter(Boolean).join(', ');
        document.head.appendChild(kwMeta);

        // Canonical link
        document.getElementById('canonical-link')?.remove();
        const canonical = document.createElement('link');
        canonical.id = 'canonical-link';
        canonical.rel = 'canonical';
        canonical.href = canonicalHref;
        document.head.appendChild(canonical);

        // JSON-LD structured data
        document.getElementById('page-jsonld')?.remove();
        const ld = document.createElement('script');
        ld.id = 'page-jsonld';
        ld.type = 'application/ld+json';
        const today = new Date().toISOString().split('T')[0];
        ld.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalHref },
          headline: comicData.title,
          description: comicData.description,
          author: { '@type': 'Person', name: comicData.author },
          publisher: { '@type': 'Organization', name: 'Comic News', url: window.location.origin },
          image: imgUrl,
          genre: comicData.genre,
          inLanguage: 'en-US',
          url: canonicalHref,
          datePublished: today,
          dateModified: today,
          aggregateRating: comicData.rating ? {
            '@type': 'AggregateRating',
            ratingValue: comicData.rating,
            bestRating: 5,
            worstRating: 1,
            ratingCount: Math.round(comicData.rating * (comicData.chapters || 1) * 15),
          } : undefined,
        });
        document.head.appendChild(ld);

        // BreadcrumbList structured data
        document.getElementById('page-breadcrumb-jsonld')?.remove();
        const ldBreadcrumb = document.createElement('script');
        ldBreadcrumb.id = 'page-breadcrumb-jsonld';
        ldBreadcrumb.type = 'application/ld+json';
        ldBreadcrumb.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: window.location.origin },
            { '@type': 'ListItem', position: 2, name: 'Library', item: `${window.location.origin}/library` },
            { '@type': 'ListItem', position: 3, name: comicData.title, item: `${window.location.origin}/comic/${id}` },
          ],
        });
        document.head.appendChild(ldBreadcrumb);
      } catch (error) {
        console.error('Error fetching comic:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      document.getElementById('page-jsonld')?.remove();
      document.getElementById('page-breadcrumb-jsonld')?.remove();
      document.getElementById('canonical-link')?.remove();
      document.getElementById('meta-keywords')?.remove();
    };
  }, [id]);

  const toggleBookmark = async () => {
    try {
      const method = isBookmarked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/bookmarks/${id}`, { method });
      if (res.ok) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading comic">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white mb-2">Comic not found</h2>
          <p className="text-gray-400 mb-6">This story doesn't exist or may have been removed.</p>
          <Link to="/library" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Background */}
      <div className="relative h-80 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={comic.coverImage?.startsWith('/images/') ? { backgroundImage: `url(${comic.coverImage})` } : {}}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-dark-300/80 to-dark-300/40" />
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 relative z-10">
        <Link to="/library" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Library
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover Image */}
          <div className="flex-shrink-0">
            <img
              src={comic.coverImage}
              alt={comic.title}
              className="w-64 h-96 object-cover rounded-xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <span aria-label={`Status: ${comic.status}`} className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-3 ${
                  comic.status === 'Ongoing'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {comic.status}
                </span>
                <h1 className="text-4xl font-bold text-white mb-2">{comic.title}</h1>
              </div>
            </div>

            <dl className="flex flex-wrap items-center gap-6 mt-4 text-gray-300">
              <div className="flex items-center gap-2">
                <dt className="sr-only">Author</dt>
                <User className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <dd>{comic.author}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="sr-only">Genre</dt>
                <Tag className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <dd>{comic.genre}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="sr-only">Rating</dt>
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" aria-hidden="true" />
                <dd>{comic.rating}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="sr-only">Chapters</dt>
                <BookOpen className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <dd>{comic.chapters} Chapters</dd>
              </div>
            </dl>

            <p className="text-gray-400 mt-6 text-lg leading-relaxed">
              {comic.description}
            </p>

            {/* Progress */}
            {progress > 1 && (
              <div className="mt-6 p-4 glass-effect rounded-xl">
                <p className="text-sm text-gray-400">Continue reading from page {progress}</p>
                <div
                  className="mt-2 h-2 bg-dark-200 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-label="Reading progress"
                  aria-valuenow={Math.round((progress / comic.pages.length) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                    style={{ width: comic.pages.length > 0 ? `${(progress / comic.pages.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                to={`/read/${comic.id}`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-orange-600 transition-all shadow-lg shadow-red-500/25"
              >
                <Play className="w-5 h-5" aria-hidden="true" />
                {progress > 1 ? 'Continue Reading' : 'Start Reading'}
              </Link>
              <button
                onClick={toggleBookmark}
                aria-pressed={isBookmarked}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                className={`inline-flex items-center gap-2 px-6 py-4 rounded-xl font-medium transition-all ${
                  isBookmarked
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'glass-effect text-gray-300 hover:text-white'
                }`}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="w-5 h-5" aria-hidden="true" />
                    Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="w-5 h-5" aria-hidden="true" />
                    Add Bookmark
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Both Text and Comic Versions for stories with text version */}
        {comic.hasTextVersion && (
          <div className="mt-12 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Comic Version - First - Seamless Scrolling */}
              <div className="glass-effect rounded-2xl p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Image className="w-6 h-6 text-red-500" aria-hidden="true" />
                  Comic Version
                </h2>
                {/* Seamless vertical scroll container */}
                <div className="max-h-[70vh] overflow-y-auto rounded-xl scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-dark-200" aria-label="Comic panels">
                  <div className="flex flex-col">
                    {comic.pages.map((page, index) => (
                      <img
                        key={page.id}
                        src={page.image}
                        alt={page.caption || `Panel ${index + 1}`}
                        className="w-full"
                        loading={index < 3 ? "eager" : "lazy"}
                      />
                    ))}
                  </div>
                </div>
                {comic.pages.length > 1 && (
                  <p className="text-gray-500 text-sm text-center mt-4">
                    Scroll to read all {comic.pages.length} panels
                  </p>
                )}
              </div>

              {/* The Story - Second */}
              <div className="glass-effect rounded-2xl p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-red-500" aria-hidden="true" />
                  The Story
                </h2>
                <div className="prose prose-invert max-w-none">
                  {comic.textStory.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-300 text-base leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                {/* Panel descriptions */}
                {comic.panels && comic.panels.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Panel Breakdown</h3>
                    <div className="relative">
                    <ul className="grid gap-3 max-h-64 overflow-y-auto pb-6" aria-label="Panel breakdown">
                      {comic.panels.map((panel) => (
                        <li key={panel.id} className="flex gap-3 p-3 bg-dark-200 rounded-lg">
                          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-red-400 font-bold text-sm">{panel.id}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-sm">{panel.title}</h4>
                            <p className="text-gray-400 text-xs mt-1">{panel.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {comic.panels.length > 3 && (
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white/5 to-transparent pointer-events-none rounded-b-lg" aria-hidden="true" />
                    )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Preview for comics without text version */}
        {!comic.hasTextVersion && (
          <div className="mt-16 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Image className="w-6 h-6 text-red-500" aria-hidden="true" />
              Preview Pages
            </h2>
            
            {comic.pages.length === 1 ? (
              <div className="max-w-4xl">
                <img
                  src={comic.pages[0].image}
                  alt={comic.title}
                  className="w-full rounded-xl shadow-2xl border border-white/10"
                />
                {comic.pages[0].caption && (
                  <p className="text-gray-400 text-center mt-4">{comic.pages[0].caption}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {comic.pages.slice(0, 6).map((page, index) => (
                  <Link
                    key={page.id}
                    to={`/read/${comic.id}?page=${index + 1}`}
                    aria-label={`Read page ${index + 1}`}
                    className="aspect-[2/3] rounded-lg overflow-hidden bg-dark-200 hover:ring-2 hover:ring-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-all"
                  >
                    <img
                      src={page.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ComicDetail;
