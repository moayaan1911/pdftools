"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { toast } from "@/lib/toast";
import { loadDocumentFromFile } from "@/lib/pdfjs-client";
import { cn } from "@/lib/utils";

export function ViewerTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [doc, setDoc] = useState<Awaited<ReturnType<typeof loadDocumentFromFile>> | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [fit, setFit] = useState<"width" | "page">("width");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!files[0]) {
      setDoc(null);
      setNumPages(0);
      setPage(1);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const d = await loadDocumentFromFile(files[0]);
        if (cancelled) return;
        setDoc(d);
        setNumPages(d.numPages);
        setPage(1);
      } catch (e) {
        if (!cancelled) toast("Could not open PDF", "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  useEffect(() => {
    if (!doc || !canvasRef.current) return;
    let cancelled = false;
    const taskRef = { current: null as { cancel: () => void } | null };
    (async () => {
      try {
        const p = await doc.getPage(page);
        if (cancelled) return;
        const viewport = p.getViewport({ scale: 1 });
        let s = scale;
        if (fit === "width" && containerRef.current) {
          s = (containerRef.current.clientWidth - 32) / viewport.width;
        } else if (fit === "page" && containerRef.current) {
          const cw = containerRef.current.clientWidth - 32;
          const ch = containerRef.current.clientHeight - 32;
          s = Math.min(cw / viewport.width, ch / viewport.height);
        }
        const v = p.getViewport({ scale: s });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        canvas.width = v.width;
        canvas.height = v.height;
        if (taskRef.current) taskRef.current.cancel();
        const task = p.render({ canvasContext: ctx, viewport: v });
        taskRef.current = task;
        await task.promise;
        p.cleanup();
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => {
      cancelled = true;
      if (taskRef.current) taskRef.current.cancel();
    };
  }, [doc, page, scale, fit]);

  return (
    <div className="space-y-4">
      <DropZone accept="application/pdf" files={files} onChange={setFiles} />
      {doc && (
        <>
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium">
              <input
                type="number"
                value={page}
                onChange={(e) => setPage(Math.max(1, Math.min(numPages, parseInt(e.target.value) || 1)))}
                className="w-12 px-1 py-0.5 text-center bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] outline-none"
              />
              <span className="text-[var(--text-muted)]"> / {numPages}</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(numPages, p + 1))}
              disabled={page === numPages}
              className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-[var(--border)] mx-1" />
            <button onClick={() => setScale((s) => Math.max(0.25, s - 0.25))} className="p-1.5 rounded-md hover:bg-[var(--bg-surface)]">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-[var(--text-muted)] min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(4, s + 0.25))} className="p-1.5 rounded-md hover:bg-[var(--bg-surface)]">
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="flex gap-1 ml-1">
              <button
                onClick={() => setFit("width")}
                className={cn("px-2 py-1 text-xs rounded-md", fit === "width" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--bg-surface)]")}
              >
                Width
              </button>
              <button
                onClick={() => setFit("page")}
                className={cn("px-2 py-1 text-xs rounded-md", fit === "page" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--bg-surface)]")}
              >
                Page
              </button>
            </div>
          </div>
          <div ref={containerRef} className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4 min-h-[60vh] flex items-start justify-center overflow-auto">
            <motion.canvas
              key={`${page}-${scale}-${fit}`}
              ref={canvasRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-full shadow-2xl"
            />
          </div>
        </>
      )}
    </div>
  );
}
