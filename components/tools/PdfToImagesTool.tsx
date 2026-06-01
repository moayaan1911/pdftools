"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ImageIcon, Download } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadBlob, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { renderPdfPagesAsBlobs, getPdfPageCount } from "@/lib/pdfjs-client";
import JSZip from "jszip";

export function PdfToImagesTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(92);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!files[0]) return setPreviews([]);
    let cancelled = false;
    (async () => {
      try {
        const blobs = await renderPdfPagesAsBlobs(files[0], 1, format, quality);
        if (cancelled) return;
        const urls = blobs.map((b) => URL.createObjectURL(b));
        setPreviews(urls);
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
      } catch (e) {
        if (!cancelled) toast("Could not render PDF", "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files, format, quality]);

  const convert = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const blobs = await renderPdfPagesAsBlobs(files[0], scale, format, quality);
      const base = sanitizeFilename(files[0].name.replace(/\.pdf$/i, ""));
      const zip = new JSZip();
      blobs.forEach((b, i) => {
        zip.file(`page-${String(i + 1).padStart(3, "0")}.${format}`, b);
      });
      const out = await zip.generateAsync({ type: "blob" });
      downloadBlob(out, `${base}-${format}s.zip`);
      toast(`Converted ${blobs.length} pages`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <DropZone accept="application/pdf" files={files} onChange={setFiles} />
      {files[0] && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {(["png", "jpeg"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`p-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  format === f
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                    : "bg-[var(--bg-elevated)] border-[var(--border)]"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
              Resolution: {scale}x ({scale === 1 ? "screen" : scale === 2 ? "print" : "high"})
            </label>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={scale}
              onChange={(e) => setScale(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          {format === "jpeg" && (
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                Quality: {quality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {previews.slice(0, 8).map((src, i) => (
                <div key={i} className="aspect-[3/4] rounded-md overflow-hidden bg-white">
                  <img src={src} alt="" className="w-full h-full object-contain" />
                </div>
              ))}
              {previews.length > 8 && (
                <div className="aspect-[3/4] rounded-md bg-[var(--bg-elevated)] flex items-center justify-center text-xs text-[var(--text-muted)]">
                  +{previews.length - 8} more
                </div>
              )}
            </div>
          )}
        </>
      )}
      <ActionButton
        label="Convert & download ZIP"
        icon={<Download className="w-4 h-4" />}
        onClick={convert}
        loading={loading}
        disabled={!files[0]}
      />
    </div>
  );
}
