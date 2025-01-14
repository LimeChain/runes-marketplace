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
import { Input } from "@/components/ui/input"

interface ImportWalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onImport: (address: string) => void
}

export function ImportWalletModal({ open, onOpenChange, onCancel, onImport }: ImportWalletModalProps) {
  const [seedPhrase, setSeedPhrase] = useState<string[]>(Array(12).fill(""))

  const handleImport = () => {
    // Simulate wallet import with a hardcoded address
    onImport("bc1p7x8v2z4yldf")
    onOpenChange(false) // Close the modal after successful import
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black text-white border-[#2e343c]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Import Wallet</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            To import a wallet enter bellow the 12-word seed phrase.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 p-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
              <Input
                value={seedPhrase[i]}
                onChange={(e) => {
                  const newPhrase = [...seedPhrase]
                  newPhrase[i] = e.target.value
                  setSeedPhrase(newPhrase)
                }}
                className="bg-[#2e343c] border-0 text-white focus-visible:ring-1 focus-visible:ring-[#ff7531]"
                placeholder="Word"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-3 px-4 pb-4">
          <Button 
            onClick={handleImport}
            className="w-full bg-[#ff7531] hover:bg-[#ff7531]/90 text-white"
          >
            Import
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-muted-foreground hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

