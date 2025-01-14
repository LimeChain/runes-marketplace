"use client"

import { useState } from "react"
import { VerifiedIcon } from 'lucide-react'
import { IBM_Plex_Mono } from 'next/font/google'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ListingsGrid } from '@/components/listings-grid'
import { EditListingModal } from './edit-listing-modal'

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'] })

const tokens = [
  {
    id: 1,
    name: "Token Name",
    verified: true,
    myAmount: "100,000",
    price: "7 sats",
    priceUSD: "$0.007",
    priceChange: "0.7%",
    volume: "6.468 BTC",
    volumeUSD: "$604.99K",
    marketCap: "$730.06M",
    marketCapBTC: "7,358.161 BTC",
    trades: 535,
  },
  // Duplicate the token 3 more times for the example
  {
    id: 2,
    name: "Token Name",
    verified: true,
    myAmount: "100,000",
    price: "7 sats",
    priceUSD: "$0.007",
    priceChange: "0.7%",
    volume: "6.468 BTC",
    volumeUSD: "$604.99K",
    marketCap: "$730.06M",
    marketCapBTC: "7,358.161 BTC",
    trades: 535,
  },
  {
    id: 3,
    name: "Token Name",
    verified: true,
    myAmount: "100,000",
    price: "7 sats",
    priceUSD: "$0.007",
    priceChange: "0.7%",
    volume: "6.468 BTC",
    volumeUSD: "$604.99K",
    marketCap: "$730.06M",
    marketCapBTC: "7,358.161 BTC",
    trades: 535,
  },
  {
    id: 4,
    name: "Token Name",
    verified: true,
    myAmount: "100,000",
    price: "7 sats",
    priceUSD: "$0.007",
    priceChange: "0.7%",
    volume: "6.468 BTC",
    volumeUSD: "$604.99K",
    marketCap: "$730.06M",
    marketCapBTC: "7,358.161 BTC",
    trades: 535,
  },
]

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

export function AssetsTable() {
  const [activeTab, setActiveTab] = useState<'assets' | 'listings'>('assets')
  const [editingListing, setEditingListing] = useState<typeof listings[0] | null>(null)

  const handleEditListing = (listing: any) => {
    setEditingListing(listing)
  }

  const handleSaveEdit = (price: string) => {
    // Handle saving the edited listing
    console.log('Saving listing with new price:', price)
    setEditingListing(null)
  }

  const handleCancelListing = () => {
    // Handle canceling the listing
    console.log('Canceling listing:', editingListing)
    setEditingListing(null)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('assets')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'assets' 
                  ? 'bg-[#2e343c] text-white' 
                  : 'text-[#a7afc0] hover:text-white'
              }`}
            >
              My Assets
            </button>
            <button 
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'listings' 
                  ? 'bg-[#2e343c] text-white' 
                  : 'text-[#a7afc0] hover:text-white'
              }`}
            >
              My Listings
            </button>
          </div>
          <Select defaultValue="low-to-high">
            <SelectTrigger className="w-[180px] bg-[#2e343c] border-0">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-[#16181b] border-[#2e343c]">
              <SelectItem value="low-to-high">Price: Low to High</SelectItem>
              <SelectItem value="high-to-low">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {activeTab === 'assets' ? (
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#a7afc0]">
                  <th className="pb-4 pl-4">#</th>
                  <th className="pb-4">Name</th>
                  <th className="pb-4">My Amount</th>
                  <th className="pb-4">Price</th>
                  <th className="pb-4">Price%</th>
                  <th className="pb-4">Volume</th>
                  <th className="pb-4">Market Cap</th>
                  <th className="pb-4">Trades</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr 
                    key={token.id} 
                    className="border-t border-[#2e343c] hover:bg-[#2e343c] transition-colors duration-200"
                  >
                    <td className="py-4 pl-4">{token.id}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-b from-yellow-300 via-blue-400 to-blue-500" />
                        <span className="font-medium">{token.name}</span>
                        {token.verified && (
                          <VerifiedIcon className="h-4 w-4 text-[#ff7531]" />
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className={ibmPlexMono.className}>{token.myAmount}</div>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        <div className={ibmPlexMono.className}>{token.price}</div>
                        <div className={`${ibmPlexMono.className} text-[#a7afc0]`}>{token.priceUSD}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-[#00d181]">{token.priceChange}</span>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        <div>{token.volume}</div>
                        <div className="text-[#a7afc0]">{token.volumeUSD}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        <div>{token.marketCap}</div>
                        <div className="text-[#a7afc0]">{token.marketCapBTC}</div>
                      </div>
                    </td>
                    <td className="py-4">{token.trades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ListingsGrid 
            listings={listings} 
            context="dashboard"
            onEditListing={handleEditListing}
          />
        )}
      </div>

      {editingListing && (
        <EditListingModal
          open={!!editingListing}
          onOpenChange={(open) => !open && setEditingListing(null)}
          listing={editingListing}
          onSave={handleSaveEdit}
          onCancel={() => setEditingListing(null)}
          onCancelListing={handleCancelListing}
        />
      )}
    </>
  )
}

