"use client";

import { useState, useRef, useEffect } from "react";
import { Code2, Download, Upload } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { downloadBlob, cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const TEMPLATES = {
  invoice: `<h1>INVOICE</h1>
<p><strong>Invoice #:</strong> 001<br><strong>Date:</strong> 2026-06-01</p>
<h2>Bill To</h2>
<p>Customer Name<br>123 Main St<br>City, Country</p>
<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
  <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
  <tr><td>Service A</td><td>2</td><td>$100</td></tr>
  <tr><td>Service B</td><td>1</td><td>$50</td></tr>
</table>
<h3>Total: $250</h3>`,
  report: `<h1>Quarterly Report</h1>
<p><em>Q2 2026</em></p>
<h2>Summary</h2>
<p>This quarter we shipped 18 new tools and improved performance by 40%.</p>
<h2>Highlights</h2>
<ul>
  <li>Launched the 18PDF</li>
  <li>Migrated to Next.js 16</li>
  <li>Reached 10K monthly users</li>
</ul>
<h2>Next Quarter</h2>
<p>Focus on mobile and offline support.</p>`,
  letter: `<p style="text-align:right">2026-06-01</p>
<p>Dear Recipient,</p>
<p>I am writing to inform you of recent developments...</p>
<p>Sincerely,<br>Your Name</p>`,
};

export function HtmlToPdfTool() {
  const [html, setHtml] = useState(TEMPLATES.invoice);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "legal">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [loading, setLoading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) {
      toast("Please upload an .html or .htm file", "error");
      e.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      setHtml(text);
      toast(`Loaded ${file.name}`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not read file", "error");
    } finally {
      e.target.value = "";
    }
  };

  const convert = async () => {
    if (!previewRef.current) return;
    setLoading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 10,
          filename: `doc-${Date.now()}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: pageSize, orientation },
        })
        .from(previewRef.current)
        .save();
      toast("PDF downloaded", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {Object.keys(TEMPLATES).map((k) => (
          <button
            key={k}
            onClick={() => setHtml(TEMPLATES[k as keyof typeof TEMPLATES])}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors capitalize"
          >
            {k}
          </button>
        ))}
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,text/html"
          onChange={handleFile}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors inline-flex items-center gap-1.5"
          title="Upload an .html file"
        >
          <Upload className="w-3 h-3" />
          Upload .html
        </button>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">HTML source</label>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="w-full h-80 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-xs font-mono resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Preview</label>
          <div
            ref={previewRef}
            className="h-80 p-4 rounded-xl bg-white text-black text-xs overflow-auto prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Page size</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as "a4" | "letter" | "legal")}
            className="px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm"
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="legal">Legal</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Orientation</label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
            className="px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
      </div>
      <ActionButton
        label="Generate PDF"
        icon={<Download className="w-4 h-4" />}
        onClick={convert}
        loading={loading}
      />
    </div>
  );
}
