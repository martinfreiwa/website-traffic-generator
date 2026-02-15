
import React from 'react';
import { MenuSection } from '../types';
import { LogOut, ChevronRight, User } from 'lucide-react';
import { db } from '../services/db';

interface SidebarProps {
  menuSections: MenuSection[];
  currentView: string;
  onNavigate: (viewId: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ menuSections, currentView, onNavigate, onLogout }) => {
  const user = db.getCurrentUser();

  return (
    <aside className="w-64 bg-[#111111] text-white flex flex-col h-screen fixed left-0 top-0 z-20 hidden md:flex border-r border-gray-800 shadow-xl">
      {/* Logo Area */}
      <div className="p-8 pb-10 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#ff4d00] flex items-center justify-center">
          <span className="font-black text-black text-lg">T</span>
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tighter leading-none">TRAFFIC</h1>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Creator OS</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="space-y-6">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={sectionIndex > 0 ? "pt-6 border-t border-gray-800/50" : ""}>
              {/* REMOVED SUBHEADING as requested */}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => onNavigate(item.id)}
                        className={`w-full group flex items-center justify-between px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-200 rounded-sm
                          ${isActive
                            ? 'bg-[#ff4d00] text-white shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                            : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon && <span className={isActive ? 'text-white' : 'text-gray-600 group-hover:text-[#ff4d00]'}>{item.icon}</span>}
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight size={14} className="animate-in slide-in-from-left-2" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] space-y-4">
        {user && (
          <div className="px-4 py-2 bg-[#1a1a1a] rounded-sm border border-gray-800/50">
            <div className="flex items-center gap-2 mb-1">
              <User size={12} className="text-[#ff4d00]" />
              <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate">
                {user.email}
              </span>
            </div>
            <div className="text-[9px] font-mono text-gray-500 truncate" title={user.id}>
              ID: {user.id.substring(0, 8).toUpperCase()}
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 border border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#ff4d00] hover:border-[#ff4d00] hover:bg-[#111] transition-all rounded-sm"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;