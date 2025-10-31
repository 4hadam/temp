"use client"

import { Menu, Search, Share2, X } from "lucide-react"
import { useState } from "react"

interface HeaderProps {
  onMenuClick?: () => void
}

function Header({ onMenuClick }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleMenuClick = () => {
    setMenuOpen(!menuOpen)
    onMenuClick?.()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-slate-800 h-16">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-4 h-full gap-2 sm:gap-4">
        {/* Logo and Menu */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={handleMenuClick}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors lg:hidden flex-shrink-0"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <div className="bg-lime-400 text-black font-bold px-1.5 sm:px-2 py-0.5 rounded text-xs">TV</div>
            <span className="text-white font-semibold text-xs sm:text-sm truncate">garden</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors" aria-label="Search">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors hidden sm:block" aria-label="Share">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export { Header }
export default Header
