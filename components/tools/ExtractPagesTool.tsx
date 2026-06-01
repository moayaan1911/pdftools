"use client";

import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { motion } from "framer-motion";
import { FileOutput, Check } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadPdf, parsePageRange, sanitizeFilename, cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { getPdfPageCount, renderPdfThumbnails } from "@/lib/pdfjs-client";

export function ExtractPagesTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [range, setRange] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!files[0]) {
      setThumbs([]);
      setSelected(new Set());
      setTotalPages(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const c = await getPdfPageCount(files[0]);
        const t = await renderPdfThumbnails(files[0], 30);
        if (cancelled) return;
        setThumbs(t);
        setSelected(new Set());
        setTotalPages(c);
      } catch (e) {
        if (!cancelled) toast("Could not read PDF", "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  const toggle = (i: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const applyRange = () => {
    const pages = parsePageRange(range, totalPages);
    if (!pages) {
      toast("Invalid range", "error");
      return;
    }
    setSelected(new Set(pages.map((p) => p - 1)));
  };

  const extract = async () => {
    if (!files[0] || selected.size === 0) {
      toast("Select at least one page", "warning");
      return;
    }
    setLoading(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const dst = await PDFDocument.create();
      const pages = await dst.copyPages(src, Array.from(selected).sort((a, b) => a - b));
      pages.forEach((p) => dst.addPage(p));
      const out = await dst.save();
      const base = sanitizeFilename(files[0].name.replace(/\.pdf$/i, ""));
      downloadPdf(out, `${base}-extracted.pdf`);
      toast(`Extracted ${pages.length} pages`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <DropZone accept="application/pdf" files={files} onChange={setFiles} />
      {thumbs.length > 0 && (
        <>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Or enter a range</label>
            <div className="flex gap-2">
              <input
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="e.g. 1-3, 5, 7"
                className="flex-1 px-3.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm"
              />
              <button
                onClick={applyRange}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-sm font-medium"
              >
                Select
              </button>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)]">{selected.size} selected</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {thumbs.map((src, i) => (
              <motion.button
                key={i}
                onClick={() => toggle(i)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-colors",
                  selected.has(i) ? "border-[var(--accent)]" : "border-[var(--border)]"
                )}
              >
                <img src={src} alt="" className="w-full h-full object-contain bg-white" />
                <div className="absolute top-1 left-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">
                  {i + 1}
                </div>
                {selected.has(i) && (
                  <div className="absolute inset-0 bg-[var(--accent)]/15 flex items-center justify-center">
                    <Check className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </>
      )}
      <ActionButton
        label={`Extract ${selected.size || 0} page${selected.size === 1 ? "" : "s"}`}
        icon={<FileOutput className="w-4 h-4" />}
        onClick={extract}
        loading={loading}
        disabled={!files[0] || selected.size === 0}
      />
    </div>
  );
}
