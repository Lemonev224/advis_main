/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        nav: {
          bg: '#2C3E50', // Dark slate for top bar
          text: '#ECF0F1',
          active: '#34495E'
        },
        page: {
          bg: '#F5F7FA', // Light gray background
        },
        card: {
          border: '#E5E7EB',
          bg: '#FFFFFF'
        },
        status: {
          passed: '#2ECC71', // Green
          failed: '#E74C3C', // Red
          manual: '#F1C40F', // Amber/Yellow
          info: '#3498DB'    // Blue
        }
      },
    },
  },
  plugins: [],
}