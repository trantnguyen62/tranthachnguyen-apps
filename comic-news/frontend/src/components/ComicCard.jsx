import { Link } from 'react-router-dom';
import { Star, BookOpen } from 'lucide-react';
import { useState, memo } from 'react';

/**
 * Card thumbnail for a single comic. Handles three image states:
 *  - loading: animated skeleton pulse shown until the image resolves
 *  - error:   fallback placeholder with a "No image" label
 *  - loaded:  fades the image in and enables hover effects
 *
 * Wrapped in React.memo so the parent grid doesn't re-render unchanged cards.
 *
 * @param {{ comic: object }} props
 */
function ComicCard({ comic, index = 0 }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <Link to={`/comic/${comic.id}`} title={comic.title} aria-label={`${comic.title} — ${comic.genre} by ${comic.author}`} style={{ animationDelay: `${Math.min(index, 9) * 45}ms` }} className="comic-card group block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11111b]">
      <div className="relative overflow-hidden rounded-xl bg-dark-200 border border-white/5 hover:border-red-500/30">
        <div className="aspect-[2/3] overflow-hidden relative">
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-dark-100 animate-pulse" aria-hidden="true" />
          )}
          {imgError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-200 text-gray-600">
              <BookOpen className="w-8 h-8 mb-2 opacity-40" aria-hidden="true" />
              <span className="text-xs">No image</span>
            </div>
          ) : (
            <img
              src={comic.coverImage}
              alt={comic.title}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
              loading={index < 4 ? 'eager' : 'lazy'}
              decoding={index === 0 ? 'sync' : 'async'}
              fetchPriority={index === 0 ? 'high' : index < 4 ? 'auto' : 'low'}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-red-500/90 text-white text-xs font-semibold rounded-full translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              Read Now
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-sm text-gray-300 line-clamp-2">{comic.description}</p>
          </div>
        </div>
        <div className="absolute top-2 right-2 pointer-events-none">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            comic.status === 'Ongoing'
              ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
              : 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
          }`}>
            {comic.status}
          </span>
        </div>
      </div>
      <div className="mt-3 px-1">
        <h3 className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">
          {comic.title}
        </h3>
        <p className="text-sm text-gray-400 truncate">{comic.author}</p>
        {comic.genre && (
          <span className="inline-block mt-1 px-2 py-0.5 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-full truncate max-w-full">
            {comic.genre}
          </span>
        )}
        <div className="flex items-center gap-2 mt-2 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" aria-hidden="true" />
            <span className="text-gray-300 font-medium" aria-label={`Rating: ${comic.rating}`}>{comic.rating}</span>
          </div>
          <span className="text-gray-600" aria-hidden="true">·</span>
          <div className="flex items-center gap-1 text-gray-400">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span aria-label={`${comic.chapters} chapters`}>{comic.chapters} ch</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default memo(ComicCard);
