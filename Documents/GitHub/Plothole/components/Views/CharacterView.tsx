
import React, { useState, useMemo } from 'react';
import { Character, Location, Note, ViewType, TimelineEvent, Artifact, ManuscriptHistoryEntry } from '../../types';
import { Button } from '../ui/Button';
import { 
  Edit2, Plus, Star, ChevronDown, 
  Image as ImageIcon, MapPin, Package, Clock, History, FileText, Tag, ChevronRight, Sparkles, User
} from 'lucide-react';
import { SmartText } from '../ui/SmartText';

interface CharacterViewProps {
  projectTitle: string;
  characters: Character[];
  locations: Location[];
  timeline: TimelineEvent[];
  artifacts: Artifact[];
  themes: string[];
  notes: Note[];
  manuscriptHistory: ManuscriptHistoryEntry[];
  onUpdateCharacter: (updated: Character) => void;
  onAddCharacter: (char: Character) => void;
  onLinkClick: (type: 'character' | 'location', id: string) => void;
  characterLimit?: number; 
  onChangeView: (view: ViewType) => void;
  onExtractThemesFromNotes?: () => Promise<void>;
  isExtractingThemes?: boolean;
}

export const CharacterView: React.FC<CharacterViewProps> = ({ 
  projectTitle,
  characters, 
  locations,
  timeline,
  artifacts,
  themes,
  notes,
  manuscriptHistory,
  onUpdateCharacter,
  onAddCharacter,
  characterLimit = 6,
  onLinkClick,
  onChangeView,
  onExtractThemesFromNotes,
  isExtractingThemes = false
}) => {
  const [activeTabId, setActiveTabId] = useState('Cast');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const tabs = [
    { id: 'Cast', label: 'Cast', color: 'bg-purple-600' },
    { id: 'Outline', label: 'Outline', color: 'bg-emerald-500' },
    { id: 'Locations', label: 'Locations', color: 'bg-orange-400' },
    { id: 'Items', label: 'Items', color: 'bg-teal-500' },
    { id: 'Themes', label: 'Themes', color: 'bg-blue-500' },
    { id: 'Edits', label: 'Edits', color: 'bg-slate-400' }
  ];

  const fullCast = useMemo(() => characters.slice(0, characterLimit), [characters, characterLimit]);
  const secondaryCast = useMemo(() => characters.slice(characterLimit), [characters, characterLimit]);

  const renderContent = () => {
    switch (activeTabId) {
      case 'Outline':
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Story Outline Beats</h2>
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pb-10">
              {timeline.length === 0 ? (
                <div className="ml-6 py-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed dark:border-slate-800">
                    <Clock className="mx-auto mb-3 opacity-20" size={32} />
                    <p className="text-slate-400 italic">No timeline beats recorded yet.</p>
                </div>
              ) : timeline.map((e, idx) => (
                <div key={e.id} className="relative pl-8">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-emerald-500 shadow-sm" />
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-300 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">{e.date}</span>
                        <span className="text-[10px] font-mono text-slate-300">BEAT #{idx + 1}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{e.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">{e.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Locations':
        return (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed dark:border-slate-800">
                    <MapPin className="mx-auto mb-4 opacity-10" size={48} />
                    <p className="text-slate-400 italic">No locations mapped yet.</p>
                </div>
            ) : locations.map(l => (
              <div key={l.id} onClick={() => onLinkClick('location', l.id)} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-500 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <MapPin size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l.type}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">{l.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{l.description}</p>
              </div>
            ))}
          </div>
        );
      case 'Items':
        return (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artifacts.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed dark:border-slate-800">
                    <Package className="mx-auto mb-4 opacity-10" size={48} />
                    <p className="text-slate-400 italic">No significant artifacts logged.</p>
                </div>
            ) : artifacts.map(a => (
              <div key={a.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-xl group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{a.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{a.type}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-4">{a.description}</p>
              </div>
            ))}
          </div>
        );
      case 'Themes':
        return (
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-[2rem] border border-blue-100 dark:border-blue-900/40">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-blue-500 flex items-center gap-2">
                  <Tag size={16} /> Central Thematic Pillars
                </h3>
                {onExtractThemesFromNotes && (
                   <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-black text-[10px] uppercase tracking-widest"
                      onClick={onExtractThemesFromNotes}
                      isLoading={isExtractingThemes}
                   >
                     <Sparkles size={12} className="mr-2" /> Analyze Notes for Themes
                   </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {themes.length === 0 ? <span className="text-slate-400 italic text-sm">No themes detected in current draft.</span> : themes.map(t => (
                  <span key={t} className="px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-200 rounded-2xl text-sm font-bold shadow-sm hover:scale-105 transition-transform cursor-default">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      case 'Edits':
        return (
          <div className="max-w-4xl mx-auto space-y-8">
             <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <History size={24} className="text-slate-400" /> Version History Vault
                 </h2>
             </div>
             <div className="space-y-4">
                {manuscriptHistory.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed dark:border-slate-800">
                        <FileText className="mx-auto mb-4 opacity-10" size={48} />
                        <p className="text-slate-400 italic">No upload snapshots archived.</p>
                    </div>
                ) : manuscriptHistory.slice(0, 5).map(h => (
                   <div key={h.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/50 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                           <FileText size={24} />
                        </div>
                        <div className="min-w-0">
                           <div className="font-bold text-slate-800 dark:text-slate-100 truncate">{h.filename}</div>
                           <div className="text-xs text-slate-400 font-medium">{new Date(h.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="ghost" size="sm" className="text-xs font-bold">Diff View</Button>
                         <Button variant="secondary" size="sm" className="text-xs font-bold rounded-xl px-4">Restore Snapshot</Button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        );
      default: // Cast
        return (
          <div className="max-w-7xl mx-auto space-y-20 pb-32">
             {/* CORE CAST */}
             <div className="space-y-8">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-4">
                   <span className="bg-slate-200 dark:bg-slate-800 h-px flex-1" />
                   Core Dramatis Personae
                   <span className="bg-slate-200 dark:bg-slate-800 h-px flex-1" />
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {fullCast.map(c => (
                    <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row h-full group">
                        <div className="flex-1 p-8 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                            <h3 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 font-serif leading-tight">{c.name}</h3>
                            <div className="flex items-center gap-3 text-slate-300">
                                <Star size={24} className={c.name === 'Basil' ? 'fill-primary text-primary' : 'hover:text-amber-400 cursor-pointer'} />
                                <Edit2 size={20} className="hover:text-slate-600 cursor-pointer" />
                            </div>
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 text-sm italic font-bold tracking-wide mb-6 uppercase">{c.role}</div>
                            
                            <div className="flex gap-3 mb-8">
                            <span className="px-3 py-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-800 rounded-xl text-[11px] font-black uppercase tracking-widest">{c.livingStatus || 'Alive'}</span>
                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 rounded-xl text-[11px] font-black uppercase tracking-widest">{c.species || 'Unknown'}</span>
                            </div>

                            <div className="space-y-6 flex-1">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-[0.2em] opacity-40">Biography Scan</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4 font-medium italic">"{c.description}"</p>
                            </div>
                            </div>
                            
                            <button onClick={() => setExpandedCardId(expandedCardId === c.id ? null : c.id)} className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary flex items-center gap-2 pt-6 border-t border-slate-50 dark:border-slate-800 transition-colors">
                            Access Entity Deep-Files <ChevronDown size={14} className={`transition-transform ${expandedCardId === c.id ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                        <div className="w-full md:w-80 h-80 md:h-auto relative overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                            <img src={c.imageUrl || `https://picsum.photos/seed/${c.name}/800/800`} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" alt={c.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
                        </div>
                    </div>
                    ))}
                </div>
             </div>

             {/* SECONDARY CAST */}
             {secondaryCast.length > 0 && (
                <div className="space-y-8">
                   <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-4">
                      <span className="bg-slate-200 dark:bg-slate-800 h-px flex-1" />
                      Secondary Entity Registry
                      <span className="bg-slate-200 dark:bg-slate-800 h-px flex-1" />
                   </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {secondaryCast.map(c => (
                        <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group flex items-start gap-4">
                           <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                              {c.imageUrl ? (
                                <img src={c.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={24}/></div>
                              )}
                           </div>
                           <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors">{c.name}</h3>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 truncate">{c.role}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic">"{c.description}"</p>
                           </div>
                           <ChevronRight size={16} className="mt-1 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-slate-950 font-sans overflow-hidden">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 z-20">
        <div>
           <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter uppercase">Blueprint Panel</h1>
              <div className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-800">Active</div>
           </div>
           <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1.5 uppercase tracking-widest">
             Source Mapping: <span className="font-black text-slate-700 dark:text-slate-300">{projectTitle || "Untitled Project"}</span>
             <ChevronDown size={14} className="text-slate-300" />
           </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" size="sm" className="font-black text-[10px] uppercase tracking-widest px-5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 shadow-sm" onClick={() => onChangeView(ViewType.DASHBOARD)}>Sync History</Button>
           <button className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95 group">
              <ImageIcon size={20} className="group-hover:rotate-6 transition-transform" />
           </button>
        </div>
      </div>

      <div className="px-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-end space-x-1 overflow-x-auto no-scrollbar flex-shrink-0 z-10">
        {tabs.map(tab => {
           const isActive = activeTabId === tab.id;
           return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`
                  px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] transition-all whitespace-nowrap border-b-2
                  ${isActive 
                    ? `border-primary text-primary bg-primary/5` 
                    : `border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800`
                  }
                `}
              >
                {tab.label}
              </button>
           );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-slate-50 dark:bg-slate-950">
        {renderContent()}
      </div>
    </div>
  );
};
