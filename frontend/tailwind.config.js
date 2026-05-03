/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Jan Shakti Design System Colors
        surface: '#faf8ff',
        'surface-dim': '#d2d9f4',
        'surface-bright': '#faf8ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f3ff',
        'surface-container': '#eaedff',
        'surface-container-high': '#e2e7ff',
        'surface-container-highest': '#dae2fd',
        'on-surface': '#131b2e',
        'on-surface-variant': '#3f484c',
        'inverse-surface': '#283044',
        'inverse-on-surface': '#eef0ff',
        outline: '#6f787d',
        'outline-variant': '#bec8cd',
        'surface-tint': '#006781',
        
        // Primary Colors
        primary: '#005a71',
        'on-primary': '#ffffff',
        'primary-container': '#0e7490',
        'on-primary-container': '#d3f1ff',
        'inverse-primary': '#81d1f0',
        
        // Secondary Colors
        secondary: '#bb001d',
        'on-secondary': '#ffffff',
        'secondary-container': '#e41f2e',
        'on-secondary-container': '#fffbff',
        'secondary-fixed': '#ffdad7',
        'secondary-fixed-dim': '#ffb3ae',
        'on-secondary-fixed': '#410004',
        'on-secondary-fixed-variant': '#930015',
        
        // Tertiary Colors
        tertiary: '#933200',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#bc4200',
        'on-tertiary-container': '#ffe8e0',
        'tertiary-fixed': '#ffdbce',
        'tertiary-fixed-dim': '#ffb599',
        'on-tertiary-fixed': '#370e00',
        'on-tertiary-fixed-variant': '#7f2b00',
        
        // Error Colors
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        
        // Background Colors
        background: '#faf8ff',
        'on-background': '#131b2e',
        'surface-variant': '#dae2fd',
        
        // Primary Fixed Variants
        'primary-fixed': '#b9eaff',
        'primary-fixed-dim': '#81d1f0',
        'on-primary-fixed': '#001f29',
        'on-primary-fixed-variant': '#004d62',
      },
      fontFamily: {
        'headline-xl': ['Noto Serif', 'serif'],
        'headline-lg': ['Noto Serif', 'serif'],
        'headline-md': ['Noto Serif', 'serif'],
        'body-lg': ['Public Sans', 'sans-serif'],
        'body-md': ['Public Sans', 'sans-serif'],
        'label-lg': ['Public Sans', 'sans-serif'],
        'label-sm': ['Public Sans', 'sans-serif'],
      },
      fontSize: {
        'headline-xl': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'label-lg': ['16px', { lineHeight: '1.2', letterSpacing: '0.02em', fontWeight: '700' }],
        'label-sm': ['12px', { lineHeight: '1.2', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      spacing: {
        xs: '4px',
        base: '8px',
        sm: '12px',
        md: '24px',
        gutter: '16px',
        'container-margin': '20px',
        lg: '40px',
        xl: '64px',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        'warm': '0px 10px 30px rgba(234, 88, 12, 0.08)',
      },
    },
  },
  plugins: [],
}
