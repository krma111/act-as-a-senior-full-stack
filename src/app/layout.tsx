import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "sonner";
import { LogOut, ShieldCheck } from "lucide-react";
import "./globals.css";
import { logout } from "@/lib/auth/actions";
import { getAuthSessionState } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/data";

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

function getInitials(value: string) {
  return (
    value
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P"
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, authState] = await Promise.all([getSiteSettings(), getAuthSessionState()]);
  const { user, profile } = authState;
  const displayName = profile?.full_name ?? profile?.display_name ?? user?.email?.split("@")[0] ?? "Account";
  const avatarUrl = profile?.avatar_url ?? (typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null);

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
                {user ? (
                  <>
                    {profile?.role === "admin" ? (
                      <Link href="/admin" className="btn-ghost">
                        <ShieldCheck className="h-4 w-4" /> Admin
                      </Link>
                    ) : null}
                    <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
                    <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 md:flex">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={displayName} width={32} height={32} className="h-8 w-8 rounded-xl border border-white/10 object-cover" />
                      ) : (
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
                          {getInitials(displayName)}
                        </span>
                      )}
                      <div className="text-left leading-tight">
                        <p className="text-sm font-semibold text-white">{displayName}</p>
                        <p className="text-xs text-slate-400">{profile?.email ?? user.email}</p>
                      </div>
                    </div>
                    <form action={logout}>
                      <button className="btn-ghost" aria-label="Log out">
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Logout</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn-ghost">Login</Link>
                    <Link href="/signup" className="btn-primary">Signup</Link>
                  </>
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
