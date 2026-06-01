"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Combine, GripVertical, FileText } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadPdf, formatBytes, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";

export function MergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const merge = async () => {
    if (files.length < 2) {
      toast("Add at least 2 PDFs to merge", "warning");
      return;
    }
    setLoading(true);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const out = await merged.save();
      downloadPdf(out, `merged-${Date.now()}.pdf`);
      toast(`Merged ${files.length} PDFs`, "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Merge failed";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <DropZone
        accept="application/pdf"
        multiple
        files={files}
        onChange={setFiles}
        hint="Add multiple PDFs, then drag to reorder"
      />
      {files.length >= 2 && (
        <div className="space-y-1.5">
          <p className="text-xs text-[var(--text-muted)] mb-2">Drag to reorder</p>
          <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-1.5">
            {files.map((f, i) => (
              <Reorder.Item
                key={`${f.name}-${i}`}
                value={f}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] cursor-grab active:cursor-grabbing"
                whileDrag={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
              >
                <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-muted)] w-6">{i + 1}.</span>
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatBytes(f.size)}</p>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}
      <ActionButton
        label={`Merge ${files.length} ${files.length === 1 ? "file" : "files"}`}
        icon={<Combine className="w-4 h-4" />}
        onClick={merge}
        loading={loading}
        disabled={files.length < 2}
      />
    </div>
  );
}
