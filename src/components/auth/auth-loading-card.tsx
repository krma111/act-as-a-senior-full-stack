import { LoaderCircle } from "lucide-react";

export function AuthLoadingCard() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="card-surface flex w-full max-w-md flex-col items-center gap-4 rounded-[28px] p-8 text-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-brand" />
        <div>
          <p className="text-lg font-semibold text-white">Loading secure session</p>
          <p className="mt-2 text-sm text-slate-400">Checking your authentication state.</p>
        </div>
      </div>
    </main>
  );
}
