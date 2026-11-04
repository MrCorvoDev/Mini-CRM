import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
   reactCompiler: true,
   cacheComponents: true,
   partialPrefetching: true,
   experimental: {
      turbopackFileSystemCacheForDev: true,
   },
   allowedDevOrigins: ['192.168.100.17'],
};

export default nextConfig;
