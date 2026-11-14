/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Permite compilar a otra carpeta (NEXT_DIST_DIR) sin pisar la caché del servidor de desarrollo
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

module.exports = nextConfig;
