"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function AdminFlashToast({ message, error }: { message?: string; error?: string }) {
  useEffect(() => {
    if (error) toast.error(error);
    else if (message) toast.success(message);
  }, [error, message]);

  return null;
}
