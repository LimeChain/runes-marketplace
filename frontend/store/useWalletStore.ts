import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  seedPhrase: string[]
  privateKey: string | null
  address: string | null
  balance: string
  btcPrice: number
  setSeedPhrase: (seedPhrase: string[]) => void
  setPrivateKey: (privateKey: string) => void
  setAddress: (address: string) => void
  setBalance: (balance: string) => void
  setBtcPrice: (btcPrice: number) => void
  clear: () => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      seedPhrase: [],
      privateKey: null,
      address: null,
      balance: "0",
      btcPrice: 0,
      setSeedPhrase: (seedPhrase) => set({ seedPhrase }),
      setPrivateKey: (privateKey) => set({ privateKey }),
      setAddress: (address) => set({ address }),
      setBalance: (balance) => set({ balance }),
      setBtcPrice: (btcPrice) => set({btcPrice}),
      clear: () => set({ seedPhrase: [], address: null }),
    }),
    {
      name: 'wallet-storage',
    }
  )
)