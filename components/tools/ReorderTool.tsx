"use client";

import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { motion, Reorder } from "framer-motion";
import { ArrowUpDown, X } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadPdf, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { renderPdfThumbnails } from "@/lib/pdfjs-client";

export function ReorderTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!files[0]) {
      setThumbs([]);
      setOrder([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const t = await renderPdfThumbnails(files[0], 30);
        if (cancelled) return;
        setThumbs(t);
        setOrder(t.map((_, i) => i));
      } catch (e) {
        if (!cancelled) toast("Could not render PDF", "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  const remove = (idx: number) => {
    setOrder((o) => o.filter((x) => x !== idx));
  };

  const apply = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const dst = await PDFDocument.create();
      const pages = await dst.copyPages(src, order);
      pages.forEach((p) => dst.addPage(p));
      const out = await dst.save();
      const base = sanitizeFilename(files[0].name.replace(/\.pdf$/i, ""));
      downloadPdf(out, `${base}-reordered.pdf`);
      toast(`Saved with ${order.length} pages`, "success");
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
          <p className="text-xs text-[var(--text-muted)]">
            Drag to reorder · click ✕ to remove pages
          </p>
          <Reorder.Group
            axis="y"
            values={order}
            onReorder={setOrder}
            className="space-y-1.5"
          >
            {order.map((origIdx) => (
              <Reorder.Item
                key={origIdx}
                value={origIdx}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] cursor-grab active:cursor-grabbing"
                whileDrag={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
              >
                <ArrowUpDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <div className="w-12 h-16 rounded-md overflow-hidden bg-white shrink-0">
                  <img src={thumbs[origIdx]} alt="" className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-medium">Page {origIdx + 1}</span>
                <button
                  onClick={() => remove(origIdx)}
                  className="ml-auto w-7 h-7 rounded-md flex items-center justify-center hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                  aria-label="Remove page"
                >
                  <X className="w-4 h-4" />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </>
      )}
      <ActionButton
        label="Apply & download"
        icon={<ArrowUpDown className="w-4 h-4" />}
        onClick={apply}
        loading={loading}
        disabled={!files[0] || order.length === 0}
      />
    </div>
  );
}
