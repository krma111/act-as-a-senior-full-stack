export default function PromptLoading() {
  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <div className="aspect-[4/3] animate-pulse rounded-lg border border-white/10 bg-white/10" />
      <section className="space-y-5">
        <div className="h-8 w-3/4 animate-pulse rounded bg-white/10" />
        <div className="h-11 w-64 animate-pulse rounded-lg bg-white/10" />
        <div className="h-40 animate-pulse rounded-lg bg-white/10" />
        <div className="h-28 animate-pulse rounded-lg bg-white/10" />
      </section>
    </main>
  );
}
