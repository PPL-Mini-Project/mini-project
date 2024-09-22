/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["https://image.tmdb.org/","https://www.github.com/"],
  },
};

module.exports = nextConfig;
