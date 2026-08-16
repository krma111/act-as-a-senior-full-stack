import { NextResponse } from "next/server";
import { createAdminClient } from "@/backend/database/admin";
import { hasSupabaseEnv, hasSupabaseServiceRoleKey } from "@/backend/env";
import { withTimeout } from "@/backend/utils/timeout";

export const dynamic = "force-dynamic";

const packs = [
  {
    title: "Next.js SaaS Starter Kit Prompt",
    slug: "nextjs-saas-starter-kit-prompt",
    description: "One highly detailed master prompt that scaffolds a complete production SaaS: auth, billing-ready tables, dashboards, admin, emails, and deployment.",
    category: "SaaS Startup Prompts",
    price: 0,
    is_free: true,
    is_paid: false,
    tools_supported: ["Codex", "Cursor", "Claude", "ChatGPT", "Replit"],
    tech_stack: ["Next.js", "React", "TypeScript", "Supabase", "Tailwind", "Vercel"],
    what_user_gets: "A single master prompt plus follow-up audits for auth, billing, admin, email, and deployment in one session.",
    preview_content: [
      "Act as my senior full-stack architect. Build a complete SaaS starter from this idea: [IDEA]. Use Next.js App Router, TypeScript, Tailwind, Supabase Auth + Database + Storage, and Vercel. Generate the full folder structure, schema, RLS, server actions, public marketing page, app pages, and protected dashboard in one session. Finish with lint, typecheck, build, and a fix pass.",
      "Audit the SaaS for production readiness like a CTO. Check auth flows, RLS, server action authorization, missing error/empty/loading states, database indexes, and environment variable handling. Fix critical issues first.",
      "Set up the billing-ready foundation: customers, subscriptions, credits or seats, usage logs, invoice history, and admin revenue views. Do not call Stripe yet - just model the tables, types, and mock-safe server helpers."
    ],
    full_content:
      "MASTER PROMPT 1: Act as my autonomous senior full-stack architect. Build a complete, production-grade SaaS starter app from this idea: [APP IDEA]. Stack: Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS, Supabase (Auth, Postgres, Storage, Realtime), Vercel deployment. Deliver, in this order: (1) full file tree; (2) database schema with UUID primary keys, timestamps, indexes, RLS policies for public/authenticated/admin; (3) Supabase Auth with signup, login, OAuth, reset password, protected routes; (4) public marketing pages (landing, pricing, FAQ, legal); (5) app pages: dashboard, settings, billing placeholder, and admin panel; (6) server actions for every mutation with validation and error handling; (7) loading, empty, error, and not-found states everywhere; (8) README with setup steps. Then run lint, typecheck, and production build and fix every error before finishing. Do not invent fake data in production paths; use seeded demo data only where explicitly marked.\n\nMASTER PROMPT 2: Act as a CTO reviewing this SaaS codebase. Produce a prioritized audit: critical bugs, security issues (RLS, service role leaks, input validation), missing routes, dead code, slow queries, and deployment blockers. Fix critical and high items in the same session with tests or build verification. Report exactly what changed and why.\n\nMASTER PROMPT 3: Add production email flows. Set up transactional emails for welcome, magic-link, payment receipt, and usage alerts using Resend. Include an email_events audit table, idempotency keys, HTML templates, and graceful fallback when the email provider is not configured.",
    status: "approved",
    total_prompts: 3,
    sort_order: 1
  },
  {
    title: "Production Database Schema Architect",
    slug: "production-database-schema-architect-prompt",
    description: "Turns vague features into battle-tested Postgres schemas: tables, enums, indexes, triggers, RLS, and safe migrations.",
    category: "Database Schema Prompts",
    price: 0,
    is_free: true,
    is_paid: false,
    tools_supported: ["Codex", "Cursor", "Claude", "ChatGPT"],
    tech_stack: ["Postgres", "Supabase", "SQL", "RLS", "Prisma"],
    what_user_gets: "Schema design prompts, RLS builder prompts, migration safety prompts, and query performance prompts.",
    preview_content: [
      "Act as a senior Postgres architect. Design the complete schema for: [FEATURE]. Include tables, enums, foreign keys, unique constraints, indexes for the exact queries we will run, updated_at triggers, and RLS policies for public, authenticated, and admin roles.",
      "Write the migration as an additive, idempotent SQL file. Never drop or rewrite existing tables. Use create table if not exists, add column if not exists, and create index if not exists so it is safe to run twice.",
      "Explain the data model in plain English: entities, relationships, cardinality, ownership, and how every RLS policy maps to a real user story."
    ],
    full_content:
      "SCHEMA PROMPT 1: Act as a senior Postgres/Supabase database architect. Design a complete production schema for: [FEATURE DESCRIPTION]. Deliver: entity list with relationships; DDL with uuid primary keys, proper types (text, numeric, timestamptz, jsonb), check constraints, unique constraints, foreign keys with the right on-delete behavior; indexes covering every query we will run; triggers for updated_at; a full RLS policy set (public read, owner write, admin manage) with grants; and a short data-model explanation in plain English.\n\nSCHEMA PROMPT 2: Convert this existing or draft schema into a production migration: [PASTE SCHEMA]. Make it additive and idempotent: create table if not exists, alter table add column if not exists, create index if not exists, create or replace function for triggers. Preserve all existing data and constraints. Add rollback notes in comments.\n\nSCHEMA PROMPT 3: Profile these queries for performance: [PASTE QUERIES]. Add the missing indexes, rewrite any sequential scans, and normalize or denormalize where it matters. Explain the trade-off for each change and verify with EXPLAIN ANALYZE if possible.",
    status: "approved",
    total_prompts: 3,
    sort_order: 2
  },
  {
    title: "SEO Growth Engine Master Prompt",
    slug: "seo-growth-engine-master-prompt",
    description: "A complete technical + content SEO workflow: keyword strategy, metadata, structured data, sitemaps, and performance.",
    category: "SEO Prompts",
    price: 0,
    is_free: true,
    is_paid: false,
    tools_supported: ["Codex", "Cursor", "Claude", "ChatGPT"],
    tech_stack: ["Next.js", "Metadata API", "JSON-LD", "Sitemap", "Core Web Vitals"],
    what_user_gets: "Technical SEO audit prompts, metadata implementation prompts, content brief prompts, and analytics setup prompts.",
    preview_content: [
      "Act as a senior SEO engineer for this Next.js app. Audit technical SEO: robots.txt, sitemap.xml, canonical URLs, meta titles/descriptions, Open Graph, JSON-LD structured data, image alt text, heading hierarchy, and Core Web Vitals. Fix everything and verify with build.",
      "Generate a complete SEO content plan for: [NICHE]. Deliver 10 keyword clusters with search intent, target pages, and a content brief for the top 3 pages including H1/H2 outline, meta description, internal links, and FAQ schema.",
      "Implement the metadata layer: dynamic generateMetadata for every page, per-page OG/Twitter cards, canonical links, breadcrumb schema, and a dynamic sitemap for all public routes."
    ],
    full_content:
      "SEO PROMPT 1: Act as a senior technical SEO engineer for this Next.js app. Audit and fix: robots.txt, sitemap.xml (dynamic for all public routes), canonical tags, meta title and description for every route, Open Graph and Twitter cards, JSON-LD structured data (Organization, WebSite, BreadcrumbList, FAQPage, Product/Service where relevant), image alt text, heading hierarchy, internal linking, redirects, and Core Web Vitals (LCP, CLS, INP). Implement everything in code, not plugins, and verify with a production build.\n\nSEO PROMPT 2: Act as a content strategist. For the niche [NICHE] and audience [AUDIENCE], produce 10 keyword clusters with search intent (informational/commercial/transactional), difficulty estimate, and a mapped target page per cluster. Then write a detailed content brief for the 3 highest-value pages: primary keyword, secondary keywords, H1 and H2 outline, meta description under 155 characters, internal links to add, FAQ questions with answers for schema, and a 1-2 sentence content goal.\n\nSEO PROMPT 3: Set up SEO analytics: add GA4/Plausible-style event tracking for search, filters, and conversions without blocking performance; create a monthly SEO report template covering rankings, clicks, impressions, CTR, and Core Web Vitals; and list the top 10 quick wins for this site this month.",
    status: "approved",
    total_prompts: 3,
    sort_order: 3
  },
  {
    title: "AI Agent Workflow Builder Prompt",
    slug: "ai-agent-workflow-builder-prompt",
    description: "Designs and ships production AI agents: goals, tools, memory, guardrails, streaming UI, and cost controls.",
    category: "AI Agent Prompts",
    price: 0,
    is_free: true,
    is_paid: false,
    tools_supported: ["Codex", "Cursor", "Claude", "ChatGPT"],
    tech_stack: ["TypeScript", "Vercel AI SDK", "Supabase", "Postgres", "Streaming"],
    what_user_gets: "Agent architecture prompts, tool-building prompts, memory prompts, and safety/cost guardrail prompts.",
    preview_content: [
      "Act as a senior AI engineer. Design a production AI agent for: [USE CASE]. Define the agent goal, system prompt, tool list with exact JSON schemas, memory strategy, guardrails, and fallback behavior. Then implement it with streaming responses and a clean chat UI.",
      "Build the agent memory layer: conversation history, persistent user context, and retrievable knowledge using Postgres tables with embeddings-ready columns. Include a retention policy.",
      "Add cost and safety controls: token budget per conversation, rate limits, content moderation, tool-call allowlist, and structured error handling so the agent never silently fails."
    ],
    full_content:
      "AGENT PROMPT 1: Act as a senior AI/ML engineer. Build a production AI agent for: [USE CASE]. Requirements: (1) precise system prompt with the agent role, capabilities, and hard rules; (2) 2-5 tools with strict JSON input schemas, implemented as server actions or API routes with authentication; (3) memory: per-conversation history, persisted user context in Supabase, and a knowledge lookup tool; (4) guardrails: deny risky actions, content policy, token budget, and max turns; (5) streaming UI with typed status updates, cancel, and error recovery; (6) logging of every tool call and cost estimate. Ship it end to end with typecheck and build passing.\n\nAGENT PROMPT 2: Extend this agent with a retrieval step. Create a Postgres table for knowledge items (id, title, content, embedding-ready fields, source, created_at), a seeding script, a search tool using similarity search, and wire the agent to cite sources in answers. Include a privacy note: never store raw user secrets in the knowledge table.\n\nAGENT PROMPT 3: Harden this agent for production. Add: input/output moderation, prompt-injection defenses, tool-call allowlist and schema validation, per-user rate limiting, a dead-letter error handler, token and cost tracking with a monthly cap, observability logs, and a kill switch. Document the risk register.",
    status: "approved",
    total_prompts: 3,
    sort_order: 4
  },
  {
    title: "Feature Ship in One Session Prompt",
    slug: "feature-ship-in-one-session-prompt",
    description: "Turns any feature request into a fully shipped feature: spec, schema, UI, tests, and deploy checklist in one session.",
    category: "Full App Build Prompts",
    price: 0,
    is_free: true,
    is_paid: false,
    tools_supported: ["Codex", "Cursor", "Lovable", "Bolt", "Claude", "ChatGPT"],
    tech_stack: ["Next.js", "TypeScript", "Tailwind", "Supabase", "Vercel"],
    what_user_gets: "A single end-to-end feature workflow plus QA and rollback prompts that work on any existing codebase.",
    preview_content: [
      "Act as a senior full-stack engineer. Ship this feature end to end: [FEATURE]. Start by reading the existing codebase and defining the spec, then implement schema changes, server actions, UI, states, and tests. Finish with lint, typecheck, and build passing.",
      "Before writing code, produce a short spec: user story, acceptance criteria, edge cases, data model changes, RLS impact, and what should NOT change. Get the plan down first, then implement.",
      "Run a production QA pass on the feature: test the happy path, validation errors, empty states, permission failures, slow network, and mobile layout. Fix everything found."
    ],
    full_content:
      "FEATURE PROMPT 1: Act as a senior full-stack engineer. Ship this feature end to end in one session: [FEATURE DESCRIPTION]. Phase 1 - Read the codebase and write a spec: user story, acceptance criteria, edge cases, files to touch, schema/RLS changes, and risks. Phase 2 - Implement: migration, types, data access, server actions with validation and authorization, UI with loading/empty/error states, and mobile-responsive styling. Phase 3 - Verify: run lint, typecheck, and production build; fix all errors; run a manual checklist of the acceptance criteria. Phase 4 - Summarize: files changed, how to test, and anything deferred.\n\nFEATURE PROMPT 2: Fix this broken feature: [PASTE ERROR OR BUG]. Reproduce it first, trace the data flow from UI to database, identify the root cause (validation, RLS, schema, state, or async handling), fix it cleanly, add regression protection (error states, tests if the project has them), and verify with lint/typecheck/build. Explain what changed and why in one short summary.\n\nFEATURE PROMPT 3: Prepare this feature for a safe production deploy: write the deploy checklist (migration order, env variables, cache invalidation, feature flags), add a rollback plan, verify the feature with a production build and smoke test of the critical paths, and note anything the next engineer needs to know.",
    status: "approved",
    total_prompts: 3,
    sort_order: 5
  }
];

export async function GET() {
  if (!hasSupabaseEnv || !hasSupabaseServiceRoleKey()) {
    return NextResponse.json({ error: "service role not configured" }, { status: 500 });
  }

  const supabase = createAdminClient();
  const results = [];

  for (const pack of packs) {
    const { data, error } = await withTimeout(
      supabase.from("prompt_packs").upsert(pack, { onConflict: "slug" }).select("id,slug,title,status"),
      15000,
      `seed ${pack.slug}`
    );
    results.push({ slug: pack.slug, ok: !error, error: error ? error.message : null, row: data?.[0] ?? null });
  }

  return NextResponse.json({ count: results.length, results });
}