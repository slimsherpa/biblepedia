/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'build-output',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'us-central1-biblepediaio.cloudfunctions.net',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'www.gstatic.com',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    disableOptimizedLoading: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
