/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  plugins: [require("@tailwindcss/typography")],
  theme: {
    extend: {
      colors: {
        background: "#0d0d0d",
        primary: "#F5F5F5",
      }
    },
  },
};
