import { NextResponse } from "next/server";
import { createPublicClient } from "@/backend/database/public";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/backend/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = { ts: new Date().toISOString(), hasEnv: hasSupabaseEnv };
  if (!hasSupabaseEnv) return NextResponse.json({ ...out, error: "no env" });

  out.url = getSupabaseUrl();

  const client = createPublicClient();
  const start = Date.now();
  try {
    const { data, error } = await client
      .from("prompt_packs")
      .select("id,title,slug,status")
      .eq("status", "approved")
      .order("sort_order", { ascending: true })
      .limit(5);
    out.client = {
      tookMs: Date.now() - start,
      count: Array.isArray(data) ? data.length : null,
      error: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null
    };
  } catch (e) {
    out.client = { tookMs: Date.now() - start, threw: String(e) };
  }

  const key = getSupabaseAnonKey();
  const fStart = Date.now();
  try {
    const res = await fetch(`${getSupabaseUrl()}/rest/v1/prompt_packs?select=id%2Ctitle&limit=2`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store"
    });
    const text = await res.text();
    out.raw = { tookMs: Date.now() - fStart, status: res.status, body: text.slice(0, 600) };
  } catch (e) {
    out.raw = { tookMs: Date.now() - fStart, threw: String(e) };
  }

  return NextResponse.json(out);
}
