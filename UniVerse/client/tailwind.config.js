export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official UniVerse Design Tokens
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB', // Primary action: Campus Blue #2563EB
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#172554', // Primary brand: Deep Navy #172554
          950: '#0F172A',
        },
        navy: {
          800: '#1E293B',
          850: '#172033', // Dark surface
          900: '#172554', // Primary brand Deep Navy
          950: '#0F172A', // Dark background
        },
        slate: {
          750: '#253347',
          850: '#172033', // Dark surface #172033
          900: '#0F172A', // Dark background #0F172A
          950: '#090E17',
        },
        campus: {
          navy: '#172554',         // Primary brand
          blue: '#2563EB',         // Primary action
          indigo: '#4F46E5',       // Secondary accent
          teal: '#0F9D91',         // Supporting accent
          bgLight: '#F5F7FC',      // Light background
          surfaceLight: '#FFFFFF', // Light surface
          borderLight: '#E2E8F0',  // Light borders
          textMain: '#172033',     // Main text
          textMuted: '#64748B',    // Secondary text
          bgDark: '#0F172A',       // Dark background
          surfaceDark: '#172033',  // Dark surface
          elevatedDark: '#1E293B', // Dark elevated surface
          borderDark: '#334155',   // Dark borders
          textDarkPrimary: '#F1F5F9',   // Dark primary text
          textDarkSecondary: '#A8B4C7', // Dark secondary text
        },
        accent: {
          indigo: '#4F46E5',
          teal: '#0F9D91',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card-light': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'card-dark': '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
