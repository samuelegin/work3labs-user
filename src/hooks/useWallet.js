'use client'

import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'
import { useCallback } from 'react'
import { buildSignInMessage } from '@/lib/wagmi'

export function useWallet() {
  const { address, isConnected, chain } = useAccount()
  const { isPending: isConnecting } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { switchChainAsync } = useSwitchChain()
  const { openConnectModal } = useConnectModal()

  const isOnBase = chain?.id === base.id

  // Opens the RainbowKit modal. Resolves when the user closes it.
  // The caller must watch isConnected via useEffect to know when a wallet connected.
  const openModal = useCallback(() => {
    return new Promise((resolve) => {
      if (!openConnectModal) {
        resolve({ error: 'Wallet provider not ready' })
        return
      }
      try {
        openConnectModal()
        resolve({ error: null })
      } catch (err) {
        resolve({ error: err?.message ?? 'Could not open wallet modal' })
      }
    })
  }, [openConnectModal])

  const disconnect = useCallback(async () => {
    try { await disconnectAsync() } catch {}
  }, [disconnectAsync])

  // Switch to Base if on a different network
  const ensureBase = useCallback(async () => {
    if (chain?.id === base.id) return { error: null }
    try {
      await switchChainAsync({ chainId: base.id })
      return { error: null }
    } catch {
      return { error: 'Please switch to Base network in your wallet' }
    }
  }, [chain, switchChainAsync])

  // Sign a timestamped challenge message — no transaction, just ownership proof
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
    openModal,
    disconnect,
    ensureBase,
    signLoginMessage,
  }
}
