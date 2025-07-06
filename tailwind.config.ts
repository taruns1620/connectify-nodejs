import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme"; // Import default theme fonts

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true, // Center containers by default
      padding: {
        DEFAULT: '1rem',    // Padding for smallest screens (mobile)
        sm: '2rem',         // Padding for sm screens (640px) and up
        lg: '3rem',         // Padding for lg screens (1024px) and up (reduced from 4rem for a slightly less wide gutter)
        xl: '4rem',         // Padding for xl screens (1280px) and up (reduced from 5rem)
        '2xl': '5rem',      // Padding for 2xl screens (1536px) and up (reduced from 6rem)
      },
    },
  	extend: {
        fontFamily: { // Add fontFamily extension
            sans: ["var(--font-sans)", ...fontFamily.sans], // Keep Inter as default sans
            orbitron: ["var(--font-orbitron)", ...fontFamily.sans], // Add Orbitron
        },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
            xl: 'calc(var(--radius) + 4px)', // Use for larger radius elements
  			lg: 'var(--radius)', // Updated from 0.5rem to 0.75rem via globals.css
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
             float: { // Add float animation
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-10px)' },
            },
             'pulse-glow': { // Add pulse-glow animation
                 '0%, 100%': { boxShadow: '0 0 5px hsl(var(--primary)), 0 0 10px hsl(var(--primary))', opacity: '0.8' },
                 '50%': { boxShadow: '0 0 15px hsl(var(--primary)), 0 0 25px hsl(var(--primary))', opacity: '1' },
             },
              'fade-in': { // Add fade-in animation
                  from: { opacity: '0', transform: 'translateY(10px)' },
                  to: { opacity: '1', transform: 'translateY(0)' },
              },
              sparkle: { // Add sparkle animation
                 '0%': { transform: 'scale(0)', opacity: '0' },
                 '50%': { opacity: '1' },
                 '100%': { transform: 'scale(1.5)', opacity: '0' },
             },
            scanline: {
                '0%': { top: '-10%' },
                '100%': { top: '110%' },
            },
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
             float: 'float 6s ease-in-out infinite', // Add float animation utility
             'pulse-glow': 'pulse-glow 3s ease-in-out infinite', // Add pulse-glow utility
             'fade-in': 'fade-in 1.5s ease-out forwards', // Add fade-in utility
             sparkle: 'sparkle 1s ease-out infinite', // Add sparkle utility
             scanline: 'scanline 3s ease-in-out infinite',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
