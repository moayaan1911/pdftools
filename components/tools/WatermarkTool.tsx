"use client";

import { useState, useEffect } from "react";
import { PDFDocument, degrees, rgb } from "pdf-lib";
import { Stamp } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadPdf, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { getPdfPageCount } from "@/lib/pdfjs-client";
import { cn } from "@/lib/utils";

type Mode = "text" | "image";

export function WatermarkTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [color, setColor] = useState("#ff0000");
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(-45);
  const [fontSize, setFontSize] = useState(60);
  const [scope, setScope] = useState<"all" | "odd" | "even">("all");
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

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

  const apply = async () => {
    if (!files[0]) return;
    if (mode === "image" && !imageFile) {
      toast("Upload a watermark image", "warning");
      return;
    }
    setLoading(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = doc.getPages();
      const isPng = mode === "image" && (imageFile!.type === "image/png" || imageFile!.name.toLowerCase().endsWith(".png"));
      const img = mode === "image"
        ? (isPng
          ? await doc.embedPng(await imageFile!.arrayBuffer())
          : await doc.embedJpg(await imageFile!.arrayBuffer()))
        : null;

      pages.forEach((page, i) => {
        if (scope === "odd" && i % 2 === 1) return;
        if (scope === "even" && i % 2 === 0) return;
        const { width, height } = page.getSize();
        if (mode === "text") {
          const textWidth = text.length * fontSize * 0.5;
          page.drawText(text, {
            x: (width - textWidth) / 2,
            y: height / 2,
            size: fontSize,
            rotate: degrees(rotation),
            color: hexToRgb(color),
            opacity,
          });
        } else if (img) {
          const targetW = width * 0.4;
          const ratio = img.height / img.width;
          page.drawImage(img, {
            x: (width - targetW) / 2,
            y: (height - targetW * ratio) / 2,
            width: targetW,
            height: targetW * ratio,
            rotate: degrees(rotation),
            opacity,
          });
        }
      });

      const out = await doc.save();
      const base = sanitizeFilename(files[0].name.replace(/\.pdf$/i, ""));
      downloadPdf(out, `${base}-watermarked.pdf`);
      toast("Watermark applied", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <DropZone accept="application/pdf" files={files} onChange={setFiles} />
      {totalPages > 0 && (
        <p className="text-xs text-[var(--text-muted)]">{totalPages} page{totalPages !== 1 ? "s" : ""}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {(["text", "image"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "p-2.5 rounded-xl text-sm font-medium border transition-colors capitalize",
              mode === m
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                : "bg-[var(--bg-elevated)] border-[var(--border)]"
            )}
          >
            {m} watermark
          </button>
        ))}
      </div>
      {mode === "text" ? (
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Watermark text</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-sm"
          />
        </div>
      ) : (
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Watermark image (PNG/JPG)</label>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm"
          />
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {mode === "text" && (
          <>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Size</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 60)}
                className="w-full px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm"
              />
            </div>
          </>
        )}
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Opacity: {Math.round(opacity * 100)}%</label>
          <input type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full mt-2" />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Rotation: {rotation}°</label>
          <input type="range" min="-90" max="90" step="5" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full mt-2" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Apply to</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(["all", "odd", "even"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-colors capitalize",
                scope === s
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                  : "bg-[var(--bg-elevated)] border-[var(--border)]"
              )}
            >
              {s} pages
            </button>
          ))}
        </div>
      </div>
      <ActionButton
        label="Apply & download"
        icon={<Stamp className="w-4 h-4" />}
        onClick={apply}
        loading={loading}
        disabled={!files[0]}
      />
    </div>
  );
}
