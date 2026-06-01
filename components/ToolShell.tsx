"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import type { Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

interface Props {
  tool: Tool;
  children: ReactNode;
}

export function ToolShell({ tool, children }: Props) {
  const Icon = tool.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>All tools</span>
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${tool.color} 70% 55% / 0.2), hsl(${tool.color} 70% 55% / 0.05))`,
            border: `1px solid hsl(${tool.color} 70% 55% / 0.3)`,
          }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: `hsl(${tool.color} 70% 55%)` }}
          />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {tool.name}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{tool.desc}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 sm:p-7">
        {children}
      </div>
    </motion.div>
  );
}
