'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Puzzle,
  Menu,
  X
} from 'lucide-react'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3
  },
  {
    name: 'Integrations',
    href: '/dashboard/integrations',
    icon: Puzzle
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center p-1.5">
          <img src="/logo.png" alt="EthMem" className="w-full h-full object-contain" />
        </div>
        <span className="text-2xl font-bold text-emerald-300">EthMem</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${active
                  ? 'bg-emerald-700/30 text-emerald-300 shadow-lg shadow-emerald-700/20 border-l-4 border-emerald-400'
                  : 'text-sidebar-text hover:bg-white/5 hover:text-emerald-300 border-l-4 border-transparent'
                }`}
              onClick={() => setIsMobileOpen(false)}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar-dark min-h-screen p-6 flex-col fixed left-0 top-0 bottom-0 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`md:hidden fixed left-0 top-0 w-64 bg-sidebar-dark min-h-screen p-6 flex flex-col z-40 transform transition-transform shadow-2xl ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <SidebarContent />
      </aside>
    </>
  )
}
