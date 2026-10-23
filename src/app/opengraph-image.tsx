import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

// Generates the social preview image (og:image) at build time with Next.js's
// built-in ImageResponse, so no design asset is needed. Uses the default font;
// a brand font can be loaded later.
export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #f3f8ef 0%, #fdf6ea 100%)",
          color: "#1d2b22",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              background: "#2f7d4f",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ fontSize: 56, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>
            Everyday nutrition, guided by AI and real dietitians
          </div>
          <div style={{ fontSize: 30, color: "#4d6355" }}>
            India-first · In early development
          </div>
        </div>
      </div>
    ),
    size,
  );
}
