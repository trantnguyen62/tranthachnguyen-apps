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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const fetchComic = async () => {
      try {
        const comicRes = await fetch(`/api/comics/${id}`);
        const comicData = await comicRes.json();
        setComic(comicData);
      } catch (error) {
        console.error('Error fetching comic:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComic();
  }, [id]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen();
        } else {
          navigate(`/comic/${id}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, navigate, id]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setScrollProgress(progress || 0);
        setShowScrollTop(scrollTop > 500);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [comic]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Comic not found</h2>
          <Link to="/library" className="text-red-500 hover:text-red-400">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Progress Bar - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-800">
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
      >
        <div className="bg-gradient-to-b from-black/90 to-transparent p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/comic/${id}`}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-white font-semibold truncate max-w-xs md:max-w-md">
                  {comic.title}
                </h1>
                <p className="text-gray-400 text-sm">
                  {comic.pages.length} panels • Scroll to read
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <Link
                to="/"
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <Home className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

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
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 min-h-[200px]">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <img
                  src={page.image}
                  alt={page.caption || `Panel ${index + 1}`}
                  className={`w-full transition-opacity duration-300 ${
                    loadedImages[index] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImageLoad(index)}
                  loading={index < 3 ? "eager" : "lazy"}
                />
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
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all z-50"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

export default Reader;
