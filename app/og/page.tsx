import type { Metadata } from "next";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "OG Image Gallery",
  description: "All Open Graph images generated for 18PDF: home + every tool page. Preview, copy, and download.",
  robots: { index: false, follow: false },
};

const HOME = {
  id: "home",
  name: "Home",
  url: "/opengraph-image",
  desc: "All your PDF tools in one place",
  category: "static",
};

const ITEMS = [
  HOME,
  ...TOOLS.map((t) => ({
    id: t.id,
    name: t.name,
    url: `/tool/${t.id}/opengraph-image`,
    desc: t.desc,
    category: t.category,
  })),
];

export default function OgGalleryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          OG Image Gallery
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
          Every Open Graph image 18PDF generates: the static home
          image and one dynamic gradient per tool. Each image is 1200x630
          PNG, the standard size for Twitter, LinkedIn, Slack, Discord, and
          Facebook previews.
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          {ITEMS.length} images total
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-5">
        {ITEMS.map((item) => {
          const fullUrl =
            (process.env.NEXT_PUBLIC_SITE_URL || "https://18pdf.vercel.app") +
            item.url;
          return (
            <article
              key={item.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]/60 backdrop-blur overflow-hidden"
            >
              <div className="relative aspect-[1200/630] bg-[var(--bg-elevated)]">
                <img
                  src={item.url}
                  alt={`${item.name} OG image`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                    {item.name}
                    <span className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                      {item.category}
                    </span>
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                    {item.desc}
                  </p>
                  <code className="block text-[10px] font-mono text-[var(--text-muted)] mt-2 truncate">
                    {item.url}
                  </code>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Open
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-10 p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]/60">
        <h3 className="text-sm font-semibold mb-2">How to use</h3>
        <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 list-disc pl-5">
          <li>
            Click <strong>Open</strong> to view the raw PNG, or right-click
            the image above to save it.
          </li>
          <li>
            Each URL is hit automatically by social crawlers when someone
            shares the corresponding page. No markup needed.
          </li>
          <li>
            The home image is static; per-tool images are generated
            on demand with a unique gradient from the tool&apos;s accent
            hue.
          </li>
        </ul>
      </div>
    </div>
  );
}
