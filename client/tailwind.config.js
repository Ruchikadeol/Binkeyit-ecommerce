/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#ffbg00",
        "primary-light": "#ffc929",
        secondary: "#00b050",
        "secondary-light": "#0b1a78",
      },
    },
  },
  plugins: [],
};
