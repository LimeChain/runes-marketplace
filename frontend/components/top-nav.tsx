"use client"

import Link from 'next/link'
import { WalletDropdown } from './wallet-dropdown'
import { useState } from 'react'
import { Button } from './ui/button'
import { Wallet } from 'lucide-react'
import { WalletModal } from './wallet-modal'

export function TopNav() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleConnect = () => {
    // Simulating wallet connection
    setConnectedWallet('bc1p...yldf')
  }

  const handleDisconnect = () => {
    setConnectedWallet(null)
  }

  return (
    <>
    <div className="bg-[#070708]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-white text-xl font-semibold">NAME</Link>
            <nav className="ml-10 flex items-baseline space-x-4">
              <Link href="/" className="text-[#ff7531] hover:text-[#ff7531]/90 px-3 py-2 rounded-md text-sm font-medium">
                Marketplace
              </Link>
              <Link href="#" className="text-[#a7afc0] hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Page Name
              </Link>
              <Link href="#" className="text-[#a7afc0] hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Page Name
              </Link>
            </nav>
          </div>
          <div>
            {connectedWallet ? (
              <WalletDropdown address={connectedWallet} onDisconnect={handleDisconnect} />
            ) : (
              <Button 
                variant="outline" 
                className="rounded-full bg-black border-[#ff7531] text-white hover:bg-black/90"
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

