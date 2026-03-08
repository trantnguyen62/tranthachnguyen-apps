function SkeletonCard() {
  return (
    <div className="block" aria-hidden="true">
      <div className="rounded-xl bg-dark-200 border border-white/5 overflow-hidden">
        <div className="aspect-[2/3] bg-dark-100 animate-pulse" />
      </div>
      <div className="mt-3 px-1 space-y-2">
        <div className="h-4 bg-dark-100 rounded animate-pulse w-4/5" />
        <div className="h-3 bg-dark-100 rounded animate-pulse w-3/5" />
        <div className="flex gap-3 mt-2">
          <div className="h-3 bg-dark-100 rounded animate-pulse w-10" />
          <div className="h-3 bg-dark-100 rounded animate-pulse w-12" />
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
