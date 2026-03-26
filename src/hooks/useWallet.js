'use client'

import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain } from 'wagmi'
import { base } from 'wagmi/chains'
import { useCallback } from 'react'
import { buildSignInMessage } from '@/lib/wagmi'

export function useWallet() {
  const { address, isConnected, chain } = useAccount()
  const { connectAsync, connectors, isPending: isConnecting } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { switchChainAsync } = useSwitchChain()

  const isOnBase = chain?.id === base.id

  // Opens RainbowKit modal — connector selection handled there
  const connect = useCallback(async () => {
    const connector = connectors[0]
    if (!connector) return { error: 'No wallet connector available' }
    try {
      await connectAsync({ connector })
      return { error: null }
    } catch (err) {
      if (err?.message?.includes('User rejected')) return { error: 'Connection cancelled' }
      return { error: err?.message ?? 'Connection failed' }
    }
  }, [connectAsync, connectors])

  const disconnect = useCallback(async () => {
    try { await disconnectAsync() } catch {}
  }, [disconnectAsync])

  // Prompt network switch if not already on Base
  const ensureBase = useCallback(async () => {
    if (chain?.id === base.id) return { error: null }
    try {
      await switchChainAsync({ chainId: base.id })
      return { error: null }
    } catch {
      return { error: 'Please switch to Base network in your wallet' }
    }
  }, [chain, switchChainAsync])

  // Sign a timestamped message — no transaction, just ownership proof
  const signLoginMessage = useCallback(async (addr) => {
    const message = buildSignInMessage(addr)
    try {
      const signature = await signMessageAsync({ message })
      return { signature, message, error: null }
    } catch (err) {
      if (err?.message?.includes('User rejected')) return { signature: null, message: null, error: 'Signature cancelled' }
      return { signature: null, message: null, error: err?.message ?? 'Signing failed' }
    }
  }, [signMessageAsync])

  return {
    address,
    isConnected,
    isConnecting,
    isOnBase,
    connect,
    disconnect,
    ensureBase,
    signLoginMessage,
  }
}
