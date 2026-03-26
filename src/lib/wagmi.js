'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

// Singleton — prevents WalletConnect Core from being initialised more than once
// during Next.js HMR in development
let _config = null

function getConfig() {
  if (_config) return _config
  _config = getDefaultConfig({
    appName: 'Work3 Labs',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
    chains: [base],
    ssr: true,
  })
  return _config
}

export const wagmiConfig = getConfig()

// Message users sign to prove wallet ownership. No transaction sent.
export function buildSignInMessage(address) {
  return [
    'Work3 Labs — Contributor Portal',
    '',
    'Sign this message to verify wallet ownership.',
    'No transaction will be sent.',
    '',
    `Address: ${address}`,
    `Timestamp: ${Date.now()}`,
  ].join('\n')
}
