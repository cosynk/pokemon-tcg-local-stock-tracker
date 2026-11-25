/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Single build worker: the default multi-worker build mmap-fails (SIGBUS)
  // on small/memory-constrained VMs. Vercel's build machines are unaffected.
  experimental: { cpus: 1 },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.tcgdex.net' },
      { protocol: 'https', hostname: 'images.pokemoncard.io' },
      { protocol: 'https', hostname: '**.tcgdex.net' },
    ],
  },
};
module.exports = nextConfig;
