import { ImageResponse } from "next/og";
import { getChallenge } from "@/lib/queries";

export const alt = "Can You Go 30-0? — beat this MMA roster";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// DB-backed, per-challenge → render on demand.
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ch = await getChallenge(id).catch(() => null);

  const record = ch ? `${ch.creatorWins}-${ch.creatorLosses}` : "30-0";
  const name = ch && ch.game === "30-0" ? ch.creatorName : "A challenger";
  const goat = ch ? ch.creatorGoat : 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          color: "white",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800, letterSpacing: 2, color: "#fbbf24" }}>
          🥊 CAN YOU GO 30-0?
        </div>
        <div style={{ display: "flex", fontSize: 220, fontWeight: 900, color: "#f59e0b", lineHeight: 1 }}>
          {record}
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#d4d4d8", marginTop: 8 }}>
          {name} went {record} · GOAT {goat}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 44,
            fontWeight: 800,
            color: "black",
            backgroundColor: "#fbbf24",
            padding: "18px 44px",
            borderRadius: 9999,
          }}
        >
          Can you beat them?
        </div>
      </div>
    ),
    { ...size },
  );
}
