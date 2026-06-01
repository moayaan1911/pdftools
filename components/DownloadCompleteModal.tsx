"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coffee, Heart, ExternalLink } from "lucide-react";
import Link from "next/link";

export function DownloadCompleteModal() {
  const [open, setOpen] = useState(false);
  const [filename, setFilename] = useState("");

  useEffect(() => {
    const onDownload = (e: Event) => {
      const name = (e as CustomEvent).detail?.filename || "your file";
      setFilename(name);
      setOpen(true);
    };
    window.addEventListener("pdf-toolkit:download", onDownload as EventListener);
    return () =>
      window.removeEventListener("pdf-toolkit:download", onDownload as EventListener);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md glass border border-[var(--border)] rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Download ready
              </span>
            </div>
            <h2 className="text-lg font-bold mb-1">Your file is ready</h2>
            <p className="text-xs text-[var(--text-muted)] mb-5 truncate">
              {filename}
            </p>

            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">
              Also check out
            </p>
            <div className="space-y-2 mb-5">
              <a
                href="https://loomless.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/60 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/40 transition-all"
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                  <img
                    src="/loomless-icon.png"
                    alt="LoomLess"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm">LoomLess</span>
                    <ExternalLink className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    Free and local screen recording studio
                  </p>
                </div>
              </a>

              <a
                href="https://imanvibes.app"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/60 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/40 transition-all"
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                  <img
                    src="/imanvibes-icon.png"
                    alt="ImanVibes"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm">ImanVibes</span>
                    <ExternalLink className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    Quranic comfort for every mood
                  </p>
                </div>
              </a>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <Heart className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-xs text-[var(--text-secondary)] flex-1">
                Support 18PDF, built by a solo dev
              </p>
              <a
                href="https://moayaan.com/support"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
              >
                <Coffee className="w-3 h-3" />
                Tip
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
