import { MarketplaceHeader } from "./components/marketplace-header"
import { TimeFilter } from "./components/time-filter"
import { MarketTable } from "./components/market-table"

export default function Marketplace() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        <MarketplaceHeader />
        <TimeFilter />
        <MarketTable />
      </div>
    </div>
  )
}

