// Type declarations are in /types/global.d.ts

// Browser-only PDF.js client wrapper. Must be imported only from 'use client' components.

let pdfjsLib: typeof import("pdfjs-dist") | null = null;
let loadPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function loadPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const lib = await import("pdfjs-dist");
    const workerMod = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")) as unknown;
    let workerUrl: string;
    if (typeof workerMod === "string") {
      workerUrl = workerMod;
    } else if (workerMod && typeof workerMod === "object") {
      const m = workerMod as { default?: unknown };
      const def: unknown = m.default;
      if (typeof def === "string") {
        workerUrl = def;
      } else if (def && typeof def === "object") {
        const d = def as { href?: unknown; toString?: () => string };
        if (typeof d.href === "string") workerUrl = d.href;
        else if (typeof d.toString === "function") workerUrl = d.toString();
        else workerUrl = "";
      } else {
        workerUrl = "";
      }
    } else {
      workerUrl = "";
    }
    if (!workerUrl) {
      // Fall back to a same-origin worker URL via a Blob; pdfjs supports blob: URLs.
      // Also we can disable worker (fake worker) as a last resort.
      // Try to use the public worker location if available.
      workerUrl = new URL("pdf.worker.min.mjs", document.baseURI).toString();
    }
    lib.GlobalWorkerOptions.workerSrc = workerUrl;
    pdfjsLib = lib;
    return lib;
  })();
  return loadPromise;
}

export async function loadDocumentFromFile(file: File) {
  const pdfjs = await loadPdfjs();
  const bytes = await file.arrayBuffer();
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes) });
  return task.promise;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const doc = await loadDocumentFromFile(file);
  return doc.numPages;
}

/** Render each page to a low-res PNG data URL (for thumbnails). */
export async function renderPdfThumbnails(
  file: File,
  maxWidth = 200
): Promise<string[]> {
  const doc = await loadDocumentFromFile(file);
  const urls: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = maxWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    urls.push(canvas.toDataURL("image/png"));
    page.cleanup();
  }
  return urls;
}

/** Render each page to a Blob at given scale/format. */
export async function renderPdfPagesAsBlobs(
  file: File,
  scale = 2,
  format: "png" | "jpeg" = "png",
  quality = 0.92
): Promise<Blob[]> {
  const doc = await loadDocumentFromFile(file);
  const blobs: Blob[] = [];
  const mime = format === "png" ? "image/png" : "image/jpeg";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mime, quality);
    });
    if (blob) blobs.push(blob);
    page.cleanup();
  }
  return blobs;
}

/** Extract all text from the PDF, page by page. */
export async function extractPdfText(
  file: File
): Promise<{ pageNum: number; text: string }[]> {
  const doc = await loadDocumentFromFile(file);
  const results: { pageNum: number; text: string }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    results.push({ pageNum: i, text });
    page.cleanup();
  }
  return results;
}

/** Render a single page to a canvas and return the canvas. */
export async function renderPageToCanvas(
  file: File,
  pageNum: number,
  scale = 1.5
): Promise<HTMLCanvasElement> {
  const doc = await loadDocumentFromFile(file);
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  await page.render({ canvasContext: ctx, viewport }).promise;
  page.cleanup();
  return canvas;
}
