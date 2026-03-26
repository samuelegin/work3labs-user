'use client'

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { wagmiConfig } from '@/lib/wagmi'
import { UserAuthProvider } from '@/hooks/useUserAuth'

import '@rainbow-me/rainbowkit/styles.css'

// QueryClient in module scope with staleTime so it survives HMR without refetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
})

export default function Providers({ children }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#2DFC44',
            accentColorForeground: '#0D0D0D',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
          coolMode
        >
          <UserAuthProvider>
            {children}
          </UserAuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
