"use client";

export default function AdminPacksError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="card-surface rounded-[28px] p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
        <h1 className="mt-3 text-2xl font-black text-white">Prompt packs could not load</h1>
        <p className="mt-3 text-sm text-slate-400">{error.message || "A database error occurred while loading packs."}</p>
        <button className="btn-primary mt-6" onClick={reset}>Try again</button>
      </section>
    </main>
  );
}
