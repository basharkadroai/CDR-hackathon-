/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@piplabs/cdr-sdk', '@piplabs/cdr-crypto'],
  webpack: (config, { isServer, webpack }) => {
    // The CDR WASM crypto module imports Node builtins via the `node:` scheme
    // (node:module, node:fs, node:crypto, ...) inside Node-only branches.
    // webpack can't resolve the `node:` scheme, so rewrite to bare specifiers
    // and let resolve.fallback stub them out on the client.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      }),
    );

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        module: false,
        path: false,
        url: false,
        os: false,
      };
    }

    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
