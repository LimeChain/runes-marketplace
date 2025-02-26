"use client"

import { HelpCircle } from 'lucide-react'
import { IBM_Plex_Mono } from 'next/font/google'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Listing } from '@/lib/utils'

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'] })

interface EditListingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: Listing
  onSave: (price: number) => void
  onCancel: () => void
  onCancelListing: () => void
}

export function EditListingModal({
  open,
  onOpenChange,
  listing,
  onSave,
  onCancel,
  onCancelListing
}: EditListingModalProps) {
  const totalValueUSD = (listing.tokenAmount * listing.exchangeRate * 0.0001).toFixed(0) // Simplified USD calculation

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#070708] text-white border-[#2e343c]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium">Edit Token Listing</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="rounded-lg bg-[#16181b] p-4 space-y-4">
            <div className="flex justify-between">
              <div className="text-[#a7afc0]">Token amount</div>
              <div>
                <span className={`${ibmPlexMono.className}`}>{listing.tokenAmount.toLocaleString()} sats </span>
                <span className={`${ibmPlexMono.className} text-[#a7afc0]`}>${totalValueUSD}</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <div className="text-[#a7afc0]">Minimum order threshold</div>
              <div className={ibmPlexMono.className}>
                {listing.minTokenThreshold.toLocaleString()} {listing.runeName}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-lg">Change price per token</label>
              <HelpCircle className="h-4 w-4 text-[#a7afc0]" />
            </div>
            <div className="relative">
              <Input
                type="text"
                defaultValue={listing.exchangeRate}
                className={`${ibmPlexMono.className} h-16 text-3xl bg-[#16181b] border-0 pr-16 focus-visible:ring-1 focus-visible:ring-[#ff7531]`}
              />
              <div className={`${ibmPlexMono.className} absolute right-4 top-1/2 -translate-y-1/2 text-[#a7afc0]`}>
                sats
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <Button
              variant="ghost"
              onClick={onCancelListing}
              className="w-full text-[#e1515f] hover:text-[#e1515f] hover:bg-[#e1515f]/10"
            >
              Cancel Listing
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-[#a7afc0] hover:text-white hover:bg-transparent"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => onSave(listing.exchangeRate)}
              className="bg-[#ff7531] hover:bg-[#ff7531]/90 text-white rounded-full px-8"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

