import { PublicPromptDetail } from "@/frontend/components/public-prompt-detail";

export default async function PromptDetail({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <PublicPromptDetail idOrSlug={id} message={query.message} error={query.error} />;
}
