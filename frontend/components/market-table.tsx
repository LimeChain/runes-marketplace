"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { VerifiedIcon } from 'lucide-react'

interface TokenData {
  id: number
  name: string
  verified: boolean
  price: string
  priceUSD: string
  priceChange: string
  volume: string
  volumeUSD: string
  marketCap: string
  marketCapBTC: string
  trades: number
}

const tokens: TokenData[] = [
  {
    id: 1,
    name: "Token Name",
    verified: true,
    price: "7 sats",
    priceUSD: "$0.007",
    priceChange: "0.7%",
    volume: "6.468 BTC",
    volumeUSD: "$604.99K",
    marketCap: "$730.06M",
    marketCapBTC: "7,358.161 BTC",
    trades: 535,
  },
  {
    id: 2,
    name: "Token Name",
    verified: true,
    price: "12 sats",
    priceUSD: "$0.012",
    priceChange: "1.2%",
    volume: "8.245 BTC",
    volumeUSD: "$824.99K",
    marketCap: "$950.06M",
    marketCapBTC: "9,358.161 BTC",
    trades: 721,
  },
]

export function MarketTable() {
  const router = useRouter()

  const handleRowClick = (tokenId: number) => {
    router.push(`/token/${tokenId}`)
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#a7afc0]">
            <th className="pb-4 pl-4">#</th>
            <th className="pb-4">Name</th>
            <th className="pb-4">Price</th>
            <th className="pb-4">Price%</th>
            <th className="pb-4">Volume</th>
            <th className="pb-4">Market Cap</th>
            <th className="pb-4">Trades</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr 
              key={token.id} 
              className="border-t border-[#2e343c] hover:bg-[#2e343c] transition-colors duration-200 cursor-pointer"
              onClick={() => handleRowClick(token.id)}
            >
              <td className="py-4 pl-4">{token.id}</td>
              <td className="py-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#2e343c]" />
                  <span className="font-medium">{token.name}</span>
                  {token.verified && (
                    <VerifiedIcon className="h-4 w-4 text-[#ff7531]" />
                  )}
                </div>
              </td>
              <td className="py-4">
                <div className="space-y-1">
                  <div>{token.price}</div>
                  <div className="text-[#a7afc0]">{token.priceUSD}</div>
                </div>
              </td>
              <td className="py-4">
                <span className="text-[#00d181]">{token.priceChange}</span>
              </td>
              <td className="py-4">
                <div className="space-y-1">
                  <div>{token.volume}</div>
                  <div className="text-[#a7afc0]">{token.volumeUSD}</div>
                </div>
              </td>
              <td className="py-4">
                <div className="space-y-1">
                  <div>{token.marketCap}</div>
                  <div className="text-[#a7afc0]">{token.marketCapBTC}</div>
                </div>
              </td>
              <td className="py-4">{token.trades}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

