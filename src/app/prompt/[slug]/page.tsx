import { PublicPromptDetail } from "@/frontend/components/public-prompt-detail";

export default async function PromptSlugDetail({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return <PublicPromptDetail idOrSlug={slug} message={query.message} error={query.error} />;
}
