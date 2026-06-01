"use client";

import { useState, useEffect } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { motion } from "framer-motion";
import { RotateCcw, RotateCw as RotateCwIcon, RotateCw, Check, Square } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadPdf, sanitizeFilename, cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { renderPdfThumbnails } from "@/lib/pdfjs-client";

export function RotateTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [rotations, setRotations] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!files[0]) {
      setThumbs([]);
      setRotations([]);
      setSelected(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const t = await renderPdfThumbnails(files[0], 30);
        if (cancelled) return;
        setThumbs(t);
        setRotations(t.map(() => 0));
        setSelected(new Set());
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Could not render PDF";
        toast(msg, "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  const rotate = (idx: number, delta: number) => {
    setRotations((r) => {
      const next = [...r];
      next[idx] = ((next[idx] + delta) % 360 + 360) % 360;
      return next;
    });
  };

  const apply = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = doc.getPages();
      rotations.forEach((deg, i) => {
        if (deg !== 0) pages[i].setRotation(degrees(deg));
      });
      const out = await doc.save();
      const base = sanitizeFilename(files[0].name.replace(/\.pdf$/i, ""));
      downloadPdf(out, `${base}-rotated.pdf`);
      toast("Rotation applied", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (i: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const batchRotate = (delta: number) => {
    if (selected.size === 0) {
      toast("Select pages first", "warning");
      return;
    }
    setRotations((r) => {
      const next = [...r];
      selected.forEach((i) => {
        next[i] = ((next[i] + delta) % 360 + 360) % 360;
      });
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <DropZone accept="application/pdf" files={files} onChange={setFiles} />
      {thumbs.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-[var(--text-muted)]">
              {selected.size > 0 ? `${selected.size} selected` : "Click thumbnails to select"}
            </span>
            <div className="flex gap-1.5 ml-auto">
              <ActionButton
                label="↺ 90"
                onClick={() => batchRotate(-90)}
                variant="secondary"
              />
              <ActionButton
                label="↻ 90"
                onClick={() => batchRotate(90)}
                variant="secondary"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {thumbs.map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="group relative"
              >
                <button
                  onClick={() => toggleSelect(i)}
                  className={cn(
                    "absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                    selected.has(i)
                      ? "bg-[var(--accent)] border-[var(--accent)]"
                      : "bg-white/80 border-white/80 backdrop-blur"
                  )}
                >
                  {selected.has(i) && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white shadow-md">
                  <motion.img
                    src={src}
                    alt={`Page ${i + 1}`}
                    className="w-full h-full object-contain"
                    animate={{ rotate: rotations[i] }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  />
                </div>
                <div className="flex gap-1 mt-1.5">
                  <button
                    onClick={() => rotate(i, -90)}
                    className="flex-1 p-1.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                    aria-label="Rotate left"
                  >
                    <RotateCcw className="w-3 h-3 mx-auto" />
                  </button>
                  <span className="px-2 py-1.5 text-xs text-[var(--text-muted)] min-w-[3rem] text-center">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => rotate(i, 90)}
                    className="flex-1 p-1.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                    aria-label="Rotate right"
                  >
                    <RotateCwIcon className="w-3 h-3 mx-auto" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
      <ActionButton
        label="Apply & download"
        icon={<RotateCw className="w-4 h-4" />}
        onClick={apply}
        loading={loading}
        disabled={!files[0]}
      />
    </div>
  );
}
