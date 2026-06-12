import Link from "next/link";
import { MotionDiv, MotionMain } from "@/frontend/components/motion-primitives";

export function AuthShell({
  eyebrow,
  title,
  description,
  footer,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <MotionMain className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-20">
      <div className="hero-grid opacity-50" />
      <div className="hero-scan opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      <div className="mx-auto grid max-w-6xl min-w-0 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
            {eyebrow}
          </div>
          <h1 className="mt-6 max-w-xl text-5xl font-black tracking-tight text-white">{title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">{description}</p>
          <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
            <div className="panel rounded-2xl p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Secure</p>
              <p className="mt-3 text-sm text-slate-300">Supabase-managed sessions, provider auth, and recovery flows.</p>
            </div>
            <div className="panel rounded-2xl p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Production-ready</p>
              <p className="mt-3 text-sm text-slate-300">Clean redirects, verified-email support, and protected dashboard access.</p>
            </div>
          </div>
          <p className="mt-8 text-sm text-slate-500">
            Back to{" "}
            <Link href="/" className="text-brand transition hover:text-brand/80">
              PromptVault
            </Link>
          </p>
        </section>

        <section className="mx-auto w-full max-w-lg min-w-0">
          <MotionDiv className="card-surface min-w-0 rounded-[32px] p-5 sm:p-8" delay={0.08}>
            <div className="mb-8 lg:hidden">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">{eyebrow}</p>
              <h1 className="hero-title mt-3 text-3xl font-black">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
            </div>
            {children}
            {footer ? <div className="mt-6 border-t border-white/10 pt-5 text-sm text-slate-400">{footer}</div> : null}
          </MotionDiv>
        </section>
      </div>
    </MotionMain>
  );
}
