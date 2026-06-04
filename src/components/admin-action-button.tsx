"use client";

import { useFormStatus } from "react-dom";

export function AdminSubmitButton({
  children,
  className = "btn-ghost",
  pendingText = "Working...",
  confirm
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
