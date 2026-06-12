"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="mx-auto grid min-h-screen max-w-3xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
          <section className="card-surface w-full min-w-0 rounded-[32px] p-6 text-center sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">PromptVault recovered</p>
            <h1 className="mt-3 text-3xl font-black text-white">The website hit a temporary error.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Refresh the page. If it happens again, the app will show this safe recovery screen instead of a blank crash.
            </p>
            {error.digest ? <p className="mt-3 text-xs text-slate-500">Error ID: {error.digest}</p> : null}
            <button className="btn-primary mt-6 w-full sm:w-auto" onClick={reset}>
              Reload
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
