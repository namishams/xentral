import type { MetadataRoute } from "next";

// Preview/staging subdomain — keep it out of all search indexes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
