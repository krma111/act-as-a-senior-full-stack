import Link from "next/link";
import { ArrowLeft, CheckCircle2, Code2, Lock, PackageCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { CheckoutModal } from "@/frontend/components/checkout-modal";
import { CopyTextButton } from "@/frontend/components/copy-text-button";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { getMvpSiteSettings, getPublicPromptPack } from "@/backend/mvp-data";

export const revalidate = 60;

function formatPrice(price: number) {
  return `INR ${Math.round(price).toLocaleString("en-IN")}`;
}

export default async function PackDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, pack] = await Promise.all([getMvpSiteSettings(), getPublicPromptPack(slug)]);
  if (!pack) notFound();

  const previewText = pack.preview_content.join("\n\n");

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/packs" className="btn-ghost mb-6 inline-flex">
        <ArrowLeft className="h-4 w-4" /> Back to packs
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <MotionSection className="card-surface rounded-[34px] p-6 sm:p-8">
          <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand">
            {pack.category}
          </span>
          <h1 className="hero-title mt-4 text-4xl font-black sm:text-5xl">{pack.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{pack.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Price</p>
              <p className="mt-2 text-2xl font-black text-brand">{pack.is_free ? "Free" : formatPrice(pack.price)}</p>
            </div>
            <div className="panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Prompts</p>
              <p className="mt-2 text-2xl font-black text-white">{pack.total_prompts || pack.preview_content.length}</p>
            </div>
            <div className="panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Delivery</p>
              <p className="mt-2 text-lg font-black text-white">Email</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <InfoBlock title="Tools supported" items={pack.tools_supported} />
            <InfoBlock title="Tech stack" items={pack.tech_stack.length ? pack.tech_stack : ["React", "Next.js", "Supabase", "Tailwind", "Vercel"]} />
          </div>

          {pack.what_user_gets ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-brand">
                <PackageCheck className="h-4 w-4" /> What you will get
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{pack.what_user_gets}</p>
            </div>
          ) : null}

          <div className="mt-8">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-brand">
              <Code2 className="h-4 w-4" /> Preview prompts
            </p>
            <div className="mt-4 grid gap-4">
              {pack.preview_content.length ? pack.preview_content.map((prompt, index) => (
                <div key={`${pack.id}-preview-${index}`} className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Preview {index + 1}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{prompt}</p>
                  {pack.is_free ? <CopyTextButton text={prompt} label="Copy this prompt" className="btn-ghost mt-4" /> : null}
                </div>
              )) : (
                <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm text-slate-400">No preview prompts yet.</div>
              )}
            </div>
          </div>
        </MotionSection>

        <MotionSection className="card-surface sticky top-28 rounded-[34px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand">Access</p>
          <h2 className="mt-3 text-2xl font-black text-white">{pack.is_free ? "Free copy access" : "Premium locked pack"}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {pack.is_free
              ? "This pack is free. Copy the preview prompts and use them in your coding tool."
              : "Full premium content is delivered to your email after manual UPI payment verification."}
          </p>
          <div className="mt-5 rounded-2xl border border-brand/20 bg-brand/10 p-4 text-sm text-brand">
            Instant delivery after payment verification
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {pack.is_free ? (
              <CopyTextButton text={previewText} label="Copy all free prompts" className="btn-primary w-full justify-center" />
            ) : (
              <>
                <CheckoutModal
                  packId={pack.id}
                  packTitle={pack.title}
                  price={pack.price}
                  adminEmail={settings.admin_email}
                  upiId={settings.upi_id}
                  qrCodeUrl={settings.qr_code_url}
                />
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-white"><Lock className="h-4 w-4" /> Locked content</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Full prompt pack content is hidden from the public page and sent after admin approval.</p>
                </div>
              </>
            )}
          </div>
        </MotionSection>
      </div>
    </MotionMain>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-brand">
        <CheckCircle2 className="h-4 w-4" /> {title}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">{item}</span>
        ))}
      </div>
    </div>
  );
}