"use client";

import { motion } from "framer-motion";
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
    <motion.button
      className={className}
      disabled={pending}
      whileHover={pending ? undefined : { y: -2, scale: 1.015 }}
      whileTap={pending ? undefined : { scale: 0.965 }}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </motion.button>
  );
}
