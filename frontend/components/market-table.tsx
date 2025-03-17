"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Token } from "@/lib/types";

export function MarketTable() {
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleRowClick = (tokenId: string) => {
    router.push(`/token/${tokenId}`);
  };

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch(`/api/tokens`);
        if (!response.ok) {
          throw new Error("Failed to fetch tokens");
        }
        const data = await response.json();

        setTokens(data);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setIsLoading(false);
      }
    };
    fetchTokens();
  }, []);

  if (isLoading) {
    return <div className="text-white text-center py-8">Loading...</div>;
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#a7afc0]">
            <th className="pb-4 pl-4">#</th>
            <th className="pb-4">Name</th>
            <th className="pb-4">Price</th>
            <th className="pb-4">Volume</th>
            <th className="pb-4">Market Cap</th>
            <th className="pb-4">Trades</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, index) => (
            <tr
              key={token.id}
              className="border-t border-[#2e343c] hover:bg-[#2e343c] transition-colors duration-200 cursor-pointer"
              onClick={() => handleRowClick(token.id)}
            >
              <td className="py-4 pl-4">{index+1}</td>
              <td className="py-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#2e343c]">
                    <img src={token.imageUrl}></img>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">{token.name}</span>
                    </div>
                    <div className="text-[#a7afc0]">{token.id}</div>
                  </div>
                </div>
              </td>
              <td className="py-4">
                <div className="space-y-1">
                  <div>{token.price  * (10 ** token.divisibility)} sats</div>
                  <div className="text-[#a7afc0]">
                    ${token.price * (10 ** token.divisibility) / 1000}
                  </div>
                </div>
              </td>
              <td className="py-4">
                <div className="space-y-1">
                  <div>{token.volume} sats</div>
                  <div className="text-[#a7afc0]">${(token.volume / 1000).toFixed(2)}</div>
                </div>
              </td>
              <td className="py-4">
                <div className="space-y-1">
                  <div>{token.marketCap} sats</div>
                  <div className="text-[#a7afc0]">${(token.marketCap / 1000).toFixed(2)}</div>
                </div>
              </td>
              <td className="py-4">{token.trades}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
