"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToasts } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  info: "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--text-primary)]",
};

export function Toaster() {
  const toasts = useToasts();

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={cn(
                "pointer-events-auto glass rounded-xl px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-md border shadow-xl",
                STYLES[t.type]
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium flex-1">{t.message}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
