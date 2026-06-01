"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { TOOLS, CATEGORIES, type Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function ToolGrid() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Tool["category"]>("all");
  const router = useRouter();

  const filtered = TOOLS.filter((t) => {
    const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.desc.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || t.category === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 18 tools..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors text-sm"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[{ id: "all", label: "All" }, ...CATEGORIES].map((c) => (
            <motion.button
              key={c.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setCategory(c.id as "all" | Tool["category"])}
              className={cn(
                "px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                category === c.id
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-strong)]"
              )}
            >
              {c.label}
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 text-[var(--text-muted)]"
          >
            No tools match your search
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          >
            {filtered.map((tool, i) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                index={i}
                onClick={() => router.push(`/tool/${tool.id}`)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ToolCard({ tool, index, onClick }: { tool: Tool; index: number; onClick: () => void }) {
  const Icon = tool.icon;
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.03, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative text-left p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at top right, hsl(${tool.color} 70% 55% / 0.12), transparent 70%)`,
        }}
      />
      <div
        className="relative w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 group-hover:rotate-3"
        style={{
          background: `linear-gradient(135deg, hsl(${tool.color} 70% 55% / 0.15), hsl(${tool.color} 70% 55% / 0.05))`,
          border: `1px solid hsl(${tool.color} 70% 55% / 0.2)`,
        }}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: `hsl(${tool.color} 70% 55%)` }}
        />
      </div>
      <h3 className="relative font-semibold text-sm text-[var(--text-primary)] mb-0.5">
        {tool.name}
      </h3>
      <p className="relative text-xs text-[var(--text-secondary)] line-clamp-2">
        {tool.desc}
      </p>
    </motion.button>
  );
}
