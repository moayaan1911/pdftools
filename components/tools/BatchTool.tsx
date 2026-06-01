"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { Zap, FileText } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadBlob, sanitizeFilename, cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import JSZip from "jszip";

const OPS = [
  { id: "rotate", label: "Rotate 90° clockwise", fn: rotate },
  { id: "numbers", label: "Add page numbers (bottom center)", fn: addNumbers },
] as const;

async function rotate(bytes: ArrayBuffer): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  doc.getPages().forEach((p) => p.setRotation(degrees((p.getRotation().angle + 90) % 360)));
  return doc.save();
}

async function addNumbers(bytes: ArrayBuffer): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.getPages().forEach((page, i) => {
    const { width } = page.getSize();
    const text = `Page ${i + 1}`;
    const w = font.widthOfTextAtSize(text, 12);
    page.drawText(text, { x: (width - w) / 2, y: 30, size: 12, font, color: rgb(0, 0, 0) });
  });
  return doc.save();
}

export function BatchTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [op, setOp] = useState<typeof OPS[number]["id"]>("rotate");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const run = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setProgress({ done: 0, total: files.length });
    try {
      const zip = new JSZip();
      const fn = OPS.find((o) => o.id === op)!.fn;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const bytes = await f.arrayBuffer();
        const out = await fn(bytes);
        const base = sanitizeFilename(f.name.replace(/\.pdf$/i, ""));
        zip.file(`${base}-${op}.pdf`, out);
        setProgress({ done: i + 1, total: files.length });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `batch-${op}-${Date.now()}.zip`);
      toast(`Processed ${files.length} files`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <DropZone accept="application/pdf" multiple files={files} onChange={setFiles} />
      {files.length > 0 && (
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Operation</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OPS.map((o) => (
              <button
                key={o.id}
                onClick={() => setOp(o.id)}
                className={cn(
                  "p-3 rounded-xl text-sm font-medium border text-left transition-colors",
                  op === o.id
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                    : "bg-[var(--bg-elevated)] border-[var(--border)]"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>Processing...</span>
            <span>{progress.done} / {progress.total}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      <ActionButton
        label={`Process ${files.length} file${files.length === 1 ? "" : "s"}`}
        icon={<Zap className="w-4 h-4" />}
        onClick={run}
        loading={loading}
        disabled={files.length === 0}
      />
    </div>
  );
}
