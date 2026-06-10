export default function AdminPacksLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 h-28 animate-pulse rounded-[28px] bg-white/[0.05]" />
      <div className="grid gap-5">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-56 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
        ))}
      </div>
    </main>
  );
}
