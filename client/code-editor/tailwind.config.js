/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        "code-bg": "#1e1e1e",
        "code-fg": "#d4d4d4",
        "terminal-bg": "#000000",
        "terminal-fg": "#00ff00",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
