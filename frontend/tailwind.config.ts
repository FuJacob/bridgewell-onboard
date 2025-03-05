import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#3A36BD", // blue-500
          DARK: "#200268",
          
        },
        secondary: {
          DEFAULT: "#EE7368", // emerald-500
        },
        accent: {
          DEFAULT: "#0E6D54", // amber-500
        },
      },
    },
  },
  plugins: [],
} satisfies Config;