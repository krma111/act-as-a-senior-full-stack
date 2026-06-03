import { redirect } from "next/navigation";

export default async function OldEditPromptRedirect({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/edit/${id}`);
}
