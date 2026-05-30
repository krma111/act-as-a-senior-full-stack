import Link from "next/link";
import { login } from "@/lib/actions";

export default async function Login({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <form action={login} className="panel w-full space-y-5 rounded-lg p-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Log in to save favorites and publish prompts.</p>
        </div>
        {params.message && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{params.message}</p>}
        <label className="block space-y-2">
          <span className="label">Email</span>
          <input className="field" name="email" type="email" required />
        </label>
        <label className="block space-y-2">
          <span className="label">Password</span>
          <input className="field" name="password" type="password" required />
        </label>
        <button className="btn-primary w-full">Log in</button>
        <p className="text-center text-sm text-slate-400">
          No account? <Link className="text-brand" href="/auth/signup">Create one</Link>
        </p>
      </form>
    </main>
  );
}
