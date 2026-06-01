import type { Metadata } from "next";
import { TOOLS } from "@/lib/tools";
import { ToolClient } from "./ToolClient";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOOLS.map((t) => ({ id: t.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) return { title: "Tool not found" };

  const title = `${tool.name}: Free Online ${tool.name} | ${tool.desc}`;
  const description = `${tool.longDesc} Free, fast, and 100 percent private. No signup, no upload.`;

  return {
    title,
    description,
    keywords: tool.keywords,
    alternates: { canonical: `/tool/${tool.id}` },
    openGraph: {
      type: "website",
      url: `/tool/${tool.id}`,
      title,
      description,
      images: [`/tool/${tool.id}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/tool/${tool.id}/opengraph-image`],
    },
  };
}

const toolJsonLd = (tool: (typeof TOOLS)[number]) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: tool.name,
  description: tool.longDesc,
  totalTime: "PT1M",
  tool: [{ "@type": "HowToTool", name: "Web browser" }],
  step: tool.howItWorks.map((text, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    text,
  })),
});

const toolFaqLd = (tool: (typeof TOOLS)[number]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: tool.faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

const toolBreadcrumbLd = (tool: (typeof TOOLS)[number]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: tool.name,
      item: `/tool/${tool.id}`,
    },
  ],
});

export default async function ToolPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd(tool)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolFaqLd(tool)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolBreadcrumbLd(tool)) }}
      />
      <ToolClient id={id} />
    </>
  );
}
