import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Parse a page range string like "1-3, 5, 7-9" into a 1-indexed sorted unique array of page numbers.
 * Returns null if the input is invalid.
 */
export function parsePageRange(
  input: string,
  totalPages: number
): number[] | null {
  if (!input.trim()) return null;
  const result = new Set<number>();
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((s) => parseInt(s.trim(), 10));
      if (isNaN(a) || isNaN(b) || a < 1 || b < 1 || a > b) return null;
      const lo = Math.max(1, Math.min(a, totalPages));
      const hi = Math.min(b, totalPages);
      for (let i = lo; i <= hi; i++) result.add(i);
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n) || n < 1 || n > totalPages) return null;
      result.add(n);
    }
  }
  return Array.from(result).sort((a, b) => a - b);
}

function announceDownload(filename: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("pdf-toolkit:download", { detail: { filename } }));
}

export function downloadBlob(blob: BlobPart, filename: string) {
  const safe = blob instanceof Blob ? blob : new Blob([blob as BlobPart]);
  const url = URL.createObjectURL(safe);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
  announceDownload(filename);
}

/** Save pdf-lib Uint8Array output to a downloadable PDF Blob. */
export function downloadPdf(bytes: Uint8Array, filename: string) {
  // Cast through ArrayBuffer to satisfy strict TS lib types
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([ab], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
  announceDownload(filename);
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9.\-_]+/gi, "_");
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
