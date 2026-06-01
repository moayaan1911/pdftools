"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
}

export function ActionButton({
  label,
  onClick,
  loading,
  disabled,
  icon,
  variant = "primary",
}: Props) {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary"
          ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg hover:shadow-xl"
          : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
      )}
    >
      {variant === "primary" && !disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}
      <span className="relative inline-flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          icon
        )}
        {loading ? "Working..." : label}
      </span>
    </motion.button>
  );
}
