import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist and other browser-only libs are loaded via dynamic import in 'use client' components.
  // No webpack config needed — Turbopack handles the bundling.
};

export default nextConfig;
