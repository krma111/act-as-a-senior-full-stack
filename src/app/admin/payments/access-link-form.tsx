"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { approvePaymentWithAccess } from "@/backend/actions/payments";

type Props = {
  id: string;
  userId: string;
  packId: string;
  userEmail: string;
  packName: string;
};

export function AccessLinkForm({ id, userId, packId, userEmail, packName }: Props) {
  const [state, formAction, pending] = useActionState(approvePaymentWithAccess, null);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="pack_id" value={packId} />
      <input type="hidden" name="user_email" value={userEmail} />
      <input type="hidden" name="pack_name" value={packName} />

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-400">Unique access link</span>
        <div className="flex gap-2">
          <input className="field flex-1" name="access_link" type="url" placeholder="https://..." required />
          <button className="btn-primary whitespace-nowrap" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {pending ? "Sending..." : "Approve & send"}
          </button>
        </div>
      </label>

      <p className="text-xs text-amber-300">Paste a unique access link. This will be sent to the user and stored permanently.</p>
    </form>
  );
}
