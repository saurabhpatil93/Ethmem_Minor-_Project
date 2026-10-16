'use client'

import { Bell, User } from 'lucide-react'

export default function DashboardHeader() {

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Welcome back, User
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2.5 bg-card-darker hover:bg-card-dark rounded-full transition-all duration-200 hover:scale-105 group border border-white/5">
          <Bell className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full"></span>
        </button>

      </div>
    </header>
  );
}

