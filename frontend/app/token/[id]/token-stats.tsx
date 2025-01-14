export function TokenStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
      <div>
        <div className="text-sm text-[#a7afc0] mb-1">Price</div>
        <div className="text-lg">7 sats</div>
        <div className="text-sm text-[#a7afc0]">$0.007</div>
      </div>
      <div>
        <div className="text-sm text-[#a7afc0] mb-1">Price% (24h)</div>
        <div className="text-lg text-[#00d181]">0.7%</div>
      </div>
      <div>
        <div className="text-sm text-[#a7afc0] mb-1">Volume (24h)</div>
        <div className="text-lg">6.468 BTC</div>
        <div className="text-sm text-[#a7afc0]">$604.99K</div>
      </div>
      <div>
        <div className="text-sm text-[#a7afc0] mb-1">Market Cap</div>
        <div className="text-lg">$730.06M</div>
        <div className="text-sm text-[#a7afc0]">7,358.161 BTC</div>
      </div>
      <div>
        <div className="text-sm text-[#a7afc0] mb-1">Trades</div>
        <div className="text-lg">535</div>
      </div>
    </div>
  )
}

