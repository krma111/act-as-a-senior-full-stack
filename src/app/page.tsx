import Link from "next/link";
import { ArrowRight, CheckCircle2, Code2, Lock, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { MotionDiv, MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { PromptPackCard } from "@/frontend/components/prompt-pack-card";
import { getMvpSiteSettings, getPublicPromptPacks } from "@/backend/mvp-data";

export const revalidate = 60;

export default async function Home() {
  const [settings, packs] = await Promise.all([getMvpSiteSettings(), getPublicPromptPacks({ limit: 12 })]);
  const freePacks = packs.filter((pack) => pack.is_free).slice(0, 3);
  const premiumPacks = packs.filter((pack) => !pack.is_free).slice(0, 6);
  const featured = packs.slice(0, 3);

  return (
    <MotionMain>
      <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="hero-grid" />
        <div className="hero-scan" />
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />

        <div className="mx-auto grid max-w-7xl min-w-0 gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center">
          <div className="min-w-0 text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand shadow-glow backdrop-blur-xl">
              <Code2 className="h-4 w-4" /> Built for vibe coders
            </div>
            <h1 className="hero-title mx-auto max-w-5xl text-4xl font-black tracking-tight sm:text-6xl lg:mx-0 lg:text-7xl">
              {settings.homepage_title}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl lg:mx-0">
              {settings.homepage_subtitle}
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Link href="/packs" className="btn-primary w-full px-5 py-3 sm:w-auto">
                Explore Prompt Packs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/packs?type=free" className="btn-ghost w-full px-5 py-3 sm:w-auto">
                View Free Prompts
              </Link>
            </div>

            <div className="grid-cascade mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3 lg:mx-0">
              <div className="panel rounded-2xl p-4 text-left">
                <p className="text-2xl font-black text-white">{packs.length}</p>
                <p className="mt-1 text-sm text-slate-400">approved packs</p>
              </div>
              <div className="panel rounded-2xl p-4 text-left">
                <p className="text-2xl font-black text-white">UPI</p>
                <p className="mt-1 text-sm text-slate-400">manual verification</p>
              </div>
              <div className="panel rounded-2xl p-4 text-left">
                <p className="text-2xl font-black text-white">Email</p>
                <p className="mt-1 text-sm text-slate-400">delivery after payment</p>
              </div>
            </div>
          </div>

          <MotionDiv className="hero-visual-stage relative hidden min-h-[590px] lg:block" delay={0.18}>
            {featured.length ? (
              featured.map((pack, index) => (
                <Link
                  key={pack.id}
                  href={`/packs/${pack.slug}`}
                  className={`hero-float-card card-surface absolute block overflow-hidden rounded-[32px] p-6 transition duration-500 hover:-translate-y-2 ${
                    index === 0 ? "left-0 top-4 w-[72%]" : index === 1 ? "right-0 top-28 w-[48%]" : "bottom-8 left-12 w-[56%]"
                  }`}
                >
                  <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand">
                    {pack.is_free ? "Free" : "Premium"}
                  </span>
                  <h3 className="mt-4 line-clamp-2 text-2xl font-black text-white">{pack.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{pack.preview_content[0] ?? pack.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {pack.tools_supported.slice(0, 3).map((tool) => (
                      <span key={tool} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">{tool}</span>
                    ))}
                  </div>
                </Link>
              ))
            ) : (
              <div className="hero-float-card card-surface absolute left-8 top-8 w-[72%] rounded-[34px] p-8">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand">Store ready</p>
                <h3 className="mt-4 text-3xl font-black text-white">Prompt packs will appear here.</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">Add approved packs from the admin dashboard.</p>
              </div>
            )}
          </MotionDiv>
        </div>
      </section>

      <MotionSection className="section-shell mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <Sparkles className="h-4 w-4" /> Premium packs
            </p>
            <h2 className="mt-2 text-2xl font-bold">Build faster with complete command packs</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">Instant delivery after payment verification. Locked full content stays private until admin confirms payment.</p>
        </div>
        {premiumPacks.length ? (
          <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {premiumPacks.map((pack) => <PromptPackCard key={pack.id} pack={pack} />)}
          </div>
        ) : (
          <EmptyState title="No premium packs yet" message="Approved premium coding packs will appear here." />
        )}
      </MotionSection>

      <MotionSection id="free-prompts" className="section-shell mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <CheckCircle2 className="h-4 w-4" /> Free prompts
            </p>
            <h2 className="mt-2 text-2xl font-bold">Copy-ready starter prompts</h2>
          </div>
          <Link href="/packs?type=free" className="btn-ghost w-full sm:w-auto">View all free prompts</Link>
        </div>
        {freePacks.length ? (
          <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {freePacks.map((pack) => <PromptPackCard key={pack.id} pack={pack} />)}
          </div>
        ) : (
          <EmptyState title="No free prompts yet" message="Add free packs from admin to make copy buttons available." />
        )}
      </MotionSection>

      <MotionSection className="section-shell mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          {[
            { icon: Rocket, title: "Built for shipping", copy: "Prompts focus on app builds, bug fixes, admin panels, Supabase, Vercel, and UI upgrades." },
            { icon: Lock, title: "Locked premium content", copy: "Buyers see previews first. Full packs are delivered by email after payment verification." },
            { icon: ShieldCheck, title: "Simple admin control", copy: "Admin can add packs, update payment details, manage orders, and deliver content without code." }
          ].map((item) => (
            <div key={item.title} className="card-surface rounded-[28px] p-6">
              <item.icon className="h-8 w-8 text-brand" />
              <h3 className="mt-4 text-xl font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.copy}</p>
            </div>
          ))}
        </div>
      </MotionSection>
    </MotionMain>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="card-surface rounded-[32px] p-10 text-center">
      <p className="text-xl font-bold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
    </div>
  );
}
