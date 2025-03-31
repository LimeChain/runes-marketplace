"use client"

import { useState, useEffect } from "react"
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
import { useWalletStore } from "@/store/useWalletStore"
import { Listing, Token } from "@/lib/types"

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'] })

export function AssetsTable() {
  const [activeTab, setActiveTab] = useState<'assets' | 'listings'>('assets')
  const [editingListing, setEditingListing] = useState<Listing | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { address, btcPrice } = useWalletStore()

  const satPrice = btcPrice / 100_000_000

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch(`/api/address/${address}/tokens`)
        if (!response.ok) {
          throw new Error("Failed to fetch tokens")
        }
        const data = await response.json()

        setTokens(data)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load tokens. Please try again later.")
        setIsLoading(false)
      }
    }

    const fetchListings = async () => {
      const response = await fetch(`/api/listings/`)
      const data: Listing[] = await response.json()
      setListings(data.filter(listing => listing.sellerAddress === address))
    }
    if (address) {
      fetchTokens()
      fetchListings()
    }
  }, [])

  const handleEditListing = (listing: any) => {
    setEditingListing(listing)
  }

  const handleSaveEdit = (price: number) => {
    // Handle saving the edited listing
    console.log('Saving listing with new price:', price)
    setEditingListing(null)
  }

  const handleCancelListing = () => {
    // Handle canceling the listing
    console.log('Canceling listing:', editingListing)
    setEditingListing(null)
  }

  if (isLoading) {
    return <div className="text-white text-center py-8">Loading...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>
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
                  <th className="pb-4">Volume</th>
                  <th className="pb-4">Market Cap</th>
                  <th className="pb-4">Trades</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token, index) => (
                  <tr 
                    key={token.id} 
                    className="border-t border-[#2e343c] hover:bg-[#2e343c] transition-colors duration-200"
                  >
                    <td className="py-4 pl-4">{index+1}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-b from-yellow-300 via-blue-400 to-blue-500">
                          <img src={token.imageUrl} ></img>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">{token.name} {token.verified && (<VerifiedIcon className="h-4 w-4 text-[#ff7531] inline" />)}</span>
                          </div>
                          <div className="text-[#a7afc0]">{token.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className={ibmPlexMono.className}>{token.amount}</div>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        <div className={ibmPlexMono.className}>{token.price}</div>
                        <div className={`${ibmPlexMono.className} text-[#a7afc0]`}>{(token.price * satPrice).toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        <div>{token.volume}</div>
                        <div className="text-[#a7afc0]">{(token.volume * satPrice).toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        <div>{token.marketCap}</div>
                        <div className="text-[#a7afc0]">{(token.marketCap * satPrice).toFixed(2)}</div>
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

