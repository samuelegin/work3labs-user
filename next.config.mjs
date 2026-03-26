/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // MetaMask SDK pulls in React Native async storage — not needed in browser
    config.resolve.alias['@react-native-async-storage/async-storage'] = false

    // WalletConnect logger pulls in pino-pretty — not needed in browser
    config.resolve.alias['pino-pretty'] = false

    // WalletConnect needs these node built-ins stubbed out
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    return config
  },
}

export default nextConfig
