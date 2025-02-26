"use client"

import { useState, useEffect } from 'react'
import { IBM_Plex_Mono } from 'next/font/google'
import { Search, Check, HelpCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWalletStore } from "@/store/useWalletStore"
import { encodeLEB128, Token } from '@/lib/utils'
import { createInstance, createSellOrderTx } from '@/lib/contract-handler'

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'] })

interface ListTokenModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ListTokenModal({ open, onOpenChange }: ListTokenModalProps) {
  const [step, setStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [amount, setAmount] = useState("0")
  const [priceInSats, setPriceInSats] = useState("7")
  const [threshold, setThreshold] = useState(10)
  const [tokens, setTokens] = useState<Token[]>([])
  const { privateKey, address } = useWalletStore()

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch(`/api/address/${address}/tokens`)
        const data = await response.json()

        setTokens(data)
      } catch (err) {
        console.error(err)
      }
    }
    if (address) {
      fetchTokens()
    }
  }, [])

  const handleNext = async () => {
    if (step === 1 && selectedToken) {
      setAmount(selectedToken.amount || "0")
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      if (privateKey && selectedToken && thresholdAmount) {
        // Calculate divisibility multiplier
        const amountMultiplier = 10 ** selectedToken.divisibility

        const scriptThreshold = thresholdAmount * amountMultiplier
        const scriptAmount = Number(amount) * amountMultiplier
        // const scriptExchangeRate = Number(priceInSats) / amountMultiplier

        // Encode RuneID to LEB128
        const runeIdParams = selectedToken.id.toString().split(':').map(e => BigInt(e))
        const runeId = `00${encodeLEB128(runeIdParams[0])}${encodeLEB128(runeIdParams[1])}`
        
        // Create the sell order instance
        const instance = await createInstance(privateKey, runeId, scriptThreshold)

        // Get outputs
        const response = await fetch(`/api/outputs/${address}`)
        const data = await response.json()
        const feeOutput = data.find((out: any) => Object.keys(out.runes).length === 0 && out.value > 5000 && out.value < 100_000)
        const runesOutput = data.find((out: any) => !!out.runes[selectedToken.name])

        // Create sell order
        const sellOrder = await createSellOrderTx(feeOutput, runesOutput, privateKey, runeId, BigInt(scriptAmount), BigInt(priceInSats), instance)

        console.log(instance, sellOrder, sellOrder.uncheckedSerialize())

        const sendListing = await fetch('/api/listing/new', {
          method: "POST",
          headers: { "Content-type": "application/json"},
          body: JSON.stringify({
            id: sellOrder.hash,
            rawTx: sellOrder.uncheckedSerialize(),
            prevOut: null,
            runeId: selectedToken.id,
            sellerPubKey: instance.sellerPubKey,
            divisibility: selectedToken.divisibility,
            exchangeRate: priceInSats,
            tokenAmount: scriptAmount,
            minTokenThreshold: scriptThreshold
          })
        })
        onOpenChange(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const totalValue = parseInt(amount) * parseInt(priceInSats)
  const thresholdAmount = Math.floor((parseInt(amount) * threshold) / 100)

  const handleAmountChange = (value: string) => {
    // Only allow numbers
    const cleaned = value.replace(/[^0-9]/g, '')
    setAmount(cleaned)
  }

  const handlePriceChange = (value: string) => {
    // Only allow numbers
    const cleaned = value.replace(/[^0-9]/g, '')
    setPriceInSats(cleaned)
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl mb-4">Select a token from your assets</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a7afc0]" />
        <Input
          type="text"
          placeholder="Search tokens"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#16181b] border-0 pl-10 text-white placeholder:text-[#a7afc0] focus-visible:ring-1 focus-visible:ring-[#ff7531]"
        />
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {tokens.map((token) => (
          <button
            key={token.id}
            onClick={() => setSelectedToken(token)}
            className={`w-full flex items-center justify-between p-4 rounded-lg ${
              selectedToken?.id === token.id ? 'bg-[#2e343c]' : 'bg-[#16181b]'
            } hover:bg-[#2e343c] transition-colors`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10">
                <img src={token.imageUrl}></img>
              </div>
              <div className="text-left">
                <div>{token.name}</div>
                <div className="text-[#a7afc0]">{token.id}</div>
              </div>
            </div>
            <div className={`${ibmPlexMono.className}`}>{token.amount} {token.symbol}</div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl mb-4">Choose token amount, set price and purchase threshold</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm">Token amount</label>
            <HelpCircle className="h-4 w-4 text-[#a7afc0]" />
          </div>
          <div className="bg-[#16181b] rounded-lg p-4">
            <Input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={`${ibmPlexMono.className} text-3xl h-12 bg-transparent border-0 p-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
            <div className="flex justify-between text-sm mt-2">
              <div className="flex items-center gap-1">
                <span className="text-[#a7afc0]">Available: </span>
                <span className={ibmPlexMono.className}>
                  {selectedToken?.amount} {selectedToken?.symbol}
                </span>
              </div>
              <button 
                onClick={() => setAmount(selectedToken?.amount?.replace(/,/g, '') || '0')}
                className="text-[#ff7531] hover:text-[#ff7531]/90"
              >
                MAX
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm">Price per token</label>
            <HelpCircle className="h-4 w-4 text-[#a7afc0]" />
          </div>
          <div className="bg-[#16181b] rounded-lg p-4">
            <div className="flex items-baseline gap-2">
              <Input
                type="text"
                value={priceInSats}
                onChange={(e) => handlePriceChange(e.target.value)}
                className={`${ibmPlexMono.className} text-3xl h-12 w-24 bg-transparent border-0 p-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
              <div className={`${ibmPlexMono.className} text-xl text-[#a7afc0]`}>
                sats
              </div>
            </div>
            <div className="flex justify-end text-sm text-[#a7afc0] mt-2">
              <div className={ibmPlexMono.className}>
                {totalValue.toLocaleString()} sats
              </div>
              <div className={`${ibmPlexMono.className} ml-2`}>
                {(totalValue * 0.00000001).toFixed(8)} BTC
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm">Minimum order threshold</label>
            <HelpCircle className="h-4 w-4 text-[#a7afc0]" />
          </div>
          <div className="flex gap-2">
            {[0, 10, 20, 30, 40, 50].map((value) => (
              <button
                key={value}
                onClick={() => setThreshold(value)}
                className={`px-3 py-1 rounded text-sm ${
                  threshold === value
                    ? 'bg-[#ff7531] text-white'
                    : 'bg-[#2e343c] text-[#a7afc0] hover:text-white'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
          <div className="text-right text-sm text-[#a7afc0]">
            = {thresholdAmount.toLocaleString()} {selectedToken?.symbol}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl mb-4">Confirm your listing</h2>
      
      <div className="bg-[#16181b] rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span>Token amount</span>
          <div className="text-right">
            <span className={`${ibmPlexMono.className}`}>{parseInt(amount).toLocaleString()} sats</span>
            <span className={`${ibmPlexMono.className} block text-[#a7afc0]`}>$?</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span>Price per token</span>
          <div className="text-right">
            <span className={`${ibmPlexMono.className}`}>{priceInSats} sats</span>
            <span className={`${ibmPlexMono.className} block text-[#a7afc0]`}>$?</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span>Minimum order threshold</span>
          <div className="text-right">
            <span className={`${ibmPlexMono.className}`}>
              {threshold}% = {thresholdAmount.toLocaleString()} {selectedToken?.symbol}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#070708] text-white border-[#2e343c]">
        <DialogHeader>
          <div className="flex items-center">
            <DialogTitle className="text-xl font-medium">List Token</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex justify-between mb-8">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step > 1 ? 'bg-white text-black' : 'bg-[#ff7531] text-white'
              }`}>
                {step > 1 ? <Check className="h-6 w-6" /> : '1'}
              </div>
              <span className={`mt-2 text-sm ${step >= 1 ? 'text-white' : 'text-[#a7afc0]'}`}>Select a token</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step > 2 ? 'bg-white text-black' : step === 2 ? 'bg-[#ff7531] text-white' : 'bg-[#2e343c] text-[#a7afc0]'
              }`}>
                {step > 2 ? <Check className="h-6 w-6" /> : '2'}
              </div>
              <span className={`mt-2 text-sm ${step >= 2 ? 'text-white' : 'text-[#a7afc0]'}`}>Choose amount</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 3 ? 'bg-[#ff7531] text-white' : 'bg-[#2e343c] text-[#a7afc0]'
              }`}>
                3
              </div>
              <span className={`mt-2 text-sm ${step === 3 ? 'text-white' : 'text-[#a7afc0]'}`}>Confirm listing</span>
            </div>
          </div>

          {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={step === 1 ? () => onOpenChange(false) : handleBack}
              className="text-[#a7afc0] hover:text-white hover:bg-transparent"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button 
              className="bg-[#ff7531] hover:bg-[#ff7531]/90 text-white rounded-full px-8"
              disabled={step === 1 && !selectedToken}
              onClick={handleNext}
            >
              {step === 3 ? 'List Token' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

