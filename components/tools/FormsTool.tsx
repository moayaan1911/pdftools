"use client";

import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { ClipboardList } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { ActionButton } from "@/components/ActionButton";
import { downloadPdf, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface FormField {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "radio" | "button" | "unknown";
  options?: string[];
  value: string;
}

export function FormsTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!files[0]) return setFields([]);
    let cancelled = false;
    (async () => {
      try {
        const bytes = await files[0].arrayBuffer();
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const form = doc.getForm();
        const detected: FormField[] = [];
        const tryGet = (name: string, type: FormField["type"]) => {
          try {
            if (type === "text") {
              const f = form.getTextField(name);
              detected.push({ name, type, value: f.getText() || "" });
            } else if (type === "checkbox") {
              const f = form.getCheckBox(name);
              detected.push({ name, type, value: f.isChecked() ? "true" : "false" });
            } else if (type === "dropdown") {
              const f = form.getDropdown(name);
              detected.push({ name, type, options: f.getOptions(), value: f.getSelected()?.[0] || "" });
            } else if (type === "radio") {
              const f = form.getRadioGroup(name);
              detected.push({ name, type, options: f.getOptions(), value: f.getSelected() || "" });
            }
          } catch {
            // field doesn't exist as this type
          }
        };
        const allNames = new Set<string>();
        try {
          form.getFields().forEach((f) => allNames.add(f.getName()));
        } catch {}
        for (const name of allNames) {
          for (const type of ["text", "checkbox", "dropdown", "radio"] as FormField["type"][]) {
            tryGet(name, type);
            if (detected.find((f) => f.name === name)) break;
          }
        }
        if (!cancelled) setFields(detected);
        if (!cancelled && detected.length === 0) toast("No form fields found", "info");
      } catch (e) {
        if (!cancelled) toast("Could not read form", "error");
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
      const form = doc.getForm();
      for (const f of fields) {
        try {
          if (f.type === "text") form.getTextField(f.name).setText(f.value);
          else if (f.type === "checkbox") {
            const cb = form.getCheckBox(f.name);
            if (f.value === "true") cb.check();
            else cb.uncheck();
          } else if (f.type === "dropdown") form.getDropdown(f.name).select(f.value);
          else if (f.type === "radio" && f.value) form.getRadioGroup(f.name).select(f.value);
        } catch {
          // skip
        }
      }
      const out = await doc.save();
      const base = sanitizeFilename(files[0].name.replace(/\.pdf$/i, ""));
      downloadPdf(out, `${base}-filled.pdf`);
      toast("Form filled", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <DropZone accept="application/pdf" files={files} onChange={setFiles} />
      {fields.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--text-muted)]">{fields.length} field{fields.length !== 1 ? "s" : ""} detected</p>
          {fields.map((f, i) => (
            <div key={`${f.name}-${i}`}>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                <span className="text-[var(--text-muted)]">[{f.type}]</span> {f.name}
              </label>
              {f.type === "text" && (
                <input
                  value={f.value}
                  onChange={(e) => setFields((arr) => arr.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm"
                />
              )}
              {f.type === "checkbox" && (
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={f.value === "true"}
                    onChange={(e) => setFields((arr) => arr.map((x, idx) => idx === i ? { ...x, value: e.target.checked ? "true" : "false" } : x))}
                  />
                  <span className="text-sm">Checked</span>
                </label>
              )}
              {(f.type === "dropdown" || f.type === "radio") && (
                <select
                  value={f.value}
                  onChange={(e) => setFields((arr) => arr.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))}
                  className="w-full px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm"
                >
                  <option value="">--</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
      <ActionButton
        label="Fill & download"
        icon={<ClipboardList className="w-4 h-4" />}
        onClick={apply}
        loading={loading}
        disabled={!files[0] || fields.length === 0}
      />
    </div>
  );
}
