"use client"

import { useState } from 'react'
import { ListingsGrid } from '@/components/listings-grid'
import { BuyModal } from '@/components/buy-modal'

const listings = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: "Name",
  amount: "80,000",
  priceInSats: "7 sats",
  priceInUSD: "$0.007",
  address: "bc1p...yldf",
  btcAmount: "0.005792",
  usdAmount: "$600.00"
}))

export function TokenListings() {
  const [selectedListing, setSelectedListing] = useState<typeof listings[0] | null>(null)

  const handleBuy = (listing: any) => {
    setSelectedListing(listing)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button className="px-4 py-2 rounded-md bg-[#2e343c] text-white">Listed</button>
            <button className="px-4 py-2 rounded-md text-[#a7afc0] hover:text-white">My Listings</button>
          </div>
          <select className="bg-[#2e343c] text-white px-4 py-2 rounded-md border-0 focus:ring-1 focus:ring-[#ff7531]">
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>

        <ListingsGrid 
          listings={listings} 
          context="token"
          onBuy={handleBuy}
        />
      </div>

      {selectedListing && (
        <BuyModal
          open={!!selectedListing}
          onOpenChange={(open) => !open && setSelectedListing(null)}
          tokenName={selectedListing.name}
          amount={selectedListing.amount}
          priceInSats={selectedListing.priceInSats}
          priceInUSD={selectedListing.priceInUSD}
        />
      )}
    </>
  )
}

