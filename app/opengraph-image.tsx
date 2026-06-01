import { ImageResponse } from "next/og";
import { TOOLS } from "@/lib/tools";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "PDF Toolkit: 18 free browser PDF tools";

export const runtime = "nodejs";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
          color: "white",
          padding: 80,
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 600,
            opacity: 0.9,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "white",
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            PDF
          </div>
          PDF Toolkit
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 80,
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            All your PDF tools
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              opacity: 0.9,
            }}
          >
            in one place.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 60,
            fontSize: 32,
            fontWeight: 500,
            opacity: 0.95,
          }}
        >
          18 free tools. Zero server. 100% private.
        </div>

        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: 80,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 22,
            fontWeight: 500,
            background: "rgba(255,255,255,0.15)",
            padding: "12px 24px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          pdftoolkit.app
        </div>
      </div>
    ),
    { ...size }
  );
}
