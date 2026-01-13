/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-preset-env': {
      stage: 2,
      features: {
        'oklab-function': true,
        'color-function': true,
      },
      browsers: 'last 2 versions, > 1%, not dead',
    },
  },
}

export default config
