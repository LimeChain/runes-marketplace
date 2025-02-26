"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ImportWalletModal } from "./import-wallet-modal"
import { useWalletStore } from '@/store/useWalletStore'

interface WalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect: (address: string) => void
}

export function WalletModal({ open, onOpenChange, onConnect }: WalletModalProps) {
  const [showImport, setShowImport] = useState(false)
  const { address, setAddress } = useWalletStore()

  const handleImportClick = () => {
    setShowImport(true)
    onOpenChange(false)
  }

  const handleConnect = (importedAddress: string) => {
    setAddress(importedAddress)
    onConnect(importedAddress)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-black text-white border-[#2e343c]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Connect Wallet</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Create new wallet or import already-made one.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 p-4">
            <Button 
              variant="secondary" 
              className="w-full bg-[#2e343c] hover:bg-[#2e343c]/90 text-white"
            >
              New Wallet
            </Button>
            <Button 
              variant="secondary" 
              className="w-full bg-[#2e343c] hover:bg-[#2e343c]/90 text-white"
              onClick={handleImportClick}
            >
              Import Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ImportWalletModal 
        open={showImport}
        onOpenChange={setShowImport}
        onCancel={() => {
          setShowImport(false)
          onOpenChange(true)
        }}
        onImport={handleConnect}
      />
    </>
  )
}

