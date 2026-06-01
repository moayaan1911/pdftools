"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState, type MouseEvent } from "react";
import { Lock, Zap, FileText, Upload, ArrowRight, FileCheck2 } from "lucide-react";
import { ToolGrid } from "@/components/ToolGrid";

export default function Home() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 14 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 14 });
  const glowX = useTransform(mx, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(my, [-0.5, 0.5], ["0%", "100%"]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-12 sm:mb-16"
      >
        {/* animated mesh backdrop */}
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-hero opacity-90" />
          <motion.div
            aria-hidden
            className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(var(--accent-h) var(--accent-s) var(--accent-l) / 0.45), transparent 60%)" }}
            animate={{ x: [0, 60, -20, 0], y: [0, 40, -30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="absolute -bottom-24 -right-20 w-[460px] h-[460px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(calc(var(--accent-h) + 200) 70% 60% / 0.35), transparent 60%)" }}
            animate={{ x: [0, -50, 30, 0], y: [0, -30, 50, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center px-2 sm:px-6 py-10 sm:py-16">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass border border-[var(--border)] text-xs font-medium mb-5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]" />
              </span>
              <span className="text-[var(--text-secondary)]">18 tools · Zero server · 100% private</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05]">
              All your <span className="text-gradient">PDF tools</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>in one place.
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0 leading-relaxed mb-7">
              Free online PDF tools that run in your browser. Merge, split, rotate,
              convert, edit, watermark, OCR, and more. 18 tools, zero server,
              100% private. No signup, no upload, no limits.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-2"
            >
              {[
                { Icon: Lock, label: "100% client-side" },
                { Icon: Zap, label: "Lightning fast" },
                { Icon: FileText, label: "No file size limit" },
              ].map(({ Icon, label }, i) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-surface)]/60 backdrop-blur border border-[var(--border)] text-[var(--text-secondary)]"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <Icon className="w-3.5 h-3.5 text-[var(--accent)]" />
                  {label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: floating drop-card with 3D tilt + cursor-tracked glow */}
          <div className="flex justify-center lg:justify-end" onMouseMove={onMove} onMouseLeave={onLeave}>
            <motion.div
              ref={cardRef}
              style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm"
            >
              <Link
                href="/tool/merge"
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); }}
                className="group block relative rounded-2xl glass border border-[var(--border)] p-6 overflow-hidden"
              >
                {/* cursor-tracked glow */}
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen"
                  style={{
                    background: useTransform(
                      [glowX, glowY] as any,
                      ([x, y]: any) => `radial-gradient(220px circle at ${x} ${y}, hsl(var(--accent-h) var(--accent-s) var(--accent-l) / 0.35), transparent 60%)`
                    ),
                  }}
                />

                <div className="relative flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center font-bold text-sm shadow-lg">
                    PDF
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                <div
                  className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                    dragging
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] scale-[1.02]"
                      : "border-[var(--border-strong)] group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-soft)]/40"
                  }`}
                >
                  <motion.div
                    animate={dragging ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="mx-auto w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center mb-3"
                  >
                    {dragging ? (
                      <FileCheck2 className="w-5 h-5 text-[var(--accent)]" />
                    ) : (
                      <Upload className="w-5 h-5 text-[var(--accent)]" />
                    )}
                  </motion.div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {dragging ? "Drop it like it's hot" : "Drop a PDF to start"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    or pick from 18 tools below
                  </p>
                </div>

                <div className="relative mt-5 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Try the most popular</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] group-hover:gap-2 transition-all">
                    Merge PDFs <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* file rows decoration */}
                <div className="relative mt-5 space-y-1.5 opacity-50">
                  {[100, 86, 70].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-5 rounded-sm bg-[var(--accent)]/30" />
                      <div className="h-1.5 rounded-full bg-[var(--border-strong)]" style={{ width: `${w}%` }} />
                    </div>
                  ))}
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <ToolGrid />
    </div>
  );
}
