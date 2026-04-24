import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

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
          background:
            "radial-gradient(circle at top, rgba(0,229,168,0.3), transparent 32%), linear-gradient(180deg, #08101f 0%, #050816 100%)",
          color: "#e6eefc",
          fontSize: 180,
          fontWeight: 700
        }}
      >
        +58
      </div>
    ),
    size
  );
}
