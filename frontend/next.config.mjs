/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * WHY: O Stellar SDK e suas dependências referenciam módulos Node.js
   * (buffer, crypto, stream, etc.) que não existem nativamente no browser.
   * Este fallback instrui o webpack a usar os shims corretos via polyfills.
   */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        buffer: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
