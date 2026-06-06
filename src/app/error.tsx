"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="card-surface rounded-[32px] p-8 text-center sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">PromptVault recovered</p>
        <h1 className="mt-3 text-3xl font-black text-white">This page hit a temporary error.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The app stayed online. Try reloading the page, or return to the website.
        </p>
        {error.digest ? <p className="mt-3 text-xs text-slate-500">Error ID: {error.digest}</p> : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="btn-primary" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn-ghost">
            Back to Website
          </Link>
        </div>
      </section>
    </main>
  );
}
