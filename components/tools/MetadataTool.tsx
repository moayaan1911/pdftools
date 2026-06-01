"use client";

import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { Info } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadPdf, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { loadDocumentFromFile } from "@/lib/pdfjs-client";

export function MetadataTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [meta, setMeta] = useState({
    title: "",
    author: "",
    subject: "",
    keywords: "",
    creator: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!files[0]) return;
    let cancelled = false;
    (async () => {
      try {
        const doc = await loadDocumentFromFile(files[0]);
        if (cancelled) return;
        const info = await doc.getMetadata();
        const m = info.info as Record<string, unknown>;
        setMeta({
          title: (m.Title as string) || "",
          author: (m.Author as string) || "",
          subject: (m.Subject as string) || "",
          keywords: (m.Keywords as string) || "",
          creator: (m.Creator as string) || "",
        });
      } catch (e) {
        if (!cancelled) toast("Could not read metadata", "error");
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
      if (meta.title) doc.setTitle(meta.title);
      if (meta.author) doc.setAuthor(meta.author);
      if (meta.subject) doc.setSubject(meta.subject);
      if (meta.keywords) doc.setKeywords(meta.keywords.split(",").map((s) => s.trim()));
      if (meta.creator) doc.setCreator(meta.creator);
      const out = await doc.save();
      const base = sanitizeFilename(files[0].name.replace(/\.pdf$/i, ""));
      downloadPdf(out, `${base}-metadata.pdf`);
      toast("Metadata updated", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <DropZone accept="application/pdf" files={files} onChange={setFiles} />
      <div className="grid sm:grid-cols-2 gap-3">
        {([
          ["title", "Title"],
          ["author", "Author"],
          ["subject", "Subject"],
          ["keywords", "Keywords (comma separated)"],
          ["creator", "Creator"],
        ] as const).map(([key, label]) => (
          <div key={key}>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">{label}</label>
            <input
              value={meta[key]}
              onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-sm"
            />
          </div>
        ))}
      </div>
      <ActionButton
        label="Save & download"
        icon={<Info className="w-4 h-4" />}
        onClick={apply}
        loading={loading}
        disabled={!files[0]}
      />
    </div>
  );
}
