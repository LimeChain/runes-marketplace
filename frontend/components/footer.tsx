import { IBM_Plex_Mono } from 'next/font/google'

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'] })

export function Footer() {
  return (
    <footer className="border-t border-[#2e343c] py-4 bg-[#070708]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-sm text-[#a7afc0]">
        <div className="mb-4 sm:mb-0">
          © 2024 Name | All rights reserved | 
          <span className={ibmPlexMono.className}> info@name.com</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
          <a href="#" className="hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M22.05 7.74a10.2 10.2 0 0 1-2.89.8 5.04 5.04 0 0 0 2.2-2.8c-.96.58-2.02.99-3.16 1.22A5.05 5.05 0 0 0 14.68 5c-2.8 0-5.06 2.26-5.06 5.06c0 .4.04.78.13 1.15A14.37 14.37 0 0 1 1.67 6.15a5.1 5.1 0 0 0-.69 2.55c0 1.75.89 3.3 2.25 4.2c-.83-.03-1.6-.25-2.29-.63v.06c0 2.45 1.75 4.5 4.07 4.97a5.05 5.05 0 0 1-2.29.08a5.08 5.08 0 0 0 4.73 3.52A10.14 10.14 0 0 1 1 22.18a14.3 14.3 0 0 0 7.76 2.27c9.31 0 14.4-7.72 14.4-14.4c0-.22 0-.44-.02-.65a10.3 10.3 0 0 0 2.53-2.63z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}

