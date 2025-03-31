"use client"

import Link from 'next/link'
import { WalletDropdown } from './wallet-dropdown'
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Wallet } from 'lucide-react'
import { WalletModal } from './wallet-modal'
import { useWalletStore } from "@/store/useWalletStore"
import { Buffer } from 'buffer'

window.Buffer = window.Buffer || Buffer;
globalThis.Buffer = globalThis.Buffer || Buffer;

export function TopNav() {
  const [showWalletModal, setShowWalletModal] = useState(false)
  const { address, setAddress, setBalance, setBtcPrice, clear } = useWalletStore()

  const handleConnect = (connectedAddress: string) => {
    setAddress(connectedAddress)
  }

  const handleDisconnect = () => {
    clear()
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    const fetchBalance = async () => {
      if (address) {
        try {
          const response = await fetch(`/api/address/${address}`)
          const data = await response.json()
          setBalance(data['sat_balance'])
        } catch (error) {
          console.error("Failed to fetch balance:", error)
        }
      }
    }

    const fetchBtcPrice = async () => {
      const URL = "https://min-api.cryptocompare.com/data/generateAvg?fsym=BTC&tsym=USD&e=coinbase"
      const response = await fetch(URL)
      const data = await response.json()
      const price = data["RAW"]["PRICE"]
      setBtcPrice(price)
    }

    fetchBtcPrice()
    if (address) {
      fetchBalance() // Fetch immediately when address is set
      intervalId = setInterval(fetchBalance, 10000) // Then fetch every 10 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [address])

  return (
    <>
    <div className="bg-[#070708]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-white text-xl font-semibold">LIME MARKET</Link>
          </div>
          <div>
            {address ? (
              <WalletDropdown onDisconnect={handleDisconnect} />
            ) : (
              <Button 
                variant="outline" 
                className="rounded-full bg-black border-[#ff7531] text-white hover:bg-[#ff7531]/90 hover:text-white"
                onClick={() => setShowWalletModal(true)}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
    <WalletModal 
      open={showWalletModal} 
      onOpenChange={setShowWalletModal}
      onConnect={handleConnect}
    />
    </>
  )
}

