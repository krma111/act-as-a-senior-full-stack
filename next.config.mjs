/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb"
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "picsum.photos"
      }
    ]
  }
};

export default nextConfig;
