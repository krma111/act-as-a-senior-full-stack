import type { MetadataRoute } from "next";
import { siteUrl } from "@/backend/env";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/profile"]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
