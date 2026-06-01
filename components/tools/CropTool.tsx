"use client";

import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { Crop } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadPdf, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { getPdfPageCount } from "@/lib/pdfjs-client";
import { cn } from "@/lib/utils";

type Preset = "custom" | "square" | "16-9" | "1-1" | "a4" | "letter";

export function CropTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [preset, setPreset] = useState<Preset>("custom");
  const [top, setTop] = useState(0);
  const [right, setRight] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [left, setLeft] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!files[0]) return setTotalPages(0);
    let cancelled = false;
    (async () => {
      try {
        const c = await getPdfPageCount(files[0]);
        if (!cancelled) setTotalPages(c);
      } catch {
        if (!cancelled) toast("Could not read PDF", "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  const apply = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = doc.getPages();
      for (const page of pages) {
        const { width, height } = page.getMediaBox();
        const trim = (sides: { top: number; right: number; bottom: number; left: number }) => {
          const t = Math.min(sides.top, height - 10);
          const r = Math.min(sides.right, width - 10);
          const b = Math.min(sides.bottom, height - t - 10);
          const l = Math.min(sides.left, width - r - 10);
          page.setMediaBox(l, b, width - l - r, height - t - b);
        };
        if (preset === "custom") {
          trim({ top, right, bottom, left });
        } else if (preset === "square") {
          const m = Math.min(width, height) / 2;
          const cx = width / 2;
          const cy = height / 2;
          const s = m * 0.95;
          const half = s / 2;
          page.setMediaBox(cx - half, cy - half, s, s);
        } else if (preset === "16-9") {
          const targetRatio = 16 / 9;
          let w = width;
          let h = w / targetRatio;
          if (h > height) {
            h = height;
            w = h * targetRatio;
          }
          const x = (width - w) / 2;
          const y = (height - h) / 2;
          page.setMediaBox(x, y, w, h);
        } else if (preset === "1-1") {
          const s = Math.min(width, height) * 0.95;
          const x = (width - s) / 2;
          const y = (height - s) / 2;
          page.setMediaBox(x, y, s, s);
        } else if (preset === "a4") {
          const [a4w, a4h] = [595.28, 841.89];
          const ratio = Math.min(width / a4w, height / a4h);
          const w = a4w * ratio;
          const h = a4h * ratio;
          const x = (width - w) / 2;
          const y = (height - h) / 2;
          page.setMediaBox(x, y, w, h);
        } else if (preset === "letter") {
          const [lw, lh] = [612, 792];
          const ratio = Math.min(width / lw, height / lh);
          const w = lw * ratio;
          const h = lh * ratio;
          const x = (width - w) / 2;
          const y = (height - h) / 2;
          page.setMediaBox(x, y, w, h);
        }
      }
      const out = await doc.save();
      const base = sanitizeFilename(files[0].name.replace(/\.pdf$/i, ""));
      downloadPdf(out, `${base}-cropped.pdf`);
      toast("Cropped", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <DropZone accept="application/pdf" files={files} onChange={setFiles} />
      {totalPages > 0 && <p className="text-xs text-[var(--text-muted)]">{totalPages} pages</p>}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Preset</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {(["custom", "square", "16-9", "1-1", "a4", "letter"] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={cn(
                "px-2 py-2 rounded-lg text-xs font-medium border transition-colors",
                preset === p
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                  : "bg-[var(--bg-elevated)] border-[var(--border)]"
              )}
            >
              {p === "1-1" ? "1:1" : p === "16-9" ? "16:9" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {preset === "custom" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["top", "right", "bottom", "left"] as const).map((side) => {
            const value = { top, right, bottom, left }[side];
            const setter = { setTop, setRight, setBottom, setLeft }[side === "top" ? "setTop" : side === "right" ? "setRight" : side === "bottom" ? "setBottom" : "setLeft"];
            return (
              <div key={side}>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5 capitalize">{side} (pt)</label>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => setter(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm"
                />
              </div>
            );
          })}
        </div>
      )}
      <ActionButton
        label="Crop & download"
        icon={<Crop className="w-4 h-4" />}
        onClick={apply}
        loading={loading}
        disabled={!files[0]}
      />
    </div>
  );
}
