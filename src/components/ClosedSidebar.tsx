import React from 'react';
import {
  Home,
  Film,
  Flame,
  FolderHeart,
  Compass,
  Radio,
  Tv,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export type SidebarPageId = 'home' | 'movies' | 'adult' | 'library' | 'plans' | 'account';

interface ClosedSidebarProps {
  currentPage: SidebarPageId;
  onNavigate: (page: SidebarPageId) => void;
  moviesCount?: number;
  adultCount?: number;
}

export const ClosedSidebar: React.FC<ClosedSidebarProps> = ({
  currentPage,
  onNavigate,
  moviesCount = 0,
  adultCount = 0,
}) => {
  const items: {
    id: SidebarPageId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'movies',
      label: 'Movies',
      icon: Film,
      badge: moviesCount > 0 ? moviesCount : undefined,
    },
    {
      id: 'adult',
      label: 'Adult (18+)',
      icon: ShieldAlert,
      badge: adultCount > 0 ? adultCount : '18+',
    },
    {
      id: 'library',
      label: 'Library',
      icon: FolderHeart,
    },
    {
      id: 'plans',
      label: 'Vifurushi',
      icon: Sparkles,
    },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-[72px] hover:w-56 group/sidebar transition-all duration-300 ease-in-out bg-black border-r border-[#222222] h-[calc(100vh-3.5rem)] sticky top-14 z-30 select-none overflow-hidden hover:shadow-2xl"
      aria-label="Closed Navigation Sidebar"
    >
      <div className="py-2.5 space-y-1 px-1.5 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {items.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-3.5 py-3 rounded-xl transition duration-150 cursor-pointer text-left relative ${
                isActive
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#181818]'
              }`}
              title={item.label}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-black rounded-r" />
              )}

              {/* Icon Container */}
              <div className="shrink-0 flex items-center justify-center w-6 h-6">
                <Icon
                  className={`w-5 h-5 transition-transform group-hover/sidebar:scale-105 ${
                    isActive ? 'text-black' : 'text-slate-300'
                  }`}
                />
              </div>

              {/* Label: Closed in 72px state, smoothly expands on hover */}
              <div className="flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 flex items-center justify-between">
                <span className="text-xs font-semibold truncate tracking-wide">
                  {item.label}
                </span>

                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive
                        ? 'bg-black text-white'
                        : 'bg-[#222222] text-slate-300 border border-[#333333]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mini Footer indicator in expanded view */}
      <div className="p-3 border-t border-[#1a1a1a] opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
        <p className="text-[10px] text-slate-600 font-mono text-center">
          NeliTv web © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
};
