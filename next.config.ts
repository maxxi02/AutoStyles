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
      {
        protocol: "https",
        hostname: "scontent.fmnl8-2.fna.fbcdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "scontent.fmnl8-4.fna.fbcdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "scontent.fmnl8-3.fna.fbcdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "scontent.fmnl8-5.fna.fbcdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "scontent.fmnl8-1.fna.fbcdn.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
};
module.exports = nextConfig;