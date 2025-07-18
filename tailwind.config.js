/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      colors: {
        // Design System Colors
        primary: {
          50: '#E6F9F9',
          100: '#B3F0F0', 
          200: '#80E6E6',
          300: '#4DDDDD',
          400: '#34CCCD',    // Main brand color
          500: '#2BB3B4',
          600: '#248B8D',
          700: '#1C6A6B',
          800: '#154849',
          900: '#0D2627',
          DEFAULT: '#34CCCD',
          foreground: '#FFFFFF',
        },
        success: {
          50: '#E8F9F2',
          100: '#C3F0D8',
          200: '#9DE7BE',
          300: '#77DEA4',
          400: '#51D58A',
          500: '#3DDC97',
          600: '#2BB06F',
          700: '#1F8452',
          800: '#135835',
          900: '#0A2C1A',
          DEFAULT: '#3DDC97',
        },
        warning: {
          50: '#FFF6E5',
          100: '#FFE8B8',
          200: '#FFDA8A',
          300: '#FFCC5C',
          400: '#FFBE2E',
          500: '#FFC260',
          600: '#E6A847',
          700: '#CC8E2E',
          800: '#B37415',
          900: '#7A4F0A',
          DEFAULT: '#FFC260',
        },
        danger: {
          50: '#FFE8E8',
          100: '#FFB8B8',
          200: '#FF8A8A',
          300: '#FF5C5C',
          400: '#FF2E2E',
          500: '#FF6B6B',
          600: '#E64747',
          700: '#CC2323',
          800: '#B30000',
          900: '#7A0000',
          DEFAULT: '#FF6B6B',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#2E2E2E',
          900: '#1F2937',
        },
        // Legacy mappings for existing components
        border: '#E5E7EB',
        input: '#F3F4F6',
        ring: '#34CCCD',
        background: '#F9FAFB',
        foreground: '#2E2E2E',
        secondary: {
          DEFAULT: '#F3F4F6',
          foreground: '#374151',
        },
        destructive: {
          DEFAULT: '#FF6B6B',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F3F4F6',
          foreground: '#6B7280',
        },
        accent: {
          DEFAULT: '#F3F4F6',
          foreground: '#374151',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#2E2E2E',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#2E2E2E',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
        xl: '1rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 0 0 rgba(52, 204, 205, 0.4)" 
          },
          "50%": { 
            boxShadow: "0 0 0 8px rgba(52, 204, 205, 0)" 
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}