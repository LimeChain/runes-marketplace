import { Copy, Plus } from 'lucide-react'
import { Bitcoin } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { IBM_Plex_Mono } from 'next/font/google'

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'] })

export function Profile() {
  return (
    <div className="border-b border-[#2e343c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start gap-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-b from-yellow-300 via-blue-400 to-blue-500" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h1 className={`text-2xl ${ibmPlexMono.className}`}>bc1p...yldf</h1>
              <button className="text-[#a7afc0] hover:text-white">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bitcoin className="h-6 w-6 text-[#f7931a]" />
                <span className={`text-lg ${ibmPlexMono.className}`}>0.005792</span>
                <span className="text-[#a7afc0]">$600.00</span>
              </div>
              <Button 
                variant="secondary"
                className="rounded-full bg-[#2e343c] text-white hover:bg-[#2e343c]/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                List Token
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

