// /c/sonar/users/sonar-edm-user/tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          400: '#00e5ff',
          500: '#00b8d4',
          900: '#006064',
        },
        fuchsia: {
          400: '#ff00ff',
          500: '#d500f9',
        },
        teal: {
          400: '#1de9b6',
          500: '#00bfa5',
          900: '#004d40',
        },
      },
      backgroundColor: {
        'black/20': 'rgba(0, 0, 0, 0.2)',
        'black/30': 'rgba(0, 0, 0, 0.3)',
        'black/40': 'rgba(0, 0, 0, 0.4)',
        'black/50': 'rgba(0, 0, 0, 0.5)',
        'cyan-500/20': 'rgba(0, 184, 212, 0.2)',
        'cyan-500/30': 'rgba(0, 184, 212, 0.3)',
        'fuchsia-500/20': 'rgba(213, 0, 249, 0.2)',
        'fuchsia-500/30': 'rgba(213, 0, 249, 0.3)',
      },
      borderColor: {
        'cyan-500/20': 'rgba(0, 184, 212, 0.2)',
        'cyan-500/30': 'rgba(0, 184, 212, 0.3)',
        'cyan-500/50': 'rgba(0, 184, 212, 0.5)',
        'fuchsia-500/20': 'rgba(213, 0, 249, 0.2)',
        'fuchsia-500/30': 'rgba(213, 0, 249, 0.3)',
        'white/10': 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
};
