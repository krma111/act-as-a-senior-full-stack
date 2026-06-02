"use client";

import { useState } from "react";
import { Github, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getAuthCallbackUrl } from "@/lib/auth/urls";
import { isGithubOAuthEnabled } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/auth/icons";

type Provider = "google" | "github";

export function OAuthButtons({ disabled }: { disabled?: boolean }) {
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);

  async function signIn(provider: Provider) {
    if (disabled) return;

    try {
      setActiveProvider(provider);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthCallbackUrl("/dashboard"),
          skipBrowserRedirect: true
        }
      });

      if (error) {
        toast.error(getAuthErrorMessage(error));
        setActiveProvider(null);
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      toast.error("OAuth did not return a redirect URL.");
      setActiveProvider(null);
    } catch (error) {
      toast.error(getAuthErrorMessage(error instanceof Error ? error.message : "Unable to start sign-in."));
      setActiveProvider(null);
    }
  }

  return (
    <div className="grid gap-3">
      <button type="button" className="btn-ghost w-full justify-center py-3" onClick={() => signIn("google")} disabled={disabled || activeProvider !== null}>
        {activeProvider === "google" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>
      {isGithubOAuthEnabled ? (
        <button type="button" className="btn-ghost w-full justify-center py-3" onClick={() => signIn("github")} disabled={disabled || activeProvider !== null}>
          {activeProvider === "github" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
          Continue with GitHub
        </button>
      ) : null}
    </div>
  );
}
