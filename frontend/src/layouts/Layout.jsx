import React, { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, Search, Upload, GitCompare,
  Database, Info, ChevronLeft, ChevronRight,
  Cpu, Shield, Menu, X
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/detect',     icon: Search,          label: 'Detect Transaction' },
  { to: '/batch',      icon: Upload,          label: 'Batch Detection' },
  { to: '/algorithms', icon: Cpu,             label: 'ML Algorithms' },
  { to: '/compare',    icon: GitCompare,      label: 'Model Comparison' },
  { to: '/dataset',    icon: Database,        label: 'Dataset Explorer' },
  { to: '/about',      icon: Info,            label: 'About' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300
          ${collapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
            <Shield size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm gradient-text">FraudShield AI</span>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm transition-colors mb-1
                 ${isActive
                   ? 'bg-purple-900/40 text-purple-400 font-medium'
                   : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                 }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="hidden md:flex items-center justify-center p-4 text-slate-500 hover:text-slate-200 transition-colors"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center gap-3 p-4 border-b"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <button onClick={() => setMobileOpen(p => !p)} aria-label="Open menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: '#7c3aed' }} />
            <span className="font-bold text-sm gradient-text">FraudShield AI</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
