"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GitCompareArrows, ChevronLeft, ChevronRight } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { toast } from "@/lib/toast";
import { loadDocumentFromFile } from "@/lib/pdfjs-client";

export function CompareTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [docA, setDocA] = useState<Awaited<ReturnType<typeof loadDocumentFromFile>> | null>(null);
  const [docB, setDocB] = useState<Awaited<ReturnType<typeof loadDocumentFromFile>> | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale] = useState(1.2);
  const aRef = useRef<HTMLCanvasElement>(null);
  const bRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (files.length < 2) {
      setDocA(null);
      setDocB(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [a, b] = await Promise.all([loadDocumentFromFile(files[0]), loadDocumentFromFile(files[1])]);
        if (cancelled) return;
        setDocA(a);
        setDocB(b);
        setNumPages(Math.max(a.numPages, b.numPages));
        setPage(1);
      } catch (e) {
        if (!cancelled) toast("Could not open PDFs", "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  useEffect(() => {
    if (!docA || !docB) return;
    let cancelled = false;
    (async () => {
      try {
        const [pa, pb] = await Promise.all([
          page <= docA.numPages ? docA.getPage(page) : null,
          page <= docB.numPages ? docB.getPage(page) : null,
        ]);
        if (cancelled) return;
        for (const [doc, canvas, pageObj] of [
          [docA, aRef.current, pa],
          [docB, bRef.current, pb],
        ] as const) {
          if (!canvas || !pageObj) continue;
          const v = pageObj.getViewport({ scale });
          canvas.width = v.width;
          canvas.height = v.height;
          await pageObj.render({ canvasContext: canvas.getContext("2d")!, viewport: v }).promise;
          pageObj.cleanup();
        }
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [docA, docB, page, scale]);

  return (
    <div className="space-y-4">
      <DropZone accept="application/pdf" multiple files={files} onChange={(f) => setFiles(f.slice(0, 2))} hint="Drop 2 PDFs to compare" />
      {docA && docB && (
        <>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium">
              Page {page} of {numPages}
            </span>
            <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page === numPages} className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-2">
              <p className="text-xs font-medium text-[var(--text-muted)] px-2 py-1">A: {files[0]?.name}</p>
              <div className="overflow-auto max-h-[70vh]">
                <canvas ref={aRef} className="max-w-full mx-auto" />
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-2">
              <p className="text-xs font-medium text-[var(--text-muted)] px-2 py-1">B: {files[1]?.name}</p>
              <div className="overflow-auto max-h-[70vh]">
                <canvas ref={bRef} className="max-w-full mx-auto" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
