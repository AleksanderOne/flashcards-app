import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        fontSize: 20,
        background: "linear-gradient(to bottom right, #8b5cf6, #ec4899)", // Violet to Pink
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        borderRadius: "8px",
      }}
    >
      ⚡
    </div>,
    // ImageResponse options
    {
      ...size,
    },
  );
}
