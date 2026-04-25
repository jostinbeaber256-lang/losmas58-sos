import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, rgba(255,77,109,0.28), transparent 34%), linear-gradient(180deg, #08101f 0%, #050816 100%)",
          color: "#e6eefc",
          fontSize: 54,
          fontWeight: 800,
          letterSpacing: 4
        }}
      >
        SOS
      </div>
    ),
    size
  );
}
