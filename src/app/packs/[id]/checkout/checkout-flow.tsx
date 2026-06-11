"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Mail, IndianRupee, Upload, CheckCircle2, Loader2, AlertTriangle, Copy, ExternalLink, MessageCircle, ShoppingCart, Wallet, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { initiateUPIPayment, submitPaymentScreenshot } from "@/backend/actions/payments";

type Step = "email" | "payment" | "screenshot" | "confirmation";

export function CheckoutFlow({ packId, packTitle, amount, upiId, qrImageUrl }: { packId: string; packTitle: string; amount: number; upiId: string; qrImageUrl: string }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [orderData, setOrderData] = useState<{ order_id: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("pack_id", packId);
    formData.set("email", email);

    const result = await initiateUPIPayment(formData);
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setOrderData({ order_id: result.order_id ?? "" });
    setStep("payment");
    toast.success(`Order ${result.order_id} created.`);
  }

  async function handleScreenshotSubmit() {
    if (!selectedFile) {
      toast.error("Select a screenshot first.");
      return;
    }

    if (!orderData) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.set("order_id", orderData.order_id);
    formData.set("screenshot", selectedFile);
    formData.set("user_email", email);
    formData.set("pack_title", packTitle);
    formData.set("amount", String(amount));

    const result = await submitPaymentScreenshot(formData);
    setIsUploading(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setStep("confirmation");
    toast.success(result.message);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  }

  if (step === "email") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <Mail className="mx-auto h-10 w-10 text-brand" />
          <h2 className="mt-4 text-xl font-bold text-white">Enter your email</h2>
          <p className="mt-2 text-sm text-slate-400">We will send the access link to this email after payment is verified.</p>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="label">Email address</span>
            <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <button className="btn-primary w-full justify-center py-3" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            {isSubmitting ? "Creating order..." : `Pay ₹${amount}`}
          </button>
        </form>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-brand/20 bg-brand/[0.04] p-6">
          <div className="mb-4 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-brand" />
            <h2 className="mt-3 text-lg font-bold text-white">Pay with UPI</h2>
            <p className="mt-1 text-sm text-slate-400">Scan the QR or send payment to the UPI ID below.</p>
          </div>

          <div className="mb-4 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Order ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">{orderData?.order_id}</span>
                <button onClick={() => handleCopy(orderData?.order_id ?? "")} className="text-brand transition hover:text-brand/80">
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-400">Amount</span>
              <span className="font-bold text-white"><IndianRupee className="mr-1 inline h-4 w-4" />{amount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-400">Pack</span>
              <span className="text-sm text-white">{packTitle}</span>
            </div>
          </div>

          <div className="mb-4 flex justify-center">
            {qrImageUrl ? (
              <div className="rounded-2xl border border-white/10 bg-white p-4">
                <img src={qrImageUrl} alt="UPI QR Code" className="h-48 w-48 object-contain" />
              </div>
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <div className="text-center">
                  <Wallet className="mx-auto h-8 w-8 text-slate-500" />
                  <p className="mt-2 text-xs text-slate-400">QR placeholder</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
            <p className="text-xs text-slate-400">UPI ID</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="font-mono font-bold text-white">{upiId}</span>
              <button onClick={() => handleCopy(upiId)} className="text-brand transition hover:text-brand/80">
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
            Please upload a clear payment screenshot with transaction ID visible.
          </p>
        </div>

        <button className="btn-primary w-full justify-center py-3" onClick={() => setStep("screenshot")}>
          <Upload className="h-4 w-4" />
          I Have Paid - Upload Screenshot
        </button>

        <p className="text-center text-xs text-slate-500">Having trouble? Contact admin at support@promptvault.com</p>
      </div>
    );
  }

  if (step === "screenshot") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-brand/20 bg-brand/[0.04] p-6 text-center">
          <Upload className="mx-auto h-10 w-10 text-brand" />
          <h2 className="mt-4 text-xl font-bold text-white">Upload payment screenshot</h2>
          <p className="mt-2 text-sm text-slate-400">Upload a clear screenshot showing the transaction ID and amount.</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
          Please upload a clear payment screenshot with transaction ID visible.
        </div>

        <div className="space-y-2">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="field" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
          {selectedFile && (
            <p className="text-xs text-slate-400">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button className="btn-primary w-full justify-center py-3" disabled={!selectedFile || isUploading} onClick={handleScreenshotSubmit}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isUploading ? "Uploading..." : "Submit payment proof"}
          </button>

          <a href="mailto:support@promptvault.com" className="btn-ghost inline-flex items-center justify-center gap-2 py-3 text-sm">
            <MessageCircle className="h-4 w-4" />
            Contact Admin on Email
          </a>
        </div>

        <p className="text-center text-xs text-slate-500">Order: {orderData?.order_id}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="rounded-2xl border border-brand/20 bg-brand/[0.04] p-8">
        <CheckCircle2 className="mx-auto h-14 w-14 text-brand" />
        <h2 className="mt-4 text-2xl font-black text-white">Payment submitted</h2>

        <div className="mx-auto mt-4 max-w-md rounded-2xl border border-white/10 bg-black/30 p-4 text-left">
          <p className="text-sm font-semibold text-white">{packTitle}</p>
          <p className="mt-1 font-mono text-xs text-slate-400">Order: {orderData?.order_id}</p>
        </div>

        <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-brand/20 bg-brand/10 p-5">
          <ShieldCheck className="mx-auto h-6 w-6 text-brand" />
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Thank you for your payment submission. Your payment will be verified by our team. Once approved, your prompt
            pack access link will be sent to your email.
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Link href="/dashboard/my-packs" className="btn-primary inline-flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            View my purchases
          </Link>
          <a href="mailto:support@promptvault.com" className="btn-ghost inline-flex items-center gap-2 text-sm">
            <MessageCircle className="h-4 w-4" />
            Contact Admin on Email
          </a>
        </div>
      </div>
    </div>
  );
}
