/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Matches your ThemeProvider setup
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground, #FFFFFF)', // Default to white if not defined in CSS vars
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground, #666666)', // Darker text for secondary buttons
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground, #FFFFFF)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground, var(--secondary))', // Fallback to secondary color
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input, var(--border))', // Fallback to border color
        ring: 'var(--ring, var(--primary))',   // Fallback to primary color
        destructive: {
          DEFAULT: 'var(--destructive, var(--error))', // Fallback to error color
          foreground: 'var(--destructive-foreground, #FFFFFF)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.foreground'),
            a: {
              color: theme('colors.primary.DEFAULT'),
              '&:hover': {
                color: theme('colors.primary.DEFAULT / 90%'),
              },
            },
            'h1, h2, h3, h4, h5, h6': {
              color: theme('colors.foreground'),
            },
            strong: {
              color: theme('colors.foreground'),
            },
            // Add more prose customizations here if needed
          },
        },
        invert: { // For dark mode
          css: {
            color: theme('colors.foreground'), // Should be light color in dark mode
             a: {
              color: theme('colors.primary.DEFAULT'), // Primary color should be visible in dark
              '&:hover': {
                color: theme('colors.primary.DEFAULT / 90%'),
              },
            },
            'h1, h2, h3, h4, h5, h6': {
              color: theme('colors.foreground'),
            },
            strong: {
              color: theme('colors.foreground'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}