import Link from "next/link";
import { signUp } from "@/lib/actions";

export default async function Signup({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <form action={signUp} className="panel w-full space-y-5 rounded-lg p-6">
        <div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-slate-400">Join PromptHub and publish your image prompt recipes.</p>
        </div>
        {params.message && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{params.message}</p>}
        <label className="block space-y-2">
          <span className="label">Display name</span>
          <input className="field" name="display_name" required />
        </label>
        <label className="block space-y-2">
          <span className="label">Email</span>
          <input className="field" name="email" type="email" required />
        </label>
        <label className="block space-y-2">
          <span className="label">Password</span>
          <input className="field" name="password" type="password" required minLength={8} />
        </label>
        <button className="btn-primary w-full">Sign up</button>
        <p className="text-center text-sm text-slate-400">
          Already have an account? <Link className="text-brand" href="/auth/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
