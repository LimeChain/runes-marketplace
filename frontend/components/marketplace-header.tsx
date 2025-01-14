import { Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Chakra_Petch } from 'next/font/google'

const chakraPetch = Chakra_Petch({ subsets: ['latin'], weight: ['400'] })

export function MarketplaceHeader() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="border border-[#2e343c] rounded-lg p-8 bg-[#070708]">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className={`text-4xl tracking-tight text-white ${chakraPetch.className}`}>MARKETPLACE</h2>
            <p className="text-[#a7afc0]">
              One-stop hub for trading and etching Runes with zero fees
            </p>
            <p className="text-[#a7afc0]">Explore Runes on our Web3 Marketplace</p>
          </div>

          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search Bitcoin Runes"
              className="w-full rounded-full bg-[#16181b] px-4 pr-24 py-2 text-sm text-white placeholder:text-[#a7afc0] focus:outline-none focus:ring-2 focus:ring-[#ff7531]"
            />
            <Button size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#ff7531] hover:bg-[#ff7531]/90 rounded-full px-3 py-1 text-xs">
              <Search className="h-3 w-3" />
              <span className="ml-1">Search</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

