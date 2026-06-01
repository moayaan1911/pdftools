"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanText, Loader2, Download } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadBlob, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { getPdfPageCount, renderPageToCanvas } from "@/lib/pdfjs-client";

export function OcrTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState({ page: 0, total: 0, status: "" });
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    setText("");
    try {
      const total = await getPdfPageCount(files[0]);
      setProgress({ page: 0, total, status: "Loading OCR engine..." });

      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          setProgress((p) => ({ ...p, status: m.status, page: p.page }));
        },
      });

      let allText = "";
      for (let i = 1; i <= total; i++) {
        setProgress({ page: i, total, status: `Recognizing page ${i}...` });
        const canvas = await renderPageToCanvas(files[0], i, 2);
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob((b) => r(b), "image/png"));
        if (!blob) continue;
        const { data } = await worker.recognize(blob);
        allText += `--- Page ${i} ---\n${data.text}\n\n`;
        setText(allText);
      }
      await worker.terminate();
      toast("OCR complete", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "OCR failed", "error");
    } finally {
      setLoading(false);
      setProgress({ page: 0, total: 0, status: "" });
    }
  };

  const download = () => {
    if (!files[0]) return;
    const base = sanitizeFilename(files[0].name.replace(/\.pdf$/i, ""));
    downloadBlob(new Blob([text], { type: "text/plain" }), `${base}-ocr.txt`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-300">
        ⚠️ OCR downloads ~15MB of language data on first use. Subsequent runs are cached.
      </div>
      <DropZone accept="application/pdf" files={files} onChange={setFiles} />
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]"
          >
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
              <span>{progress.status}</span>
            </div>
            {progress.total > 0 && (
              <>
                <div className="h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] transition-all"
                    style={{ width: `${(progress.page / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)] text-center">
                  Page {progress.page} of {progress.total}
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {text && !loading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[var(--text-muted)]">{text.split("\n").length} lines recognized</p>
            <button onClick={download} className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1">
              <Download className="w-3 h-3" /> Download .txt
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono whitespace-pre-wrap max-h-96 overflow-auto">
            {text}
          </pre>
        </div>
      )}
      <ActionButton
        label="Recognize text"
        icon={<ScanText className="w-4 h-4" />}
        onClick={run}
        loading={loading}
        disabled={!files[0]}
      />
    </div>
  );
}
