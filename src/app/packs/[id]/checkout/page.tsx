import { notFound } from "next/navigation";
import { ArrowLeft, IndianRupee, ShoppingCart, Wallet, Upload, Mail, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { getPackById } from "@/backend/data/payments";
import { CheckoutFlow } from "./checkout-flow";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = await getPackById(id);
  if (!pack) notFound();

  const upiId = process.env.UPI_ID ?? "promptvault@upi";
  const qrImageUrl = process.env.UPI_QR_URL ?? "";

  return (
    <MotionMain className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href={`/packs/${id}`} className="btn-ghost mb-6 inline-flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to pack
      </Link>

      <MotionSection className="card-surface overflow-hidden rounded-[32px] p-6 sm:p-8">
        <div className="mb-6 text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-brand">
            <Wallet className="h-4 w-4" />
            UPI payment
          </p>
          <h1 className="hero-title mt-3 text-3xl font-black">Complete your purchase</h1>
        </div>

        <div className="mb-8 rounded-2xl border border-brand/20 bg-brand/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{pack.title}</p>
              <p className="mt-1 text-xs text-slate-400">{pack.total_prompts ?? 0} prompts</p>
            </div>
            <span className="text-xl font-bold text-brand">
              <IndianRupee className="mr-1 inline h-5 w-5" />
              {pack.price}
            </span>
          </div>
        </div>

        <CheckoutFlow packId={id} packTitle={pack.title} amount={pack.price} upiId={upiId} qrImageUrl={qrImageUrl} />
      </MotionSection>
    </MotionMain>
  );
}
