/**
 * PortalSidebar — Collapsible sidebar for all portal layouts
 * Collapsed: icons only (~64px) · Expanded: icons + labels (~240px)
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import AdSidebar from './AdSidebar';

export default function PortalSidebar({ portal, navItems, onLogout }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className={`
      ${expanded ? 'w-60' : 'w-[68px]'} min-h-screen bg-[#0B1120] border-r border-white/5
      flex flex-col flex-shrink-0 transition-all duration-300 ease-out
    `}>
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className={`flex items-center gap-2.5 ${expanded ? '' : 'justify-center w-full'}`}>
          <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-sm">N</span>
          </div>
          {expanded && <span className="font-bold text-white text-sm">{portal}</span>}
        </div>
      </div>

      {/* Toggle */}
      <div className={`p-2 border-b border-white/5 flex ${expanded ? 'justify-end' : 'justify-center'}`}>
        <button onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={i} to={item.href} title={!expanded ? item.label : undefined}
              className={`
                flex items-center ${expanded ? 'gap-3 px-3' : 'justify-center px-2'} py-2.5 rounded-lg text-sm transition-all duration-150
                ${isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}
              `}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {expanded && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Ads */}
      {expanded && <div className="px-2 pb-2"><AdSidebar /></div>}

      {/* Logout */}
      <div className={`p-2 border-t border-white/5 ${expanded ? '' : 'flex justify-center'}`}>
        <button onClick={onLogout} title={!expanded ? 'Logout' : undefined}
          className={`
            flex items-center ${expanded ? 'gap-3 px-3 w-full' : 'justify-center px-2'} py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all
          `}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {expanded && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
