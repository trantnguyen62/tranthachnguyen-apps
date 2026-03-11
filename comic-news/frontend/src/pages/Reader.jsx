import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  X, 
  Maximize2, 
  Minimize2,
  Home,
  ChevronUp
} from 'lucide-react';

function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  
  const [comic, setComic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [hintVisible, setHintVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const [errorImages, setErrorImages] = useState({});
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const fetchComic = async () => {
      try {
        const comicRes = await fetch(`/api/comics/${id}`);
        if (!comicRes.ok) return;
        const comicData = await comicRes.json();
        setComic(comicData);
        document.title = `Reading: ${comicData.title} - Comic News`;

        // Canonical points to comic detail to avoid duplicate content
        document.getElementById('canonical-link')?.remove();
        const canonical = document.createElement('link');
        canonical.id = 'canonical-link';
        canonical.rel = 'canonical';
        canonical.href = `${window.location.origin}/comic/${id}`;
        document.head.appendChild(canonical);

        // Noindex reader view - it's a UX page, not a content page
        document.getElementById('meta-robots-reader')?.remove();
        const robotsMeta = document.createElement('meta');
        robotsMeta.id = 'meta-robots-reader';
        robotsMeta.name = 'robots';
        robotsMeta.content = 'noindex, follow';
        document.head.appendChild(robotsMeta);
      } catch (error) {
        console.error('Error fetching comic:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComic();
    return () => {
      document.getElementById('canonical-link')?.remove();
      document.getElementById('meta-robots-reader')?.remove();
    };
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyPress = async (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          try {
            await document.exitFullscreen();
          } catch (error) {
            console.error('exitFullscreen failed:', error);
          }
        } else {
          navigate(`/comic/${id}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, navigate, id]);

  useEffect(() => {
    let rafId = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (scrollContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
          const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
          setScrollProgress(progress || 0);
          setShowScrollTop(scrollTop > 500);
        }
      });
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleScroll);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, [comic]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen request failed:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageLoad = (index) => {
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

  const handleImageError = (index) => {
    setErrorImages(prev => ({ ...prev, [index]: true }));
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" role="status" aria-label="Loading comic">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <Home className="w-16 h-16 text-gray-700 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white mb-2">Comic not found</h2>
          <p className="text-gray-500 mb-6">This story doesn't exist or may have been removed.</p>
          <Link to="/library" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Progress Bar - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-800" role="progressbar" aria-label="Reading progress" aria-valuenow={Math.round(scrollProgress)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full bg-red-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Controls */}
      <div
        className={`fixed top-1 left-0 right-0 z-40 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!showControls}
        inert={!showControls ? '' : undefined}
      >
        <div className="bg-gradient-to-b from-black/90 to-transparent p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/comic/${id}`}
                aria-label="Close reader"
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </Link>
              <div>
                <h1 className="text-white font-semibold truncate max-w-xs md:max-w-md">
                  {comic.title}
                </h1>
                <p className="text-gray-400 text-sm">
                  {comic.pages.length} panels • {Math.round(scrollProgress)}% read
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" aria-hidden="true" /> : <Maximize2 className="w-5 h-5" aria-hidden="true" />}
              </button>
              <Link
                to="/"
                aria-label="Go to home"
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <Home className="w-5 h-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tap hint - fades out after 3 seconds */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-opacity duration-700 ${hintVisible ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-xs text-gray-500 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
          Tap to toggle controls
        </span>
      </div>

      {/* Visually-hidden button so keyboard users can toggle controls */}
      <button
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-1/2 focus:-translate-x-1/2 focus:z-50 focus:px-4 focus:py-2 focus:bg-black/80 focus:text-white focus:rounded-lg focus:text-sm"
        onClick={() => setShowControls(c => !c)}
        aria-pressed={showControls}
      >
        {showControls ? 'Hide controls' : 'Show controls'}
      </button>

      {/* Seamless Scrolling Comic Panels */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onClick={() => setShowControls(!showControls)}
      >
        <div className="max-w-2xl mx-auto pt-16 pb-8">
          {/* All panels stacked vertically with no gaps */}
          <div className="flex flex-col">
            {comic.pages.map((page, index) => (
              <div key={page.id} className="relative">
                {!loadedImages[index] && (
                  <div className="flex items-center justify-center bg-gray-900 min-h-[200px]" aria-hidden="true">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                {errorImages[index] ? (
                  <div className="flex flex-col items-center justify-center bg-gray-900 min-h-[200px] text-gray-600 py-12">
                    <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Panel {index + 1} unavailable</span>
                  </div>
                ) : (
                  <img
                    src={page.image}
                    alt={page.caption || `Panel ${index + 1}`}
                    className={`w-full transition-opacity duration-300 ${
                      loadedImages[index] ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                    loading={index < 3 ? "eager" : "lazy"}
                    decoding={index === 0 ? "sync" : "async"}
                    fetchPriority={index === 0 ? "high" : index < 3 ? "auto" : "low"}
                  />
                )}
              </div>
            ))}
          </div>

          {/* End of comic indicator */}
          <div className="text-center py-12 border-t border-gray-800 mt-4">
            <p className="text-gray-500 mb-4">End of comic</p>
            <Link
              to={`/comic/${id}`}
              className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              Back to Details
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        aria-hidden={!showScrollTop}
        tabIndex={showScrollTop ? 0 : -1}
        className={`fixed bottom-6 right-6 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg z-50 transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ChevronUp className="w-6 h-6" aria-hidden="true" />
      </button>
    </div>
  );
}

export default Reader;
