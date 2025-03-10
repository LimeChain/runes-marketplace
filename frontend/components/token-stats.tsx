'use client'

import { Token } from '@/lib/utils'
import { VerifiedIcon } from 'lucide-react'
import { useState, useEffect } from 'react'

export function TokenStats({id}: {id: string}) {
  const [token, setToken] = useState<Token | null>(null)
  useEffect(() => {
      const fetchToken = async () => {
        try {
          const response = await fetch(`/api/rune/${id}`)
          const data = await response.json()
          setToken(data)
        } catch (err) {
          console.error(err)
        }
      }
        fetchToken()
    }, [])

  if (!token) {
    return <div>problem</div>
  }

  const price = token.price * (10 ** token.divisibility)

  return (
    <div className="flex items-start gap-6">
      <div className="w-48 h-48 rounded-lg overflow-hidden">
        <img
          src={`${token?.imageUrl}`}
          alt="Token"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-8">
          <h1 className="text-4xl font-bold">{token?.name}</h1>
          <VerifiedIcon className="h-6 w-6 text-[#ff7531]" />
          <button className="ml-auto text-[#ff7531] hover:text-[#ff7531]/90">
            View Info
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-[#a7afc0] mb-1">Price</div>
            <div className="text-lg">{price} sats</div>
            <div className="text-sm text-[#a7afc0]">${(price / 1000).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-[#a7afc0] mb-1">Volume (24h)</div>
            <div className="text-lg">{token.volume} sats</div>
            <div className="text-sm text-[#a7afc0]">${(token.volume / 1000).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-[#a7afc0] mb-1">Market Cap</div>
            <div className="text-lg">{token.marketCap} sats</div>
            <div className="text-sm text-[#a7afc0]">${(token.marketCap / 1000).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-[#a7afc0] mb-1">Trades</div>
            <div className="text-lg">{token.trades}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
