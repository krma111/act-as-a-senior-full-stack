export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="card-surface overflow-hidden rounded-[28px]">
            <div className="skeleton-shimmer aspect-[4/3]" />
            <div className="space-y-3 p-4">
              <div className="skeleton-shimmer h-3 w-24 rounded" />
              <div className="skeleton-shimmer h-5 w-4/5 rounded" />
              <div className="skeleton-shimmer h-4 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
