"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Scissors } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadBlob, formatBytes, parsePageRange, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";
import JSZip from "jszip";

export function SplitTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [range, setRange] = useState("");
  const [mode, setMode] = useState<"ranges" | "all">("ranges");
  const [loading, setLoading] = useState(false);

  const split = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = src.getPageCount();
      const zip = new JSZip();

      if (mode === "all") {
        for (let i = 0; i < total; i++) {
          const dst = await PDFDocument.create();
          const [page] = await dst.copyPages(src, [i]);
          dst.addPage(page);
          const out = await dst.save();
          zip.file(`page-${String(i + 1).padStart(3, "0")}.pdf`, out);
        }
      } else {
        const pages = parsePageRange(range, total);
        if (!pages || pages.length === 0) {
          toast("Invalid range  -  try 1-3, 5, 7-9", "error");
          setLoading(false);
          return;
        }
        // Group consecutive pages into single PDFs
        const groups: number[][] = [];
        let current: number[] = [pages[0]];
        for (let i = 1; i < pages.length; i++) {
          if (pages[i] === pages[i - 1] + 1) current.push(pages[i]);
          else {
            groups.push(current);
            current = [pages[i]];
          }
        }
        groups.push(current);

        for (const group of groups) {
          const dst = await PDFDocument.create();
          const copied = await dst.copyPages(
            src,
            group.map((p) => p - 1)
          );
          copied.forEach((p) => dst.addPage(p));
          const out = await dst.save();
          const label = group.length === 1
            ? `page-${group[0]}.pdf`
            : `pages-${group[0]}-${group[group.length - 1]}.pdf`;
          zip.file(label, out);
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const base = sanitizeFilename(file.name.replace(/\.pdf$/i, ""));
      downloadBlob(blob, `${base}-split.zip`);
      toast(`Split into ${Object.keys(zip.files).length} files`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Split failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <DropZone accept="application/pdf" files={files} onChange={setFiles} />
      <div className="grid grid-cols-2 gap-2">
        {(["ranges", "all"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`p-3 rounded-xl text-sm font-medium border transition-all ${
              mode === m
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                : "bg-[var(--bg-elevated)] border-[var(--border)] hover:border-[var(--border-strong)]"
            }`}
          >
            {m === "ranges" ? "By range" : "Every page"}
          </button>
        ))}
      </div>
      {mode === "ranges" && (
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
            Page range
          </label>
          <input
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="e.g. 1-3, 5, 7-9"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-sm transition-colors"
          />
        </div>
      )}
      <ActionButton
        label="Split & download ZIP"
        icon={<Scissors className="w-4 h-4" />}
        onClick={split}
        loading={loading}
        disabled={!files[0] || (mode === "ranges" && !range.trim())}
      />
    </div>
  );
}
