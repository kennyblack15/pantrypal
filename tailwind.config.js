module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FDF8F6',
          100: '#F2E8E5',
          200: '#EADDD7',
          300: '#D3BCB6',
          400: '#B49C94',
          500: '#967969',
          600: '#846358',
          700: '#43302B',
          800: '#362421',
          900: '#2B1D1A',
        },
        accent: {
          'warm': '#E6B17E',     // Warm wood tone from the table
          'sauce': '#592E1C',    // Dark soy sauce color
          'nori': '#1A2F25',     // Dark seaweed green
          'egg': '#FFC123',      // Egg yolk color
          'greens': '#2D5A27',   // Fresh greens color
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'ramen-pattern': "url('/images/ramen-bg.jpg')",
      }
    },
  },
  plugins: [],
}
