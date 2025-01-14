"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Bitcoin, Wallet, Plus, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { IBM_Plex_Mono } from 'next/font/google'
import { ListTokenModal } from './list-token-modal'

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'] })

interface WalletDropdownProps {
  address: string
  onDisconnect: () => void
}

export function WalletDropdown({ address, onDisconnect }: WalletDropdownProps) {
  const router = useRouter()
  const [showListToken, setShowListToken] = useState(false)
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="rounded-full bg-[#2e343c] border-[#2e343c] text-white hover:bg-[#2e343c]/90"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-green-400 mr-2" />
            {shortAddress}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72 bg-[#070708] border-[#2e343c] p-4">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2e343c]">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-6 w-6 text-[#f7931a]" />
              <span className={`text-lg text-white ${ibmPlexMono.className}`}>0.005792</span>
            </div>
            <span className="text-muted-foreground text-sm">$600.00</span>
          </div>
          <DropdownMenuItem 
            className="py-2 text-[#a7afc0] hover:text-white hover:bg-[#2e343c] cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            <Wallet className="mr-2 h-4 w-4" />
            My Assets
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="py-2 text-[#a7afc0] hover:text-white hover:bg-[#2e343c] cursor-pointer"
            onClick={() => setShowListToken(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            List Token
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="py-2 text-[#a7afc0] hover:text-white hover:bg-[#2e343c] cursor-pointer"
            onClick={onDisconnect}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ListTokenModal 
        open={showListToken}
        onOpenChange={setShowListToken}
      />
    </>
  )
}

