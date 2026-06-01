import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pdftoolkit.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const result: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...TOOLS.map((t) => ({
      url: `${SITE_URL}/tool/${t.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
  return result;
}
