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
import { useWalletStore } from "@/store/useWalletStore"
import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'

interface ImportWalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onImport: (address: string) => void
}

export function ImportWalletModal({ open, onOpenChange, onCancel, onImport }: ImportWalletModalProps) {
  const [seedPhrase, setSeedPhrase] = useState<string[]>(Array(12).fill(""))
  const { setSeedPhrase: storeSeedPhrase, setPrivateKey, setAddress } = useWalletStore()

  const buttonDisabled = seedPhrase.includes("")

  const handleImport = async () => {
    const mnemonicString = seedPhrase.join(' ')
    const btc = await import('bitcore-lib-inquisition')

    if (bip39.validateMnemonic(mnemonicString, wordlist)) {
      const seed = bip39.mnemonicToSeedSync(mnemonicString)
      const seedBuffer = Buffer.from(seed)
      const xpriv = btc.HDPrivateKey.fromSeed(seedBuffer)

      let pk

      // Hack to only use private keys with even public key
      for (let i = 0; i < 100; i++) {
        pk = xpriv.deriveChild(`m/86'/0'/0'/0/${i}`)
        if (pk.privateKey.toPublicKey().toString().startsWith('02')) {
          console.log(i)
          break
        }
      }
      
      const address = pk.privateKey.toAddress(btc.Networks.regtest, btc.Address.PayToWitnessPublicKeyHash).toString()
  
      storeSeedPhrase(seedPhrase)
      setPrivateKey(pk.privateKey.toWIF())
  
      setAddress(address)
      onImport(address)
      onOpenChange(false)
    } else {
      console.log("invalid")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black text-white border-[#2e343c]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Import Wallet</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            To import a wallet enter below the 12-word seed phrase.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 p-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
              <Input
                value={seedPhrase[i]}
                onChange={(e) => {
                  const splitSeed = e.target.value.split(' ')
                  const newPhrase = []
                  if (i == 0 && splitSeed.length === 12) {
                    for (let j = 0; j < 12; j++) {
                      newPhrase[j] = splitSeed[j]
                    }
                    setSeedPhrase(newPhrase)
                  } else {
                    const newPhrase = [...seedPhrase]
                    newPhrase[i] = e.target.value
                    setSeedPhrase(newPhrase)
                  }
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
            disabled={buttonDisabled}
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

