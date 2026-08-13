/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f3eee4",
        cream: "#fbf8f1",
        ink: "#2b261f",
        muted: "#7a7266",
        sage: {
          DEFAULT: "#5c7356",
          soft: "#e5eee2",
        },
        rose: {
          DEFAULT: "#a85c66",
          soft: "#f4e6e8",
        },
        gold: {
          DEFAULT: "#b0894f",
          soft: "#f4ead8",
        },
        navy: {
          DEFAULT: "#6d7f96",
          soft: "#d9e1ea",
        },
        mov: {
          DEFAULT: "#9a7aa8",
          soft: "#eadcec",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Outfit"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        paper: "0 10px 40px -18px rgba(80, 60, 30, 0.28)",
      },
    },
  },
  plugins: [],
};
