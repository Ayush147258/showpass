import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SHOWPASS Brand
        navy: {
          DEFAULT: "#0A1628",
          50: "#EEF2FF",
          100: "#C7D5F5",
          200: "#92A9E8",
          300: "#4A6DD4",
          400: "#2B4CB8",
          500: "#1A3490",
          600: "#112268",
          700: "#0A1628",
          800: "#060E1A",
          900: "#03070E",
        },
        accent: {
          DEFAULT: "#FF6B35",
          50: "#FFF3EE",
          100: "#FFE4D5",
          200: "#FFBEA0",
          300: "#FF9366",
          400: "#FF7A47",
          500: "#FF6B35",
          600: "#E5501A",
          700: "#C23C0F",
          800: "#8F2B08",
          900: "#5C1B04",
        },
        teal: {
          DEFAULT: "#00D4AA",
          50: "#E0FFF8",
          100: "#B3FFF0",
          200: "#66FFE1",
          300: "#1AFFD2",
          400: "#00E8BB",
          500: "#00D4AA",
          600: "#00A882",
          700: "#007D60",
          800: "#005242",
          900: "#002921",
        },
        purple: {
          DEFAULT: "#7B2FBE",
          50: "#F4EBFF",
          100: "#E2C8FF",
          200: "#C490FF",
          300: "#A558F7",
          400: "#8F40E8",
          500: "#7B2FBE",
          600: "#621F9C",
          700: "#4A1578",
          800: "#330D55",
          900: "#1C0630",
        },
        gold: {
          DEFAULT: "#FFB800",
          50: "#FFFBEB",
          100: "#FFF3C2",
          200: "#FFE480",
          300: "#FFD43D",
          400: "#FFC91A",
          500: "#FFB800",
          600: "#CC9200",
          700: "#996D00",
          800: "#664900",
          900: "#332400",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        clash: ["var(--font-clash)", "sans-serif"],
        body: ["var(--font-sora)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "mesh-navy": `radial-gradient(at 20% 50%, #0A1628 0%, transparent 50%), radial-gradient(at 80% 20%, #1A3490 0%, transparent 50%), radial-gradient(at 50% 80%, #0A1628 0%, transparent 50%)`,
        "mesh-accent": `radial-gradient(at 0% 0%, #FF6B3522 0%, transparent 50%), radial-gradient(at 100% 100%, #7B2FBE22 0%, transparent 50%)`,
        "ticket-perforation": `radial-gradient(circle, transparent 6px, white 6px)`,
        "holographic": `linear-gradient(135deg, #FF6B35, #FFB800, #00D4AA, #7B2FBE, #FF6B35)`,
      },
      animation: {
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "shimmer": "shimmer 2.5s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "ticker": "ticker 20s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-slow": "spin 8s linear infinite",
        "gradient-shift": "gradientShift 4s ease infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(40px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 107, 53, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 107, 53, 0.7)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "glow-accent": "0 0 30px rgba(255, 107, 53, 0.4)",
        "glow-teal": "0 0 30px rgba(0, 212, 170, 0.4)",
        "glow-purple": "0 0 30px rgba(123, 47, 190, 0.4)",
        "ticket": "0 25px 60px rgba(0, 0, 0, 0.35), 0 8px 20px rgba(0,0,0,0.2)",
        "card-hover": "0 20px 60px rgba(10, 22, 40, 0.15)",
        "nav": "0 1px 0 rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [animate],
};

export default config;
