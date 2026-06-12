export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 h-9 w-full max-w-72 animate-pulse rounded-lg bg-white/10" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/10" />
        <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/10" />
      </div>
      <div className="mt-8 h-80 animate-pulse rounded-lg border border-white/10 bg-white/10" />
    </main>
  );
}
