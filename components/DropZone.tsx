"use client";

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

interface Props {
  accept?: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  hint?: string;
}

export function DropZone({
  accept = "application/pdf",
  multiple = false,
  files,
  onChange,
  hint,
}: Props) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const arr = Array.from(list);
      onChange(multiple ? [...files, ...arr] : arr.slice(0, 1));
    },
    [files, multiple, onChange]
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  const remove = (i: number) => {
    onChange(files.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-3">
      <motion.div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        animate={{ scale: drag ? 1.01 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
          drag
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-[var(--border-strong)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)]"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
          className="hidden"
        />
        <motion.div
          animate={{ y: drag ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="inline-flex w-12 h-12 rounded-xl bg-[var(--accent-soft)] items-center justify-center mb-3"
        >
          <Upload className="w-5 h-5 text-[var(--accent)]" />
        </motion.div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {drag ? "Drop files here" : "Drop files or click to browse"}
        </p>
        {hint && <p className="text-xs text-[var(--text-muted)] mt-1">{hint}</p>}
      </motion.div>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <motion.div
              key={`${f.name}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] group"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{formatBytes(f.size)}</p>
              </div>
              <button
                onClick={() => remove(i)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
