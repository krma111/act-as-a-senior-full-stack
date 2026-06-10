import type { MetadataRoute } from "next";
import { siteUrl } from "@/backend/env";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date()
    }
  ];
}
