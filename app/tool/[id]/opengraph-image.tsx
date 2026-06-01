import { ImageResponse } from "next/og";
import { TOOLS } from "@/lib/tools";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function ToolOgImage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#6366f1",
            color: "white",
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          Tool not found
        </div>
      ),
      { ...size }
    );
  }

  const baseHue = parseInt(tool.color, 10) || 220;
  const accentHue = (baseHue + 40) % 360;
  const grad1 = `hsl(${baseHue} 70% 55%)`;
  const grad2 = `hsl(${accentHue} 70% 60%)`;
  const accentText = `hsl(${baseHue} 70% 45%)`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${grad1}, ${grad2})`,
          color: "white",
          padding: 80,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 24, fontWeight: 600 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "white",
              color: accentText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            18PDF
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 100 }}>
          <div style={{ fontSize: 72, fontWeight: 800 }}>
            {tool.name}
          </div>
          <div style={{ fontSize: 32, fontWeight: 500, marginTop: 16, width: 900 }}>
            {tool.desc}
          </div>
        </div>

        <div style={{ marginTop: 100, fontSize: 22, fontWeight: 500 }}>
          Free, fast, 100% private. Runs in your browser.
        </div>
      </div>
    ),
    { ...size }
  );
}
