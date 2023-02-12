/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  optimizeFonts: true,
  experimental: {
    optimizeCss: true
  },
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en'
  }
}
