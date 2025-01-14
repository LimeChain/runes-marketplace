import { MarketplaceHeader } from '@/components/marketplace-header'
import { MarketTable } from '@/components/market-table'

export default function Marketplace() {
  return (
    <div className="bg-[#070708] min-h-screen text-white">
      <MarketplaceHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MarketTable />
      </div>
    </div>
  )
}

