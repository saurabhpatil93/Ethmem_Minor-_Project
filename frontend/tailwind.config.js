/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'hsl(var(--background))',
          dark: 'hsl(var(--background-dark))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          dark: 'hsl(var(--foreground-dark))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          dark: 'hsl(var(--primary-dark))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          dark: 'hsl(var(--secondary-dark))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          dark: 'hsl(var(--accent-dark))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          dark: 'hsl(var(--muted-dark))',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          dark: 'hsl(var(--border-dark))',
        },
        input: {
          DEFAULT: 'hsl(var(--input))',
          dark: 'hsl(var(--input-dark))',
        },
        ring: {
          DEFAULT: 'hsl(var(--ring))',
          dark: 'hsl(var(--ring-dark))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
