"use client";

import { useRouter } from "next/navigation";
import { use, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { ToolShell } from "@/components/ToolShell";
import { TOOLS } from "@/lib/tools";
import { MergeTool } from "@/components/tools/MergeTool";
import { SplitTool } from "@/components/tools/SplitTool";
import { RotateTool } from "@/components/tools/RotateTool";
import { ReorderTool } from "@/components/tools/ReorderTool";
import { PdfToImagesTool } from "@/components/tools/PdfToImagesTool";
import { ImagesToPdfTool } from "@/components/tools/ImagesToPdfTool";
import { ExtractTextTool } from "@/components/tools/ExtractTextTool";
import { HtmlToPdfTool } from "@/components/tools/HtmlToPdfTool";
import { PageNumbersTool } from "@/components/tools/PageNumbersTool";
import { WatermarkTool } from "@/components/tools/WatermarkTool";
import { MetadataTool } from "@/components/tools/MetadataTool";
import { FormsTool } from "@/components/tools/FormsTool";
import { CropTool } from "@/components/tools/CropTool";
import { ExtractPagesTool } from "@/components/tools/ExtractPagesTool";
import { BatchTool } from "@/components/tools/BatchTool";
import { ViewerTool } from "@/components/tools/ViewerTool";
import { CompareTool } from "@/components/tools/CompareTool";
import { OcrTool } from "@/components/tools/OcrTool";

const COMPONENTS: Record<string, React.ComponentType> = {
  merge: MergeTool,
  split: SplitTool,
  rotate: RotateTool,
  reorder: ReorderTool,
  "pdf-to-images": PdfToImagesTool,
  "images-to-pdf": ImagesToPdfTool,
  "extract-text": ExtractTextTool,
  "html-to-pdf": HtmlToPdfTool,
  "page-numbers": PageNumbersTool,
  watermark: WatermarkTool,
  metadata: MetadataTool,
  forms: FormsTool,
  crop: CropTool,
  "extract-pages": ExtractPagesTool,
  batch: BatchTool,
  viewer: ViewerTool,
  compare: CompareTool,
  ocr: OcrTool,
};

export function ToolClient({ id }: { id: string }) {
  const router = useRouter();
  const tool = useMemo(() => TOOLS.find((t) => t.id === id), [id]);
  const Component = tool ? COMPONENTS[tool.id] : null;

  if (!tool) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Tool not found</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-4">No tool matches the URL.</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium"
        >
          Back to all tools
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <ToolShell key={tool.id} tool={tool}>
        {Component ? <Component /> : <div>Coming soon</div>}
      </ToolShell>
    </AnimatePresence>
  );
}
