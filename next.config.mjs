/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Always use static export
  images: {
    unoptimized: true,  // Required for static export
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "replicate.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Remove rewrites as they don't work with static export
};

export default nextConfig;
