"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Copy, Download } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadBlob, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { extractPdfText } from "@/lib/pdfjs-client";
import { cn } from "@/lib/utils";

export function ExtractTextTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<{ pageNum: number; text: string }[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!files[0]) {
      setPages([]);
      setActive(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await extractPdfText(files[0]);
        if (cancelled) return;
        setPages(r);
        setActive(0);
        toast(`Extracted text from ${r.length} pages`, "success");
      } catch (e) {
        if (!cancelled) toast("Could not extract text", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  const allText = pages.map((p) => `--- Page ${p.pageNum} ---\n${p.text}`).join("\n\n");

  const copy = () => {
    navigator.clipboard.writeText(allText);
    toast("Copied to clipboard", "success");
  };

  const download = () => {
    downloadBlob(
      new Blob([allText], { type: "text/plain" }),
      `${sanitizeFilename(files[0].name.replace(/\.pdf$/i, ""))}.txt`
    );
  };

  return (
    <div className="space-y-5">
      <DropZone accept="application/pdf" files={files} onChange={setFiles} />
      {pages.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            <ActionButton label="Copy all" icon={<Copy className="w-4 h-4" />} onClick={copy} variant="secondary" />
            <ActionButton label="Download .txt" icon={<Download className="w-4 h-4" />} onClick={download} variant="secondary" />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {pages.map((p, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  active === i
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--border-strong)]"
                )}
              >
                Page {p.pageNum}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.pre
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-96 overflow-auto"
            >
              {pages[active]?.text || "(empty)"}
            </motion.pre>
          </AnimatePresence>
        </>
      )}
      {loading && (
        <div className="h-32 rounded-xl shimmer" />
      )}
    </div>
  );
}
