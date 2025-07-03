import type { NextConfig } from "next";

// Supportons l'utilisation conditionnelle de l'analyseur de bundle
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({
      enabled: true,
      openAnalyzer: true,
      // Générer des statistiques plus détaillées
      generateStatsFile: true,
      // Personnaliser la sortie de l'analyseur
      analyzerMode: 'static',
      statsFilename: 'stats.json',
    })
  : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Désactiver ESLint pendant la build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuration des images
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [],
    // Permettre l'optimisation des images locales
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },

  // Configuration webpack personnalisée
  webpack: (config, { dev, isServer }) => {
    // Désactiver l'optimisation des exports uniquement en mode développement
    if (dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: false,
      };
    }

    return config;
  },

  // Configuration du serveur de développement
  experimental: {
    // Désactiver certaines optimisations expérimentales
    optimizeCss: false
  },
}

export default withBundleAnalyzer(nextConfig);
