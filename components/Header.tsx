"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Palette, Coffee } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const ACCENTS = [
  { id: "blue", hue: 220, label: "Blue" },
  { id: "violet", hue: 265, label: "Violet" },
  { id: "emerald", hue: 155, label: "Emerald" },
  { id: "rose", hue: 340, label: "Rose" },
  { id: "amber", hue: 35, label: "Amber" },
  { id: "cyan", hue: 185, label: "Cyan" },
  { id: "coral", hue: 12, label: "Coral" },
  { id: "lime", hue: 88, label: "Lime" },
];

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [accent, setAccent] = useState("blue");
  const [showPicker, setShowPicker] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("pdf-toolkit-accent") || "blue";
    setAccent(saved);
    document.documentElement.classList.add(`accent-${saved}`);
  }, []);

  const changeAccent = (id: string) => {
    ACCENTS.forEach((a) => document.documentElement.classList.remove(`accent-${a.id}`));
    document.documentElement.classList.add(`accent-${id}`);
    setAccent(id);
    localStorage.setItem("pdf-toolkit-accent", id);
    setShowPicker(false);
  };

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 glass border-b border-[var(--border)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <motion.a
          href="/"
          className="flex items-center gap-3 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[hsl(calc(var(--accent-h)+40)_var(--accent-s)_var(--accent-l))] flex items-center justify-center shadow-lg glow">
            <span className="text-white font-bold text-[15px] tracking-tight">18PDF</span>
            <motion.div
              className="absolute inset-0 rounded-xl"
              animate={{ boxShadow: ["0 0 0 0 var(--accent-glow)", "0 0 20px 4px var(--accent-glow)", "0 0 0 0 var(--accent-glow)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <span className="font-semibold text-lg hidden sm:block">
            <span className="text-gradient">18</span>
            <span className="text-[var(--text-primary)]">PDF</span>
          </span>
        </motion.a>

        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex items-center gap-1 mr-1 pr-2 border-r border-[var(--border)]">
            <Link
              href="/faq"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/privacy-policy"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            >
              Privacy
            </Link>
          </div>

          <motion.a
            href="https://moayaan.com/support"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-amber-500/10 transition-colors group"
            aria-label="Buy me a coffee"
            title="Buy me a coffee"
          >
            <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </motion.a>

          <motion.a
            href="https://github.com/moayaan1911/pdftools"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="GitHub repository"
            title="GitHub"
          >
            <GitHubIcon className="w-4 h-4 text-[var(--text-secondary)]" />
          </motion.a>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPicker((s) => !s)}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label="Change accent color"
            >
              <Palette className="w-4 h-4 text-[var(--text-secondary)]" />
            </motion.button>
            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 glass rounded-xl p-2 flex gap-1.5 shadow-xl"
                >
                  {ACCENTS.map((a) => (
                    <motion.button
                      key={a.id}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => changeAccent(a.id)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all",
                        accent === a.id && "ring-2 ring-offset-2 ring-offset-[var(--bg-surface)] ring-[var(--accent)]"
                      )}
                      style={{ background: `hsl(${a.hue} 70% 55%)` }}
                      aria-label={a.label}
                      title={a.label}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Toggle dark mode"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-4 h-4 text-[var(--text-secondary)]" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-4 h-4 text-[var(--text-secondary)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
