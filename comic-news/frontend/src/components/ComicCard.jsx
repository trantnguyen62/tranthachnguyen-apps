import { Link } from 'react-router-dom';
import { Star, BookOpen } from 'lucide-react';

function ComicCard({ comic }) {
  return (
    <Link to={`/comic/${comic.id}`} className="comic-card group block cursor-pointer">
      <div className="relative overflow-hidden rounded-xl bg-dark-200 border border-white/5 hover:border-red-500/30">
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={comic.coverImage}
            alt={comic.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-sm text-gray-300 line-clamp-2">{comic.description}</p>
          </div>
        </div>
        <div className="absolute top-2 right-2 pointer-events-none">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            comic.status === 'Ongoing' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-blue-500/20 text-blue-400'
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
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm text-gray-300">{comic.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm">{comic.chapters} ch</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ComicCard;
