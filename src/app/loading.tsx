export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <div className="aspect-[4/3] animate-pulse bg-white/[0.07]" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.08]" />
              <div className="h-5 w-4/5 animate-pulse rounded bg-white/[0.08]" />
              <div className="h-4 w-full animate-pulse rounded bg-white/[0.08]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
