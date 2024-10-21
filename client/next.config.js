/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["https://www.github.com/","firebasestorage.googleapis.com"],
  },
};

module.exports = nextConfig;
