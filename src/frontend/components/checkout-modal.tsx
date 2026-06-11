"use client";

import { Mail, ShoppingBag, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createOrderAction } from "@/backend/mvp-actions";
import { MotionButton } from "@/frontend/components/motion-primitives";
import { SafeImage } from "@/frontend/components/safe-image";

const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

type CheckoutModalProps = {
  packId: string;
  packTitle: string;
  price: number;
  adminEmail: string;
  upiId: string;
  qrCodeUrl?: string | null;
};

function formatPrice(value: number) {
  return `INR ${Math.round(value).toLocaleString("en-IN")}`;
}

export function CheckoutModal({ packId, packTitle, price, adminEmail, upiId, qrCodeUrl }: CheckoutModalProps) {
  const [open, setOpen] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const cleanAdminEmail = adminEmail || "cdubey159@gmail.com";

  const mailtoHref = useMemo(() => {
    const subject = `Payment Screenshot for Prompt Pack`;
    const body = [
      `Prompt pack title: ${packTitle}`,
      `Buyer email: ${buyerEmail || ""}`,
      `Price: ${formatPrice(price)}`,
      orderId ? `Order ID: ${orderId}` : null,
      "",
      "I have completed payment for this PromptVault pack. Please find the payment screenshot attached."
    ]
      .filter(Boolean)
      .join("\n");

    return `mailto:${cleanAdminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [buyerEmail, cleanAdminEmail, orderId, packTitle, price]);

  return (
    <>
      <MotionButton type="button" className="btn-primary w-full justify-center sm:w-auto" onClick={() => setOpen(true)}>
        <ShoppingBag className="h-4 w-4" /> Buy Now
      </MotionButton>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-8 backdrop-blur-xl" role="dialog" aria-modal="true">
          <div className="card-surface relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] p-5 sm:p-7">
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/10 p-2 text-slate-200 transition hover:bg-white/15"
              onClick={() => setOpen(false)}
              aria-label="Close checkout"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Manual UPI Checkout</p>
            <h2 className="mt-3 pr-10 text-2xl font-black text-white">{packTitle}</h2>
            <p className="mt-2 text-lg font-bold text-brand">{formatPrice(price)}</p>
            <p className="mt-4 rounded-2xl border border-brand/20 bg-brand/10 p-4 text-sm leading-6 text-slate-200">
              Thank you for your purchase request. Please complete the payment using the QR code or UPI ID below. After payment, share your payment screenshot by email. Once verified, your prompt pack will be delivered to your email.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-3">
                {qrCodeUrl ? (
                  <SafeImage src={qrCodeUrl} alt="UPI QR code" className="aspect-square w-full rounded-2xl object-cover" />
                ) : (
                  <div className="grid aspect-square place-items-center rounded-2xl bg-black/35 p-6 text-center text-sm text-slate-400">
                    QR code not uploaded yet. Use the UPI ID.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">UPI ID</p>
                  <p className="mt-2 break-all text-lg font-black text-white">{upiId}</p>
                </div>
                <label className="block space-y-2">
                  <span className="label">Buyer email</span>
                  <input
                    className="field"
                    type="email"
                    value={buyerEmail}
                    onChange={(event) => setBuyerEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                {orderId ? (
                  <div className="rounded-2xl border border-brand/30 bg-brand/10 p-4 text-sm text-brand">
                    Order created: <span className="font-bold">{orderId}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <MotionButton
                type="button"
                className="btn-primary flex-1"
                disabled={pending || Boolean(orderId)}
                onClick={() => {
                  if (!emailPattern.test(buyerEmail.trim())) {
                    toast.error("Enter a valid email address.");
                    return;
                  }

                  startTransition(async () => {
                    const result = await createOrderAction({ packId, buyerEmail });
                    if (!result.ok) {
                      toast.error(result.error ?? "Unable to create order.");
                      return;
                    }
                    setOrderId(result.orderId ?? null);
                    toast.success("Order created. Send your screenshot after payment.");
                  });
                }}
              >
                {pending ? "Creating order..." : orderId ? "Order created" : "Create order"}
              </MotionButton>
              <a className={`btn-ghost flex-1 ${!orderId ? "pointer-events-none opacity-60" : ""}`} href={mailtoHref}>
                <Mail className="h-4 w-4" /> Share Payment Screenshot
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
