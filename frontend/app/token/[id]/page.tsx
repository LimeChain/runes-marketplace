import { VerifiedIcon } from 'lucide-react'
import { TokenStats } from "./token-stats"
import { TokenListings } from "./token-listings"

export default function TokenPage({ params }: { params: { id: string } }) {
  // In a real application, you would fetch the token data based on the id
  const tokenName = "Token Name"
  const tokenId = params.id

  return (
    <div className="min-h-screen bg-[#070708] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-start gap-6">
          <div className="w-48 h-48 rounded-lg overflow-hidden">
            <img
              src="/placeholder.svg"
              alt="Token"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-8">
              <h1 className="text-4xl font-bold">{tokenName}</h1>
              <VerifiedIcon className="h-6 w-6 text-[#ff7531]" />
              <button className="ml-auto text-[#ff7531] hover:text-[#ff7531]/90">
                View Info
              </button>
            </div>
            <TokenStats />
          </div>
        </div>
        <TokenListings />
      </div>
    </div>
  )
}

