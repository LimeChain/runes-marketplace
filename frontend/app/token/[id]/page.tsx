import { VerifiedIcon } from 'lucide-react'
import { TokenStats } from "@/components/token-stats"
import { TokenListings } from "@/components/token-listings"
import { Token } from '@/lib/utils';

export default async function TokenPage({ params }: { params: { id: string } }) {
  const runeId = decodeURIComponent(params.id)
  return (
    <div className="min-h-screen bg-[#070708] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <TokenStats id={runeId} />
        <TokenListings id={runeId}/>
      </div>
    </div>
  )
}

