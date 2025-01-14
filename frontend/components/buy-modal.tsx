"use client"

import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { IBM_Plex_Mono } from 'next/font/google'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'] })

interface BuyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokenName: string
  amount: string
  priceInSats: string
  priceInUSD: string
}

export function BuyModal({ 
  open, 
  onOpenChange, 
  tokenName, 
  amount, 
  priceInSats, 
  priceInUSD 
}: BuyModalProps) {
  const [selectedAmount, setSelectedAmount] = useState(40000)
  const maxAmount = parseInt(amount.replace(/,/g, ''))
  const balance = 0.005792

  const percentages = [
    { label: '25%', value: 25 },
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: '100%', value: 100 },
  ]

  const handlePercentageClick = (percentage: number) => {
    setSelectedAmount((maxAmount * percentage) / 100)
  }

  const serviceFeeRate = 0.005 // 0.5%
  const networkFeePerVbyte = 7 // sats/vB
  const estimatedVbytes = 300

  const totalValue = selectedAmount * parseInt(priceInSats)
  const serviceFee = Math.floor(totalValue * serviceFeeRate)
  const networkFee = estimatedVbytes * networkFeePerVbyte
  const total = totalValue + serviceFee + networkFee

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#070708] text-white border-[#2e343c]">
        <DialogHeader>
          <div className="flex items-center">
            <button 
              onClick={() => onOpenChange(false)}
              className="text-[#a7afc0] hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <DialogTitle className="flex-1 text-center text-lg">Buy</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[#a7afc0] text-sm">{tokenName}</div>
              <div className={`${ibmPlexMono.className} text-2xl`}>{amount}</div>
            </div>
            <div className="text-right">
              <div className={`${ibmPlexMono.className}`}>{priceInSats}</div>
              <div className={`${ibmPlexMono.className} text-[#a7afc0]`}>{priceInUSD}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-[#a7afc0]">Amount</div>
            <div className="flex gap-2">
              {percentages.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePercentageClick(p.value)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedAmount === (maxAmount * p.value) / 100
                      ? 'bg-[#ff7531] text-white'
                      : 'bg-[#2e343c] text-[#a7afc0] hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            
            <div className="bg-[#16181b] rounded-lg p-4">
              <div className={`${ibmPlexMono.className} text-3xl mb-4`}>
                {selectedAmount.toLocaleString()}
              </div>
              <Slider
                value={[selectedAmount]}
                onValueChange={([value]) => setSelectedAmount(value)}
                max={maxAmount}
                step={1000}
                className="my-4"
              />
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-[#a7afc0]">Balance: </span>
                  <span className={ibmPlexMono.className}>{balance} BTC</span>
                </div>
                <button 
                  onClick={() => setSelectedAmount(maxAmount)}
                  className="text-[#ff7531] hover:text-[#ff7531]/90"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#a7afc0]">
              <span>Minimum order threshold</span>
              <span className="text-xs border border-[#2e343c] rounded-full h-4 w-4 inline-flex items-center justify-center">?</span>
              <span className="ml-auto">
                10% = 4,000 <span className={ibmPlexMono.className}>NAME</span>
              </span>
            </div>

            <div className="space-y-3 bg-[#16181b] rounded-lg p-4 text-sm">
              <div className="flex justify-between">
                <span>Total Value</span>
                <div className="text-right">
                  <div>{totalValue.toLocaleString()} sats</div>
                  <div className="text-[#a7afc0]">$196</div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <span>Service Fee</span>
                  <span className="bg-[#2e343c] px-2 rounded text-xs">0.5%</span>
                </div>
                <div className="text-right">
                  <div>{serviceFee.toLocaleString()} sats</div>
                  <div className="text-[#a7afc0]">$9.80</div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span>Network Fee</span>
                <div className="text-right">
                  <div>
                    {networkFee} sats <span className="text-[#a7afc0]">/vB</span>
                  </div>
                  <div className="text-[#a7afc0]">
                    {estimatedVbytes} vB * {networkFeePerVbyte} sats/vB
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-3 border-t border-[#2e343c]">
                <span>Total</span>
                <div className="text-right">
                  <div>{total.toLocaleString()} sats</div>
                  <div className="text-[#a7afc0]">
                    {(total * 0.00000001).toFixed(8)} BTC
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              className="w-full bg-[#ff7531] hover:bg-[#ff7531]/90 text-white rounded-full"
            >
              Buy
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full text-[#a7afc0] hover:text-white hover:bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

