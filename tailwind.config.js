/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // Cyberpunk color palette
        cyber: {
          black: '#0a0a0a',
          dark: '#1a1a1a',
          gray: '#2a2a2a',
          light: '#3a3a3a',
          neon: '#00ffff',
          pink: '#ff0080',
          purple: '#8000ff',
          blue: '#0080ff',
          green: '#00ff80',
          red: '#ff0040',
          yellow: '#ffff00',
        },
        // Glassmorphism effects
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.3)',
          neon: 'rgba(0, 255, 255, 0.1)',
        }
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)',
        'neon-gradient': 'linear-gradient(135deg, #00ffff 0%, #ff0080 50%, #8000ff 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 128, 0.1) 100%)',
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(0, 255, 255, 0.3), 0 0 40px rgba(0, 255, 255, 0.1)',
        'cyber-pink': '0 0 20px rgba(255, 0, 128, 0.3), 0 0 40px rgba(255, 0, 128, 0.1)',
        'cyber-purple': '0 0 20px rgba(128, 0, 255, 0.3), 0 0 40px rgba(128, 0, 255, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow': {
          '0%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};
