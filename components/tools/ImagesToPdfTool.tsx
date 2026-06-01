"use client";

import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { Reorder } from "framer-motion";
import { FileImage, X, GripVertical } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadPdf, formatBytes, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";

type PageSize = "a4" | "letter" | "auto";
type Orientation = "portrait" | "landscape";
type Fit = "fill" | "contain" | "center";

export function ImagesToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [fit, setFit] = useState<Fit>("contain");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const convert = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const doc = await PDFDocument.create();
      // Standard sizes in points
      const sizes: Record<string, [number, number]> = {
        a4: [595.28, 841.89],
        letter: [612, 792],
      };

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
        const img = isPng
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);

        const dims = img.size();
        let pageW: number, pageH: number;
        if (pageSize === "auto") {
          pageW = dims.width;
          pageH = dims.height;
        } else {
          const [w, h] = sizes[pageSize];
          pageW = orientation === "portrait" ? w : h;
          pageH = orientation === "portrait" ? h : w;
        }
        const page = doc.addPage([pageW, pageH]);

        let drawW = pageW,
          drawH = pageH,
          drawX = 0,
          drawY = 0;
        if (pageSize !== "auto") {
          if (fit === "fill") {
            // scale to cover entire page
            const ratio = Math.max(pageW / dims.width, pageH / dims.height);
            drawW = dims.width * ratio;
            drawH = dims.height * ratio;
            drawX = (pageW - drawW) / 2;
            drawY = (pageH - drawH) / 2;
          } else if (fit === "contain") {
            // fit within with margin
            const margin = 20;
            const maxW = pageW - margin * 2;
            const maxH = pageH - margin * 2;
            const ratio = Math.min(maxW / dims.width, maxH / dims.height);
            drawW = dims.width * ratio;
            drawH = dims.height * ratio;
            drawX = (pageW - drawW) / 2;
            drawY = (pageH - drawH) / 2;
          } else {
            // center at original size
            drawW = Math.min(dims.width, pageW);
            drawH = (dims.height / dims.width) * drawW;
            drawX = (pageW - drawW) / 2;
            drawY = (pageH - drawH) / 2;
          }
        }
        page.drawImage(img, { x: drawX, y: drawY, width: drawW, height: drawH });
      }
      const out = await doc.save();
      downloadPdf(out, `images-${Date.now()}.pdf`);
      toast(`Created PDF with ${files.length} pages`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <DropZone
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        multiple
        files={files}
        onChange={setFiles}
      />
      {files.length > 0 && (
        <>
          <p className="text-xs text-[var(--text-muted)]">Drag to reorder</p>
          <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-1.5">
            {files.map((f, i) => (
              <Reorder.Item
                key={`${f.name}-${i}`}
                value={f}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] cursor-grab active:cursor-grabbing"
                whileDrag={{ scale: 1.02 }}
              >
                <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
                <div className="w-10 h-12 rounded-md overflow-hidden bg-white shrink-0">
                  {previews[i] && <img src={previews[i]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatBytes(f.size)}</p>
                </div>
                <button
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Select label="Page size" value={pageSize} onChange={(v) => setPageSize(v as PageSize)} options={[["a4", "A4"], ["letter", "Letter"], ["auto", "Auto"]]} />
        <Select label="Orientation" value={orientation} onChange={(v) => setOrientation(v as Orientation)} options={[["portrait", "Portrait"], ["landscape", "Landscape"]]} disabled={pageSize === "auto"} />
        <Select label="Fit" value={fit} onChange={(v) => setFit(v as Fit)} options={[["contain", "Fit"], ["fill", "Fill"], ["center", "Center"]]} disabled={pageSize === "auto"} />
      </div>
      <ActionButton
        label={`Create PDF (${files.length} pages)`}
        icon={<FileImage className="w-4 h-4" />}
        onClick={convert}
        loading={loading}
        disabled={files.length === 0}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-sm disabled:opacity-50"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
