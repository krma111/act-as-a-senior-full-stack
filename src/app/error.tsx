"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

function isTimeoutError(error: Error) {
  const msg = error.message ?? "";
  return msg.includes("timed out") || msg.includes("Timeout") || msg.includes("ETIMEDOUT") || msg.includes("timeout") || msg.includes("529");
}

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleRetry = useCallback(() => {
    setRetrying(true);
    reset();
  }, [reset]);

  useEffect(() => {
    console.error("[app-error]", error);
    if (isTimeoutError(error)) {
      setCountdown(3);
      const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
      const r = setTimeout(() => { setRetrying(true); reset(); }, 3000);
      return () => { clearInterval(t); clearTimeout(r); };
    }
  }, [error, reset]);

  if (retrying) {
    return (
      <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="card-surface w-full min-w-0 rounded-[32px] p-6 text-center sm:p-10">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">Retrying...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="card-surface w-full min-w-0 rounded-[32px] p-6 text-center sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">PromptVault recovered</p>
        <h1 className="mt-3 text-3xl font-black text-white">This page hit a temporary error.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {isTimeoutError(error) ? "The server took too long to respond. Retrying automatically..." : "The app stayed online. Try reloading the page, or return to the website."}
        </p>
        {error.digest ? <p className="mt-3 text-xs text-slate-500">Error ID: {error.digest}</p> : null}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          {isTimeoutError(error) ? (
            <button className="btn-primary w-full sm:w-auto" onClick={handleRetry} disabled={countdown > 0}>
              {countdown > 0 ? `Retrying in ${countdown}s...` : "Retry now"}
            </button>
          ) : (
            <button className="btn-primary w-full sm:w-auto" onClick={handleRetry}>Try again</button>
          )}
          <Link href="/" className="btn-ghost w-full sm:w-auto">Back to Website</Link>
        </div>
      </section>
    </main>
  );
}
