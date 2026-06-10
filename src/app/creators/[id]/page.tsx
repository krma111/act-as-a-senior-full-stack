import { PublicCreatorProfile } from "@/frontend/components/public-creator-profile";

export default async function CreatorProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicCreatorProfile username={id} />;
}
