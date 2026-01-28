
import React, { useState } from 'react';
import { ViewType, User as UserType } from '../../types';
import { 
  Users, 
  Clock, 
  NotebookPen,
  Globe,
  Library,
  Sliders,
  ShieldCheck,
  Menu,
  X,
  Book,
  Wrench,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Target,
  LayoutDashboard,
  Loader2,
  FileText
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
  hasActiveProject?: boolean;
  hiddenViews?: ViewType[];
  onToggleAi?: () => void;
  isAiOpen?: boolean;
  currentUser: UserType;
  isProcessing?: boolean;
}

interface NavItemConfig {
  label: string;
  icon: any;
  emblem: string;
  view: ViewType;
  relatedViews: ViewType[];
  colorClass?: string;
}

const intakeNavItems: NavItemConfig[] = [
  { label: 'Library', icon: Library, emblem: '📚', view: ViewType.BOOKSHELF, relatedViews: [ViewType.BOOKSHELF], colorClass: 'text-amber-500 bg-amber-500/10' },
  { label: 'Notebook', icon: NotebookPen, emblem: '📓', view: ViewType.NOTES, relatedViews: [ViewType.NOTES], colorClass: 'text-emerald-500 bg-emerald-500/10' },
  { label: 'Dashboard', icon: LayoutDashboard, emblem: '📊', view: ViewType.DASHBOARD, relatedViews: [ViewType.DASHBOARD], colorClass: 'text-blue-500 bg-blue-500/10' },
];

const engineNavItems: NavItemConfig[] = [
  { label: 'Characters', icon: Users, emblem: '👤', view: ViewType.CHARACTERS, relatedViews: [ViewType.CHARACTERS], colorClass: 'text-purple-500 bg-purple-500/10' },
  { label: 'World Hub', icon: Globe, emblem: '🌍', view: ViewType.MAP, relatedViews: [ViewType.MAP, ViewType.LOCATIONS, ViewType.ENCYCLOPEDIA, ViewType.INVENTORY, ViewType.DICTIONARY, ViewType.GALLERY], colorClass: 'text-cyan-500 bg-cyan-500/10' },
  { label: 'Continuity', icon: Clock, emblem: '🧶', view: ViewType.TIMELINE, relatedViews: [ViewType.TIMELINE, ViewType.BOARD, ViewType.MATRIX, ViewType.PLOT_ANALYSIS, ViewType.CALENDAR], colorClass: 'text-rose-500 bg-rose-500/10' },
  { label: 'Manuscript', icon: FileText, emblem: '📂', view: ViewType.MANUSCRIPT, relatedViews: [ViewType.MANUSCRIPT, ViewType.PROCESSOR, ViewType.SOURCE_READER, ViewType.TABLE], colorClass: 'text-indigo-500 bg-indigo-500/10' },
];

const systemNavItems: NavItemConfig[] = [
  { label: 'Toolbox', icon: Wrench, emblem: '🧰', view: ViewType.TOOLBOX, relatedViews: [ViewType.TOOLBOX], colorClass: 'text-slate-500 bg-slate-500/10' },
  { label: 'Settings', icon: Sliders, emblem: '👤', view: ViewType.SETTINGS, relatedViews: [ViewType.SETTINGS], colorClass: 'text-pink-500 bg-pink-500/10' },
  { label: 'Admin', icon: ShieldCheck, emblem: '⚙️', view: ViewType.ADMIN, relatedViews: [ViewType.ADMIN], colorClass: 'text-red-500 bg-red-500/10' },
];

const PlotholeLogo: React.FC<{ size?: number }> = ({ size = 42 }) => (
  <div style={{ width: size, height: size }} className="relative group cursor-pointer active:scale-95 transition-transform flex-shrink-0">
    <div className="absolute inset-0 bg-slate-950 rounded-xl overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] border border-white/5" />
    <div className="absolute inset-2 rounded-full bg-indigo-500/20 blur-xl group-hover:bg-indigo-400/30 transition-colors" />
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-2.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
      <defs>
        <linearGradient id="pilcrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
      </defs>
      <path 
        d="M65 15 H40 C28.95 15 20 23.95 20 35 C20 46.05 28.95 55 40 55 H45 V85 H53 V15 H60 V85 H68 V15 Z" 
        fill="url(#pilcrowGradient)"
        className="transition-all duration-500 group-hover:brightness-110"
      />
      <path 
        d="M65 15 H40 C35 15 30 18 25 25 Q35 20 45 25 V15 H65 Z" 
        fill="white" 
        fillOpacity="0.15" 
      />
    </svg>
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-xl" />
  </div>
);

const NavButton: React.FC<{
  item: NavItemConfig;
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  isCollapsed: boolean;
  isDisabled?: boolean;
  isColorful?: boolean;
}> = ({ item, currentView, onChangeView, isCollapsed, isDisabled, isColorful }) => {
  const isActive = item.relatedViews.includes(currentView);
  const Icon = item.icon;
  
  return (
    <button
      onClick={() => !isDisabled && onChangeView(item.view)}
      disabled={isDisabled}
      title={isCollapsed ? item.label : ''}
      className={`
        group w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 px-4'} py-1.5 rounded-xl text-sm font-bold transition-all mb-0.5
        ${isActive 
          ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]' 
          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
        } 
        ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
      `}
    >
      <div className={`
        flex items-center justify-center rounded-lg transition-all
        ${isColorful && !isActive ? `p-1 text-base bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700` : ''}
        ${isColorful && isActive ? 'bg-white/20 p-1 text-base' : ''}
      `}>
        {isColorful ? (
          <span className={`${isActive ? '' : 'grayscale-[0.2]'} group-hover:grayscale-0 transition-all`}>
            {item.emblem}
          </span>
        ) : (
          <Icon 
            size={18} 
            className={`transition-all ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}
          />
        )}
      </div>
      {!isCollapsed && <span className="truncate tracking-tight">{item.label}</span>}
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  isCollapsed,
  onToggleCollapse,
  hasActiveProject = false,
  hiddenViews = [],
  onToggleAi,
  isAiOpen,
  currentUser,
  isProcessing = false
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isColorful = currentUser.preferences?.colorfulIcons;
  
  const getVisibleItems = (items: NavItemConfig[]) => 
    items.filter(item => !hiddenViews.includes(item.view));

  return (
    <>
      <div className={`hidden md:flex flex-col h-full ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex-shrink-0 transition-all duration-300 relative`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} py-6 flex-shrink-0`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <PlotholeLogo size={isCollapsed ? 32 : 38} />
            {!isCollapsed && <span className="font-sans font-black text-xl text-slate-800 dark:text-white tracking-tighter">PLOTHOLE</span>}
          </div>
        </div>

        <nav className="p-4 space-y-4 overflow-y-auto flex-1 no-scrollbar">
          <div>
            {!isCollapsed && <div className="px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">The Intake</div>}
            {getVisibleItems(intakeNavItems).map((item) => (
              <NavButton key={item.label} item={item} currentView={currentView} onChangeView={onChangeView} isCollapsed={isCollapsed} isColorful={isColorful} />
            ))}
          </div>

          <div>
            {!isCollapsed && <div className="px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">The Creative Engine</div>}
            {getVisibleItems(engineNavItems).map((item) => (
              <NavButton key={item.label} item={item} currentView={currentView} onChangeView={onChangeView} isCollapsed={isCollapsed} isDisabled={!hasActiveProject} isColorful={isColorful} />
            ))}
          </div>

          <div className="mt-auto">
            {!isCollapsed && <div className="px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">The System</div>}
            {getVisibleItems(systemNavItems).map((item) => (
              <NavButton key={item.label} item={item} currentView={currentView} onChangeView={onChangeView} isCollapsed={isCollapsed} isColorful={isColorful} />
            ))}
          </div>
        </nav>
        
        <button 
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 bg-white dark:bg-slate-800 text-slate-400 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-md hover:text-primary transition-all z-50 hover:scale-110 active:scale-95"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {isProcessing && (
          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 border-t border-indigo-100 dark:border-indigo-900 flex items-center justify-center gap-2">
            <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
            {!isCollapsed && <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">AI Busy</span>}
          </div>
        )}

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
           <div className={`text-[9px] font-black uppercase tracking-widest text-slate-400 text-center ${isCollapsed ? 'hidden' : ''}`}>
             <p>Build 2.6.0 • Companion</p>
           </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 flex items-center justify-around px-4 shadow-lg">
        <button onClick={() => onChangeView(ViewType.BOOKSHELF)} className={`p-2 rounded-xl transition-all ${currentView === ViewType.BOOKSHELF ? 'bg-primary/10 text-primary' : 'text-slate-400'}`}>
           {isColorful ? <span className="text-xl">📚</span> : <Library size={24} />}
        </button>
        <button onClick={() => onChangeView(ViewType.NOTES)} className={`p-2 rounded-xl transition-all ${currentView === ViewType.NOTES ? 'bg-primary/10 text-primary' : 'text-slate-400'}`}>
           {isColorful ? <span className="text-xl">📓</span> : <NotebookPen size={24} />}
        </button>
        <button onClick={onToggleAi} className={`p-2 rounded-full transform transition-all active:scale-90 relative ${isAiOpen ? 'bg-indigo-600 text-white shadow-xl rotate-12' : 'text-indigo-500 bg-indigo-500/10 shadow-sm'}`}>
           <Sparkles size={24} />
           {isProcessing && <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-50" />}
        </button>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
           <Menu size={24} />
        </button>
      </div>

      {isMobileMenuOpen && (
         <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-[2.5rem] max-h-[85vh] overflow-y-auto p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
               <div className="flex justify-between items-center mb-8">
                  <span className="font-black text-2xl tracking-tighter dark:text-white uppercase">Menu</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full"><X size={24} /></button>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  {[...intakeNavItems, ...engineNavItems, ...systemNavItems].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { onChangeView(item.view); setIsMobileMenuOpen(false); }}
                      className={`
                        flex flex-col items-center p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 transition-all active:scale-95
                        ${item.relatedViews.includes(currentView) ? 'bg-primary text-white shadow-xl shadow-primary/20 ring-4 ring-primary/10' : 'bg-slate-50 dark:bg-slate-800/50'}
                      `}
                    >
                      <div className={`p-4 rounded-2xl mb-3 flex items-center justify-center ${item.relatedViews.includes(currentView) ? 'bg-white/20' : (isColorful ? 'bg-white dark:bg-slate-700 shadow-sm text-2xl' : 'text-slate-500')}`}>
                        {isColorful ? (
                           <span className={item.relatedViews.includes(currentView) ? '' : 'grayscale-[0.2]'}>{item.emblem}</span>
                        ) : (
                           <item.icon size={28} />
                        )}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${item.relatedViews.includes(currentView) ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>{item.label}</span>
                    </button>
                  ))}
               </div>
            </div>
         </div>
      )}
    </>
  );
};
