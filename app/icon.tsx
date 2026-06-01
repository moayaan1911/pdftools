import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white",
          fontSize: 18,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          borderRadius: 6,
        }}
      >
        PDF
      </div>
    ),
    { ...size }
  );
}
