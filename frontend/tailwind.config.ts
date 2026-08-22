import type { Config } from "tailwindcss";

export default {
  darkMode: "class", // 🔥 السطر ده هو اللي هيفعل زرار الدارك مود في الموقع كله
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#13212d",
        ocean: { 50: "#22c5b8", 100: "#b2f1e8", 500: "#1e5858", 600: "#07970e", 700: "#101111" },
        mist: "#05b664",
      },
      boxShadow: { card: "0 14px 45px -22px rgba(28, 38, 48, 0.25)" },
    },
  },
  plugins: [],
} satisfies Config;