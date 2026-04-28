import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        panel: "#13171c",
        border: "#1f252d",
        muted: "#8a93a0",
        accent: "#22c55e",
        danger: "#ef4444",
      },
    },
  },
  plugins: [],
} satisfies Config;
