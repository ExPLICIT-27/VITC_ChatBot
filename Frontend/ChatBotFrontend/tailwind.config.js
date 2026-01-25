/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#4F46E5", // Indigo-600
                secondary: "#9333EA", // Purple-600
                dark: {
                    900: "#111827", // Gray-900 (Background)
                    800: "#1F2937", // Gray-800 (Cards)
                    700: "#374151", // Gray-700 (Border)
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
