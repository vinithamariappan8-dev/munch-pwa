/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Build எரர்களைப் புறக்கணிக்கும்
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint எரர்களைப் புறக்கணிக்கும்
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;