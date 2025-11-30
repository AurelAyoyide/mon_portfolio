import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'neo-yellow': '#ffd93d',
        'neo-cyan': '#66d9ef',
        'neo-pink': '#ff6b9d',
        'neo-green': '#a8e6cf',
        'neo-border': '#000000',
        'neo-bg': '#ffffff',
        'neo-dark-bg': '#1a1a1a',
        'neo-dark-border': '#a8e6cf',
      },
      fontFamily: {
        'grotesk': ['Space Grotesk', 'sans-serif'],
        'mono': ['Space Mono', 'Fira Code', 'monospace'],
        'caveat': ['Caveat', 'cursive'],
      },
      boxShadow: {
        'neo': '4px 4px 0 0 #000',
        'neo-lg': '8px 8px 0 0 #000',
        'neo-hover': '0 0 0 0 #000',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 2.8s ease-in-out infinite',
        'pop-out': 'popOut 3.5s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-25px) rotate(5deg)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        popOut: {
          '0%': { transform: 'translateX(-15px) rotate(-12deg)' },
          '50%': { transform: 'translateX(0) rotate(-12deg)' },
          '100%': { transform: 'translateX(-15px) rotate(-12deg)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
