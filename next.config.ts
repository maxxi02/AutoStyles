/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Add this to disable Next.js image optimization globally
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
      },
      {
        protocol: "https",
        hostname: "scontent.fmnl30-3.fna.fbcdn.net",
      },
    ],
  },
};
module.exports = nextConfig;