"use client"

import { Button } from "@/components/ui/button"
import { IBM_Plex_Mono } from 'next/font/google'
import { shortAddress } from '@/lib/utils'
import { Listing } from '@/lib/types'
import { useWalletStore } from "@/store/useWalletStore"

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'] })

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
  const { btcPrice } = useWalletStore()

  const satPrice = btcPrice / 100_000_000
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {listings.map((listing) => (
        <div 
          key={listing.id}
          className="p-4 rounded-lg bg-[#16181b] border border-[#2e343c] flex flex-col"
        >
          <div className="text-[#a7afc0] text-sm mb-2">{listing.runeName}</div>
          <div className={`${ibmPlexMono.className} text-4xl font-medium mb-4`}>
            {listing.tokenAmount / (10 ** listing.divisibility)}
          </div>
          <div className="space-y-1 mb-4">
            <div className={`${ibmPlexMono.className} text-lg`}>
              {listing.exchangeRate * (10 ** listing.divisibility)} sats / {listing.runeSymbol}
            </div>
            <div className={`${ibmPlexMono.className} text-[#a7afc0]`}>
              ${(listing.exchangeRate * (10 ** listing.divisibility) * satPrice).toFixed(2)}
            </div>
          </div>
          <div className={`${ibmPlexMono.className} text-[#a7afc0] text-sm border-t border-b border-[#2e343c] my-4 py-4`}>
            {shortAddress(listing.sellerAddress)}
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

