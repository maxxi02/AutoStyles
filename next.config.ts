/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: {
      resolveAlias: {
        "@vercel/turbopack-next/internal/font/google/font": false,
      },
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "scontent.fmnl30-1.fna.fbcdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "scontent.fmnl30-3.fna.fbcdn.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
};
module.exports = nextConfig;