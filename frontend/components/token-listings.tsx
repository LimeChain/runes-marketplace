"use client"

import { useState, useEffect } from 'react'
import { ListingsGrid } from '@/components/listings-grid'
import { BuyModal } from '@/components/buy-modal'
import { useWalletStore } from '@/store/useWalletStore'
import { Listing } from '@/lib/utils'

export function TokenListings({id}: {id: string}) {
  const [activeTab, setActiveTab] = useState<'all-listings' | 'my-listings'>('all-listings')
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [allListings, setAllListings] = useState<Listing[]>([])
  const [myListings, setMyListings] = useState<Listing[]>([])
  const { address } = useWalletStore()

  useEffect(() => {
        const fetchListings = async () => {
          try {
            const response = await fetch(`/api/listings/token/${id}`)
            const data: Listing[] = await response.json()
            setAllListings(data.filter(listing => listing.sellerAddress !== address))
            setMyListings(data.filter(listing => listing.sellerAddress === address))
            console.log(data)
          } catch (err) {
            console.error(err)
          }
        }
        fetchListings()
      }, [])

  const handleBuy = (listing: any) => {
    setSelectedListing(listing)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button 
            className={`px-4 py-2 rounded-md ${
              activeTab === 'all-listings' 
                ? 'bg-[#2e343c] text-white' 
                : 'text-[#a7afc0] hover:text-white'
            }`}
            onClick={() => setActiveTab('all-listings')}>Listed</button>
            <button 
            className={`px-4 py-2 rounded-md ${
              activeTab === 'my-listings' 
                ? 'bg-[#2e343c] text-white' 
                : 'text-[#a7afc0] hover:text-white'
            }`}
            onClick={() => setActiveTab('my-listings')}>My Listings</button>
          </div>
          <select className="bg-[#2e343c] text-white px-4 py-2 rounded-md border-0 focus:ring-1 focus:ring-[#ff7531]">
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>
        {activeTab === 'all-listings' ?
        (<ListingsGrid 
          listings={allListings} 
          context="token"
          onBuy={handleBuy}
        />) : (
        <ListingsGrid 
          listings={myListings} 
          context="token"
          onBuy={handleBuy}
        />)}
        
      </div>

      {selectedListing && (
        <BuyModal
          open={!!selectedListing}
          onOpenChange={(open) => !open && setSelectedListing(null)}
          listing={selectedListing}
        />
      )}
    </>
  )
}

