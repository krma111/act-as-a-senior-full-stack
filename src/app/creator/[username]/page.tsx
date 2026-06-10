import { PublicCreatorProfile } from "@/frontend/components/public-creator-profile";

export default async function CreatorUsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <PublicCreatorProfile username={username} />;
}
