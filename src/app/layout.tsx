import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import "./globals.css";
import { getMvpSiteSettings } from "@/backend/mvp-data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMvpSiteSettings();
  return {
    title: {
      default: settings.website_name,
      template: `%s | ${settings.website_name}`
    },
    description: settings.homepage_subtitle,
    openGraph: {
      title: settings.homepage_title,
      description: settings.homepage_subtitle,
      type: "website"
    }
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getMvpSiteSettings();

  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <div className="app-shell min-h-screen">
          <div className="premium-noise" />
          <header className="glass-nav sticky top-0 z-40 border-b border-white/10 backdrop-blur-2xl">
            <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="group flex items-center gap-3 text-lg font-bold tracking-normal text-white">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-slate-950 shadow-glow transition duration-300 group-hover:scale-105 group-hover:rotate-3">P</span>
                {settings.logo_text}
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <Link href="/packs" className="btn-ghost">Prompt Packs</Link>
                <Link href="/packs?type=free" className="btn-ghost">Free Prompts</Link>
                <Link href="/admin" className="btn-ghost">Admin</Link>
              </div>
            </nav>
          </header>
          {children}
          <footer className="border-t border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-slate-400 backdrop-blur-xl">
            <div className="soft-divider mx-auto mb-6 max-w-4xl" />
            {settings.footer_text}
          </footer>
        </div>
        <Toaster theme="dark" richColors position="bottom-right" />
      </body>
    </html>
  );
}
