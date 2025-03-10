"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { IBM_Plex_Mono } from "next/font/google";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { encodeLEB128, Listing, Tx } from "@/lib/utils";
import { createBuyTx, getInstance } from "@/lib/contract-handler";
import { useWalletStore } from "@/store/useWalletStore";

const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400"] });

interface BuyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing;
}

export function BuyModal({ open, onOpenChange, listing }: BuyModalProps) {
  const amount = listing.tokenAmount / 10 ** listing.divisibility;
  const threshold = listing.minTokenThreshold / 10 ** listing.divisibility;
  const [selectedAmount, setSelectedAmount] = useState(amount);
  const { privateKey, address } = useWalletStore();
  const balance = 0; // TODO: get from wallet

  const percentages = [
    { label: "25%", value: 25 },
    { label: "50%", value: 50 },
    { label: "75%", value: 75 },
    { label: "100%", value: 100 },
  ];

  const handlePercentageClick = (percentage: number) => {
    setSelectedAmount((amount * percentage) / 100);
  };

  const buyListing = async () => {
    const runeIdParams = listing.runeId
      .toString()
      .split(":")
      .map((e) => BigInt(e));
    const runeId = `00${encodeLEB128(runeIdParams[0])}${encodeLEB128(
      runeIdParams[1]
    )}`;

    const instance = await getInstance(
      listing.sellerPubKey,
      listing.minTokenThreshold,
      runeId
    );

    // Get listing tx info
    const txResponse = await fetch(`/api/tx/${listing.id}`);
    const txData = await txResponse.json();
    const prevTx: Tx = txData.transaction;

    const response = await fetch(`/api/outputs/${address}`);
    const data = await response.json();
    const feeOutput = data.find(
      (out: any) =>
        Object.keys(out.runes).length === 0 &&
        out.value > 5000 &&
        out.value < 100_000
    );

    const scriptAmount = BigInt(selectedAmount * 10 ** listing.divisibility);
    const [tx, success] = await createBuyTx(
      txData.txid,
      prevTx,
      feeOutput,
      listing.sellerPubKey,
      privateKey!,
      runeId,
      scriptAmount,
      BigInt(listing.tokenAmount),
      BigInt(listing.exchangeRate),
      instance
    );

    if (success) {
      console.log(tx.uncheckedSerialize())
      await fetch('/api/listing/new', {
        method: "POST",
        headers: { "Content-type": "application/json"},
        body: JSON.stringify({
          id: tx.hash,
          rawTx: tx.uncheckedSerialize(),
          prevOut: listing.id,
          runeId: listing.runeId,
          sellerPubKey: instance.sellerPubKey,
          sellerAddress: listing.sellerAddress,
          divisibility: listing.divisibility,
          exchangeRate: listing.exchangeRate,
          tokenAmount: listing.tokenAmount - Number(scriptAmount),
          minTokenThreshold: listing.minTokenThreshold
        })
      })
      onOpenChange(false)
    } else {
      console.log("Tx verification failed. Try with another amount ¯\\_(ツ)_/¯")
    }
  };

  const networkFeePerVbyte = 1; // sats/vB
  const estimatedVbytes = 1500;

  const totalValue =
    selectedAmount * listing.exchangeRate * 10 ** listing.divisibility;
  const networkFee = estimatedVbytes * networkFeePerVbyte;
  const total = totalValue + networkFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#070708] text-white border-[#2e343c]">
        <DialogHeader>
          <div className="flex items-center">
            <button
              onClick={() => onOpenChange(false)}
              className="text-[#a7afc0] hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <DialogTitle className="flex-1 text-center text-lg">
              Buy
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[#a7afc0] text-sm">{listing.runeName}</div>
              <div className={`${ibmPlexMono.className} text-2xl`}>
                {amount}
              </div>
            </div>
            <div className="text-right">
              <div className={`${ibmPlexMono.className}`}>
                {listing.exchangeRate * 10 ** listing.divisibility} sats
              </div>
              <div className={`${ibmPlexMono.className} text-[#a7afc0]`}>
                ${(listing.exchangeRate * 10 ** listing.divisibility) / 1000}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-[#a7afc0]">Amount</div>
            <div className="flex gap-2">
              {percentages.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePercentageClick(p.value)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedAmount === (amount * p.value) / 100
                      ? "bg-[#ff7531] text-white"
                      : "bg-[#2e343c] text-[#a7afc0] hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="bg-[#16181b] rounded-lg p-4">
              <div className={`${ibmPlexMono.className} text-3xl mb-4`}>
                {selectedAmount.toLocaleString()}
              </div>
              <Slider
                value={[selectedAmount]}
                onValueChange={([value]) => setSelectedAmount(value)}
                onValueCommit={([value]) => {
                  if (value !== amount && value > amount - threshold) {
                    // TODO: show message
                    setSelectedAmount(amount - threshold);
                  }
                }}
                max={amount}
                step={1 / 10 ** listing.divisibility}
                className="my-4"
              />

              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-[#a7afc0]">Balance: </span>
                  <span className={ibmPlexMono.className}>{balance} BTC</span>
                </div>
                <button
                  onClick={() => setSelectedAmount(amount)}
                  className="text-[#ff7531] hover:text-[#ff7531]/90"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#a7afc0]">
              <span>Minimum order threshold</span>
              <span className="text-xs border border-[#2e343c] rounded-full h-4 w-4 inline-flex items-center justify-center">
                ?
              </span>
              <span className="ml-auto">
                {threshold}{" "}
                <span className={ibmPlexMono.className}>
                  {listing.runeName}
                </span>
              </span>
            </div>

            <div className="space-y-3 bg-[#16181b] rounded-lg p-4 text-sm">
              <div className="flex justify-between">
                <span>Total Value</span>
                <div className="text-right">
                  <div>{totalValue.toLocaleString()} sats</div>
                  <div className="text-[#a7afc0]">
                    ${(totalValue / 1000).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <span>Network Fee</span>
                <div className="text-right">
                  <div>
                    {networkFee} sats{" "}
                    <span className="text-[#a7afc0]">/vB</span>
                  </div>
                  <div className="text-[#a7afc0]">
                    {estimatedVbytes} vB * {networkFeePerVbyte} sats/vB
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-[#2e343c]">
                <span>Total</span>
                <div className="text-right">
                  <div>{total.toLocaleString()} sats</div>
                  <div className="text-[#a7afc0]">
                    {(total * 0.00000001).toFixed(8)} BTC
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              className="w-full bg-[#ff7531] hover:bg-[#ff7531]/90 text-white rounded-full"
              onClick={() => buyListing()}
            >
              Buy
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full text-[#a7afc0] hover:text-white hover:bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
