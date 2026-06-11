import { redirect } from "next/navigation";

export default async function CategoryRedirect({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  redirect(`/packs?category=${encodeURIComponent(category.replace(/-/g, " "))}`);
}
