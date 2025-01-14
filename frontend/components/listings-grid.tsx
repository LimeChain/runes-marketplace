"use client"

import { Bitcoin } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { IBM_Plex_Mono } from 'next/font/google'

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'] })

interface Listing {
  id: number
  name: string
  amount: string
  priceInSats: string
  priceInUSD: string
  address: string
  btcAmount: string
  usdAmount: string
}

interface ListingsGridProps {
  listings: Listing[]
  context: 'token' | 'dashboard'
  onBuy?: (listing: Listing) => void
  onEditListing?: (listing: Listing) => void
}

export function ListingsGrid({ 
  listings, 
  context,
  onBuy,
  onEditListing 
}: ListingsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {listings.map((listing) => (
        <div 
          key={listing.id}
          className="p-4 rounded-lg bg-[#16181b] border border-[#2e343c] flex flex-col"
        >
          <div className="text-[#a7afc0] text-sm mb-2">{listing.name}</div>
          <div className={`${ibmPlexMono.className} text-4xl font-medium mb-4`}>
            {listing.amount}
          </div>
          <div className="space-y-1 mb-4">
            <div className={`${ibmPlexMono.className} text-lg`}>
              {listing.priceInSats}
            </div>
            <div className={`${ibmPlexMono.className} text-[#a7afc0]`}>
              {listing.priceInUSD}
            </div>
          </div>
          <div className={`${ibmPlexMono.className} text-[#a7afc0] text-sm border-t border-b border-[#2e343c] my-4 py-4`}>
            {listing.address}
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-[#f7931a]" />
              <span className={ibmPlexMono.className}>
                {listing.btcAmount}
              </span>
            </div>
            <span className={`${ibmPlexMono.className} text-[#a7afc0]`}>
              {listing.usdAmount}
            </span>
          </div>
          {context === 'token' ? (
            <Button 
              className="w-full bg-[#2e343c] hover:bg-[#2e343c]/90 text-white rounded-full"
              onClick={() => onBuy?.(listing)}
            >
              Buy
            </Button>
          ) : (
            <Button 
              variant="secondary"
              className="w-full bg-[#2e343c] hover:bg-[#2e343c]/90 text-white rounded-full"
              onClick={() => onEditListing?.(listing)}
            >
              Edit Listing
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

