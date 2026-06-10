"use client";

import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { clsx } from "clsx";

type SafeImageProps = Omit<ComponentPropsWithoutRef<"img">, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  fill?: boolean;
  fallback?: ReactNode;
  priority?: boolean;
};

function isSafeImageSource(value?: string | null) {
  if (!value) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "blob:" || url.protocol === "data:";
  } catch {
    return false;
  }
}

export function SafeImage({ src, alt, fill = false, fallback, className, onError, priority = false, loading, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const canRender = isSafeImageSource(src) && !failed;
  const safeSrc = src ?? "";

  if (!canRender) {
    return (
      fallback ?? (
        <div
          className={clsx(
            "grid place-items-center bg-brand/5 px-6 text-center text-sm font-semibold text-slate-400",
            fill ? "absolute inset-0 h-full w-full" : "h-full w-full",
            className
          )}
          role="img"
          aria-label={alt}
        >
          Image unavailable
        </div>
      )
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Database/user images can come from arbitrary HTTPS hosts; this avoids Next Image runtime crashes.
    <img
      {...props}
      src={safeSrc}
      alt={alt}
      loading={priority ? "eager" : loading}
      fetchPriority={priority ? "high" : props.fetchPriority}
      className={clsx(fill && "absolute inset-0 h-full w-full", className)}
      onError={(event) => {
        console.error("[safe-image] Failed to load image", { src: safeSrc, alt });
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
