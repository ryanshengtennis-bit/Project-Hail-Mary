const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const repositoryPath = '/Project-Hail-Mary';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGitHubPages ? repositoryPath : '',
  assetPrefix: isGitHubPages ? repositoryPath : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
