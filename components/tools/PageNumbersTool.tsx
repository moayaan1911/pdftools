"use client";

import { useState, useEffect } from "react";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { Hash } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadPdf, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { getPdfPageCount } from "@/lib/pdfjs-client";

type Position =
  | "bottom-center" | "bottom-right" | "bottom-left"
  | "top-center" | "top-right" | "top-left";
type Format = "1" | "Page 1" | "1 / N" | "-1-";

const POSITIONS: { id: Position; label: string }[] = [
  { id: "bottom-center", label: "Bottom C" },
  { id: "bottom-left", label: "Bottom L" },
  { id: "bottom-right", label: "Bottom R" },
  { id: "top-center", label: "Top C" },
  { id: "top-left", label: "Top L" },
  { id: "top-right", label: "Top R" },
];

export function PageNumbersTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [format, setFormat] = useState<Format>("Page 1");
  const [startAt, setStartAt] = useState(1);
  const [fontSize, setFontSize] = useState(12);
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
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();

      pages.forEach((page, i) => {
        const num = i + startAt;
        const text = format.replace("1", String(num)).replace("N", String(pages.length));
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        let x = (width - textWidth) / 2;
        let y = 30;
        if (position.endsWith("right")) x = width - textWidth - 30;
        if (position.endsWith("left")) x = 30;
        if (position.startsWith("top")) y = height - 40;
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });

      const out = await doc.save();
      const base = sanitizeFilename(files[0].name.replace(/\.pdf$/i, ""));
      downloadPdf(out, `${base}-numbered.pdf`);
      toast("Page numbers added", "success");
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
        <p className="text-xs text-[var(--text-muted)]">
          {totalPages} page{totalPages !== 1 ? "s" : ""} detected
        </p>
      )}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Position</label>
        <div className="grid grid-cols-3 gap-1.5">
          {POSITIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPosition(p.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                position === p.id
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                  : "bg-[var(--bg-elevated)] border-[var(--border)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as Format)} className="w-full px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm">
            {(["1", "Page 1", "1 / N", "-1-"] as Format[]).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Start at</label>
          <input
            type="number"
            min="0"
            value={startAt}
            onChange={(e) => setStartAt(parseInt(e.target.value) || 0)}
            className="w-full px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Font size</label>
          <input
            type="number"
            min="6"
            max="48"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
            className="w-full px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm"
          />
        </div>
      </div>
      <ActionButton
        label="Apply & download"
        icon={<Hash className="w-4 h-4" />}
        onClick={apply}
        loading={loading}
        disabled={!files[0]}
      />
    </div>
  );
}
