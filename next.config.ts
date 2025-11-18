/** @type {import('next').NextConfig} */
const nextConfig = {
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
        pathname: "/**",  // Add this
      },
      {
        protocol: "https",
        hostname: "scontent.fmnl30-3.fna.fbcdn.net",
        port: "",
        pathname: "/**",  // Add this
      },
    ],
  },
};
module.exports = nextConfig;