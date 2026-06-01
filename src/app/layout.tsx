import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import { LogOut, Plus, ShieldCheck, User } from "lucide-react";
import "./globals.css";
import { logout } from "@/lib/actions";
import { getSiteSettings } from "@/lib/data";
import { isPreviewMode } from "@/lib/env";
import { getPreviewUser } from "@/lib/preview-auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      default: settings.website_name,
      template: `%s | ${settings.website_name}`
    },
    description: settings.hero_subheadline
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const supabase = isPreviewMode ? null : await createClient();
  const previewUser = await getPreviewUser();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: previewUser } };
  const { data: profile } = previewUser
    ? { data: previewUser }
    : user && supabase
    ? await supabase.from("users").select("role,display_name,email").eq("id", user.id).single()
    : { data: null };

  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <div className="app-shell min-h-screen">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(180deg,rgba(5,8,11,0.96),rgba(5,8,11,0.82))] backdrop-blur-xl">
            <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:px-8">
              <Link href="/" className="flex items-center gap-3 text-lg font-bold tracking-normal text-white">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-slate-950 shadow-glow">P</span>
                {settings.logo_text}
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/prompts/new" className="btn-primary">
                  <Plus className="h-4 w-4" /> Post
                </Link>
                {profile?.role === "admin" && profile.email?.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() && (
                  <Link href="/admin" className="btn-ghost">
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </Link>
                )}
                {user ? (
                  <>
                    <Link href="/profile" className="btn-ghost">
                      <User className="h-4 w-4" /> {profile?.display_name ?? "Profile"}
                    </Link>
                    <form action={logout}>
                      <button className="btn-ghost" aria-label="Log out">
                        <LogOut className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <Link href="/auth/login" className="btn-ghost">
                    Log in
                  </Link>
                )}
              </div>
            </nav>
          </header>
          {children}
          <footer className="border-t border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-slate-400 backdrop-blur">
            {settings.footer_text}
          </footer>
        </div>
        <Toaster theme="dark" richColors position="bottom-right" />
      </body>
    </html>
  );
}
