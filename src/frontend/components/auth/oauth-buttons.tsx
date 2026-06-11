"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Github, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { getClientAuthErrorMessage } from "@/backend/auth/client-errors";
import { getAuthErrorMessage } from "@/backend/auth/errors";
import { getAuthCallbackUrl } from "@/backend/auth/urls";
import { isGithubOAuthEnabled } from "@/backend/env";
import { createClient } from "@/backend/database/client";
import { GoogleIcon } from "@/frontend/components/auth/icons";

type Provider = "google" | "github";

export function OAuthButtons({
  authEnabled,
  disabled
}: {
  authEnabled: boolean;
  disabled?: boolean;
}) {
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);

  async function signIn(provider: Provider) {
    if (!authEnabled) {
      toast.error("Supabase is not configured");
      return;
    }

    if (provider === "github" && !isGithubOAuthEnabled) {
      toast.error("GitHub login is not enabled yet.");
      return;
    }

    try {
      setActiveProvider(provider);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthCallbackUrl("/admin"),
          skipBrowserRedirect: true
        }
      });

      if (error) {
        toast.error(getAuthErrorMessage(error));
        setActiveProvider(null);
        return;
      }

      if (data.url) {
        try {
          window.location.assign(data.url);
        } catch {
          toast.error("Your browser blocked the Google sign-in redirect. Allow popups and redirects, then try again.");
          setActiveProvider(null);
        }
        return;
      }

      toast.error("OAuth did not return a redirect URL.");
      setActiveProvider(null);
    } catch (error) {
      toast.error(getClientAuthErrorMessage(error, "Unable to start sign-in."));
      setActiveProvider(null);
    }
  }

  return (
    <div className="grid gap-3">
      <motion.button
        type="button"
        className="btn-ghost w-full justify-center py-3"
        onClick={() => signIn("google")}
        disabled={disabled || activeProvider !== null}
        whileHover={disabled || activeProvider !== null ? undefined : { y: -2, scale: 1.012 }}
        whileTap={disabled || activeProvider !== null ? undefined : { scale: 0.965 }}
      >
        {activeProvider === "google" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        {activeProvider === "google" ? "Opening Google..." : "Continue with Google"}
      </motion.button>
      {isGithubOAuthEnabled ? (
        <motion.button
          type="button"
          className="btn-ghost w-full justify-center py-3"
          onClick={() => signIn("github")}
          disabled={disabled || activeProvider !== null}
          whileHover={disabled || activeProvider !== null ? undefined : { y: -2, scale: 1.012 }}
          whileTap={disabled || activeProvider !== null ? undefined : { scale: 0.965 }}
        >
          {activeProvider === "github" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
          Continue with GitHub
        </motion.button>
      ) : null}
    </div>
  );
}
