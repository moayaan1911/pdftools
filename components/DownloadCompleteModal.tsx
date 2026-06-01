"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { X, Coffee, Heart, ExternalLink, Check } from "lucide-react";

export function DownloadCompleteModal() {
  const [open, setOpen] = useState(false);
  const [filename, setFilename] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 180, damping: 16 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 180, damping: 16 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

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
            ref={cardRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md"
          >
            <div className="relative rounded-2xl glass border border-[var(--border)] shadow-2xl overflow-hidden">
              {/* gradient accent strip top */}
              <div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500"
                aria-hidden
              />

              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6">
                {/* success checkmark with stroke draw-on */}
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 14 }}
                    className="relative w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <motion.path
                        d="M5 12.5l4 4L19 7"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
                      />
                    </svg>
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{ boxShadow: ["0 0 0 0 rgba(16, 185, 129, 0.4)", "0 0 0 12px rgba(16, 185, 129, 0)"] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                    />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      Download ready
                    </p>
                    <h2 className="text-base font-bold leading-tight">Your file is ready</h2>
                  </div>
                </div>

                {/* filename ticker */}
                <div className="mb-5 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] overflow-hidden">
                  <p className="text-[11px] text-[var(--text-muted)] mb-0.5">Filename</p>
                  <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-xs font-mono text-[var(--text-primary)] truncate"
                  >
                    {filename}
                  </motion.p>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2.5 flex items-center gap-2">
                  <span>Also check out</span>
                  <span className="flex-1 h-px bg-gradient-to-r from-[var(--border)] to-transparent" />
                </p>

                <div className="space-y-2 mb-5">
                  {[
                    {
                      name: "LoomLess",
                      url: "https://loomless.fun",
                      desc: "Free and local screen recording studio",
                      icon: "/loomless-icon.png",
                      hue: 265,
                      delay: 0.4,
                    },
                    {
                      name: "ImanVibes",
                      url: "https://imanvibes.vercel.app",
                      desc: "Quranic comfort for every mood",
                      icon: "/imanvibes-icon.png",
                      hue: 155,
                      delay: 0.5,
                    },
                  ].map((app) => (
                    <motion.a
                      key={app.name}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: app.delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ x: 4, transition: { duration: 0.15 } }}
                      className="group relative flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/60 hover:border-[var(--accent)] transition-colors overflow-hidden"
                    >
                      {/* hue-matched subtle gradient overlay on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: `linear-gradient(135deg, hsl(${app.hue} 70% 60% / 0.08), transparent 70%)`,
                        }}
                        aria-hidden
                      />
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white ring-1 ring-[var(--border)]">
                        <img
                          src={app.icon}
                          alt={app.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">
                            {app.name}
                          </span>
                          <ExternalLink className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {app.desc}
                        </p>
                      </div>
                      <div className="relative w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] group-hover:bg-[var(--accent)] transition-colors" />
                    </motion.a>
                  ))}
                </div>

                {/* shimmer tip strip */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="relative flex items-center gap-2.5 p-3 rounded-xl border border-amber-500/30 overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(110deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.18) 50%, rgba(245, 158, 11, 0.08) 100%)",
                    backgroundSize: "200% 100%",
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{
                      background:
                        "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
                      backgroundSize: "200% 100%",
                    }}
                    aria-hidden
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.5 }}
                    className="relative flex-shrink-0"
                  >
                    <Heart className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                  </motion.div>
                  <p className="relative text-xs text-[var(--text-primary)] flex-1 font-medium">
                    Support 18PDF, built by a solo dev
                  </p>
                  <a
                    href="https://moayaan.com/support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Coffee className="w-3 h-3" />
                    Tip
                  </a>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
