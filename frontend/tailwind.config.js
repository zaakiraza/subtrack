import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

/** Written by AI Factory: the theme comes from the approved wireframes. */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.5rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "fontFamily": {
        "headline": [
          "Inter",
          "sans-serif"
        ],
        "display": [
          "Inter",
          "sans-serif"
        ],
        "body": [
          "Inter",
          "sans-serif"
        ],
        "label": [
          "Public Sans",
          "sans-serif"
        ]
      },
      "colors": {
        "canvas": "#0B0D10",
        "surface": "#14161A",
        "raised": "#1C1F26",
        "border": "#2A2E36",
        "text": "#F2F4F7",
        "muted": "#8B909A",
        "accent": "#2563EB"
      }
    },
  },
  plugins: [forms, containerQueries],
};
